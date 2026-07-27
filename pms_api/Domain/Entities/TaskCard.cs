namespace PmsApi.Domain.Entities;

public class TaskCard
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid? ProjectItemId { get; set; }
    public ProjectItem? ProjectItem { get; set; }

    public string Title { get; set; } = default!;
    public string? Description { get; set; }

    public Guid AssigneeId { get; set; }
    public User? Assignee { get; set; }

    public DateOnly ScheduledDate { get; set; } // drag target for weekly board
    public string KanbanColumn { get; set; } = "Todo";
    public string Priority { get; set; } = "Normal";
    public int SortOrder { get; set; }

    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaskChangeLog> ChangeLogs { get; set; } = new List<TaskChangeLog>();
}

public class TaskChangeLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public TaskCard? Task { get; set; }
    public string ChangeType { get; set; } = default!; // DateChanged / AssigneeChanged
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

public class ProjectFile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public string FileName { get; set; } = default!;
    public string StoragePath { get; set; } = default!;
    public long FileSize { get; set; }
    public Guid UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
