namespace PmsApi.Application.DTOs.Tasks;

public record TaskCardDto(
    Guid Id,
    Guid? ProjectId,
    Guid? ProjectItemId,
    string Title,
    string? Description,
    Guid AssigneeId,
    string AssigneeName,
    DateOnly ScheduledDate,
    string KanbanColumn,
    string Priority,
    int SortOrder
);

public record CreateTaskRequest(
    Guid? ProjectId,
    Guid? ProjectItemId,
    string Title,
    string? Description,
    Guid AssigneeId,
    DateOnly ScheduledDate,
    string Priority
);

public record UpdateKanbanColumnRequest(string KanbanColumn, int SortOrder);

public record DragTaskRequest(DateOnly? NewScheduledDate, Guid? NewAssigneeId);

public record TaskChangeLogDto(string ChangeType, string? OldValue, string? NewValue, string ChangedByName, DateTime ChangedAt);

public record TaskDetailDto(
    Guid Id,
    Guid? ProjectId,
    string? ProjectCode,
    Guid? ProjectItemId,
    string? ProjectItemTitle,
    string Title,
    string? Description,
    Guid AssigneeId,
    string AssigneeName,
    DateOnly ScheduledDate,
    string KanbanColumn,
    string Priority,
    Guid CreatedBy,
    string CreatedByName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<TaskChangeLogDto> ChangeLogs
);
