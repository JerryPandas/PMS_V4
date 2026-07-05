namespace PmsApi.Domain.Entities;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProjectCode { get; set; } = default!; // e.g. 26AA01
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string Status { get; set; } = "Active";
    public Guid OwnerId { get; set; }
    public User? Owner { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProjectItem> Items { get; set; } = new List<ProjectItem>();
    public ICollection<TaskCard> Tasks { get; set; } = new List<TaskCard>();
    public ICollection<ProjectFile> Files { get; set; } = new List<ProjectFile>();
}

public class ProjectItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public string? ItemCode { get; set; } // e.g. 26AA01-01
    public string Title { get; set; } = default!;
    public string Status { get; set; } = "Todo";
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
