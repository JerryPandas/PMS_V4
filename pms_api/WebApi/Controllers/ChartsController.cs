using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PmsApi.Application.DTOs.Charts;
using PmsApi.Domain.Enums;
using PmsApi.Infrastructure.Persistence;

namespace PmsApi.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/charts")]
public class ChartsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ChartsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Kanban column distribution for one project (for a pie/bar chart).</summary>
    [HttpGet("progress")]
    public async Task<ActionResult<ProjectProgressDto>> GetProgress([FromQuery] Guid projectId)
    {
        var tasks = await _db.Tasks.Where(t => t.ProjectId == projectId).ToListAsync();

        var byColumn = new[] { KanbanColumn.Todo, KanbanColumn.InProgress, KanbanColumn.Review, KanbanColumn.Done }
            .Select(col => new ColumnCountDto(col, tasks.Count(t => t.KanbanColumn == col)))
            .ToList();

        return new ProjectProgressDto(projectId, tasks.Count, byColumn);
    }

    /// <summary>
    /// Team workload: active (not Done) vs completed task counts per active user,
    /// across all projects. Powers the team workload bar chart.
    /// </summary>
    [HttpGet("workload")]
    public async Task<ActionResult<List<WorkloadRowDto>>> GetWorkload()
    {
        var users = await _db.Users.Where(u => u.IsActive).OrderBy(u => u.DisplayName).ToListAsync();
        var tasks = await _db.Tasks.ToListAsync();

        var rows = users.Select(u => new WorkloadRowDto(
            u.Id,
            u.DisplayName,
            tasks.Count(t => t.AssigneeId == u.Id && t.KanbanColumn != KanbanColumn.Done),
            tasks.Count(t => t.AssigneeId == u.Id && t.KanbanColumn == KanbanColumn.Done)
        )).ToList();

        return rows;
    }

    /// <summary>Priority breakdown across a project's tasks (for a secondary pie chart).</summary>
    [HttpGet("priority-breakdown")]
    public async Task<ActionResult<List<PriorityBreakdownDto>>> GetPriorityBreakdown([FromQuery] Guid projectId)
    {
        var tasks = await _db.Tasks.Where(t => t.ProjectId == projectId).ToListAsync();

        var result = new[] { PriorityLevel.Low, PriorityLevel.Normal, PriorityLevel.High }
            .Select(p => new PriorityBreakdownDto(p, tasks.Count(t => t.Priority == p)))
            .ToList();

        return result;
    }
}
