using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PmsApi.Application.DTOs.Tasks;
using PmsApi.Domain.Entities;
using PmsApi.Domain.Enums;
using PmsApi.Infrastructure.Persistence;
using System.Security.Claims;

namespace PmsApi.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;

    public TasksController(AppDbContext db)
    {
        _db = db;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string CurrentRole => User.FindFirst(ClaimTypes.Role)!.Value;
    private bool CanManageOthers => CurrentRole is RoleType.Admin or RoleType.Manager;

    [HttpGet("kanban")]
    public async Task<ActionResult<List<TaskCardDto>>> GetKanban([FromQuery] Guid projectId)
    {
        var tasks = await _db.Tasks
            .Include(t => t.Assignee)
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.KanbanColumn).ThenBy(t => t.SortOrder)
            .Select(t => new TaskCardDto(
                t.Id, t.ProjectId, t.ProjectItemId, t.Title, t.Description,
                t.AssigneeId, t.Assignee!.DisplayName, t.ScheduledDate,
                t.KanbanColumn, t.Priority, t.SortOrder))
            .ToListAsync();

        return tasks;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskDetailDto>> GetById(Guid id)
    {
        var task = await _db.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.Project)
            .Include(t => t.ProjectItem)
            .Include(t => t.ChangeLogs)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null) return NotFound();

        var creator = await _db.Users.FindAsync(task.CreatedBy);

        var changerIds = task.ChangeLogs.Select(l => l.ChangedBy).Distinct().ToList();
        var changerNames = await _db.Users
            .Where(u => changerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.DisplayName);

        return new TaskDetailDto(
            task.Id,
            task.ProjectId,
            task.Project?.ProjectCode,
            task.ProjectItemId,
            task.ProjectItem?.Title,
            task.Title,
            task.Description,
            task.AssigneeId,
            task.Assignee!.DisplayName,
            task.ScheduledDate,
            task.KanbanColumn,
            task.Priority,
            task.CreatedBy,
            creator?.DisplayName ?? "Unknown",
            task.CreatedAt,
            task.UpdatedAt,
            task.ChangeLogs
                .OrderByDescending(l => l.ChangedAt)
                .Select(l => new TaskChangeLogDto(
                    l.ChangeType, l.OldValue, l.NewValue,
                    changerNames.GetValueOrDefault(l.ChangedBy, "Unknown"), l.ChangedAt))
                .ToList()
        );
    }

    [HttpPost]
    public async Task<ActionResult<TaskCardDto>> Create(CreateTaskRequest request)
    {
        // Members can only create tasks assigned to themselves.
        if (!CanManageOthers && request.AssigneeId != CurrentUserId)
            return Forbid();

        var task = new TaskCard
        {
            ProjectId = request.ProjectId,
            ProjectItemId = request.ProjectItemId,
            Title = request.Title,
            Description = request.Description,
            AssigneeId = request.AssigneeId,
            ScheduledDate = request.ScheduledDate,
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? PriorityLevel.Normal : request.Priority,
            KanbanColumn = KanbanColumn.Todo,
            CreatedBy = CurrentUserId
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        var assignee = await _db.Users.FindAsync(task.AssigneeId);

        return new TaskCardDto(
            task.Id, task.ProjectId, task.ProjectItemId, task.Title, task.Description,
            task.AssigneeId, assignee!.DisplayName, task.ScheduledDate,
            task.KanbanColumn, task.Priority, task.SortOrder);
    }

    /// <summary>Moves a card to a different kanban column (drag within the board).</summary>
    [HttpPatch("{id:guid}/kanban-column")]
    public async Task<IActionResult> UpdateKanbanColumn(Guid id, UpdateKanbanColumnRequest request)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return NotFound();

        // Members may only move their own cards; Admin/Manager may move any.
        if (!CanManageOthers && task.AssigneeId != CurrentUserId)
            return Forbid();

        task.KanbanColumn = request.KanbanColumn;
        task.SortOrder = request.SortOrder;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// All-hands weekly board: one row per active user, with their tasks for the given week.
    /// weekStart should be a Monday; if omitted, defaults to the Monday of the current week.
    /// </summary>
    [HttpGet("weekly")]
    public async Task<ActionResult<WeeklyBoardDto>> GetWeekly([FromQuery] DateOnly? weekStart)
    {
        var monday = weekStart ?? StartOfWeek(DateOnly.FromDateTime(DateTime.UtcNow));
        var sunday = monday.AddDays(6);

        var users = await _db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.DisplayName)
            .ToListAsync();

        var tasksInWeek = await _db.Tasks
            .Include(t => t.Assignee)
            .Where(t => t.ScheduledDate >= monday && t.ScheduledDate <= sunday)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

        var rows = users.Select(u => new WeeklyRowDto(
            u.Id,
            u.DisplayName,
            u.AvatarUrl,
            tasksInWeek
                .Where(t => t.AssigneeId == u.Id)
                .Select(t => new TaskCardDto(
                    t.Id, t.ProjectId, t.ProjectItemId, t.Title, t.Description,
                    t.AssigneeId, u.DisplayName, t.ScheduledDate,
                    t.KanbanColumn, t.Priority, t.SortOrder))
                .ToList()
        )).ToList();

        return new WeeklyBoardDto(monday, sunday, rows);
    }

    /// <summary>
    /// Drag-and-drop on the weekly board: reschedule to a new date and/or reassign to a
    /// different person. The frontend must show a confirmation dialog BEFORE calling this.
    /// </summary>
    [HttpPatch("{id:guid}/drag")]
    public async Task<ActionResult<TaskCardDto>> DragTask(Guid id, DragTaskRequest request)
    {
        var task = await _db.Tasks.Include(t => t.Assignee).FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return NotFound();

        var isReassigning = request.NewAssigneeId is not null && request.NewAssigneeId != task.AssigneeId;
        var isRescheduling = request.NewScheduledDate is not null && request.NewScheduledDate != task.ScheduledDate;

        // Members may only drag their OWN tasks, and may not reassign to someone else.
        if (!CanManageOthers)
        {
            if (task.AssigneeId != CurrentUserId) return Forbid();
            if (isReassigning) return Forbid();
        }

        if (isRescheduling)
        {
            _db.TaskChangeLogs.Add(new TaskChangeLog
            {
                TaskId = task.Id,
                ChangeType = ChangeType.DateChanged,
                OldValue = task.ScheduledDate.ToString("yyyy-MM-dd"),
                NewValue = request.NewScheduledDate!.Value.ToString("yyyy-MM-dd"),
                ChangedBy = CurrentUserId
            });
            task.ScheduledDate = request.NewScheduledDate.Value;
        }

        if (isReassigning)
        {
            var newAssignee = await _db.Users.FindAsync(request.NewAssigneeId!.Value);
            if (newAssignee is null) return BadRequest(new { message = "Target user not found." });

            _db.TaskChangeLogs.Add(new TaskChangeLog
            {
                TaskId = task.Id,
                ChangeType = ChangeType.AssigneeChanged,
                OldValue = task.Assignee?.DisplayName,
                NewValue = newAssignee.DisplayName,
                ChangedBy = CurrentUserId
            });
            task.AssigneeId = newAssignee.Id;
            task.Assignee = newAssignee;
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new TaskCardDto(
            task.Id, task.ProjectId, task.ProjectItemId, task.Title, task.Description,
            task.AssigneeId, task.Assignee!.DisplayName, task.ScheduledDate,
            task.KanbanColumn, task.Priority, task.SortOrder);
    }

    private static DateOnly StartOfWeek(DateOnly date)
    {
        // Monday-based week.
        var diff = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return date.AddDays(-diff);
    }
}
