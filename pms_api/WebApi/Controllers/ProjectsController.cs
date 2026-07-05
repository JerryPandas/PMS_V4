using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PmsApi.Application.DTOs.Projects;
using PmsApi.Domain.Entities;
using PmsApi.Domain.Enums;
using PmsApi.Infrastructure.Persistence;

namespace PmsApi.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProjectsController(AppDbContext db)
    {
        _db = db;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetAll()
    {
        var projects = await _db.Projects
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDto(p.Id, p.ProjectCode, p.Name, p.Description, p.Status, p.CreatedAt))
            .ToListAsync();

        return projects;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDetailDto>> GetById(Guid id)
    {
        var project = await _db.Projects
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null) return NotFound();

        var dto = new ProjectDetailDto(
            project.Id, project.ProjectCode, project.Name, project.Description, project.Status,
            project.CreatedAt,
            project.Items.OrderBy(i => i.SortOrder)
                .Select(i => new ProjectItemDto(i.Id, i.ItemCode, i.Title, i.Status, i.SortOrder))
                .ToList()
        );

        return dto;
    }

    [Authorize(Roles = $"{RoleType.Admin},{RoleType.Manager}")]
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create(CreateProjectRequest request)
    {
        if (await _db.Projects.AnyAsync(p => p.ProjectCode == request.ProjectCode))
            return Conflict(new { message = $"Project code '{request.ProjectCode}' is already in use." });

        var project = new Project
        {
            ProjectCode = request.ProjectCode,
            Name = request.Name,
            Description = request.Description,
            OwnerId = CurrentUserId
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = project.Id },
            new ProjectDto(project.Id, project.ProjectCode, project.Name, project.Description, project.Status, project.CreatedAt));
    }

    [Authorize(Roles = $"{RoleType.Admin},{RoleType.Manager}")]
    [HttpPost("{id:guid}/items")]
    public async Task<ActionResult<ProjectItemDto>> AddItem(Guid id, CreateProjectItemRequest request)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project is null) return NotFound();

        var maxSort = await _db.ProjectItems
            .Where(i => i.ProjectId == id)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync() ?? -1;

        var item = new ProjectItem
        {
            ProjectId = id,
            ItemCode = request.ItemCode,
            Title = request.Title,
            SortOrder = maxSort + 1
        };

        _db.ProjectItems.Add(item);
        await _db.SaveChangesAsync();

        return new ProjectItemDto(item.Id, item.ItemCode, item.Title, item.Status, item.SortOrder);
    }

    [Authorize(Roles = $"{RoleType.Admin},{RoleType.Manager}")]
    [HttpPatch("items/{itemId:guid}")]
    public async Task<ActionResult<ProjectItemDto>> UpdateItem(Guid itemId, UpdateProjectItemRequest request)
    {
        var item = await _db.ProjectItems.FindAsync(itemId);
        if (item is null) return NotFound();

        item.Title = request.Title;
        item.Status = request.Status;
        await _db.SaveChangesAsync();

        return new ProjectItemDto(item.Id, item.ItemCode, item.Title, item.Status, item.SortOrder);
    }

    [Authorize(Roles = $"{RoleType.Admin},{RoleType.Manager}")]
    [HttpDelete("items/{itemId:guid}")]
    public async Task<IActionResult> DeleteItem(Guid itemId)
    {
        var item = await _db.ProjectItems.FindAsync(itemId);
        if (item is null) return NotFound();

        // Tasks.ProjectItemId is a NoAction FK (see AppDbContext), so unlike a
        // SetNull FK it won't clear itself automatically — we do it here instead,
        // otherwise SaveChanges would throw a foreign key violation below.
        var affectedTasks = await _db.Tasks.Where(t => t.ProjectItemId == itemId).ToListAsync();
        foreach (var task in affectedTasks) task.ProjectItemId = null;

        _db.ProjectItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
