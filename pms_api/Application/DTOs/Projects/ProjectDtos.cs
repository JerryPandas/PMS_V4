namespace PmsApi.Application.DTOs.Projects;

public record ProjectDto(Guid Id, string ProjectCode, string Name, string? Description, string Status, DateTime CreatedAt);

public record CreateProjectRequest(string ProjectCode, string Name, string? Description);

public record ProjectItemDto(Guid Id, string? ItemCode, string Title, string Status, int SortOrder);

public record CreateProjectItemRequest(string? ItemCode, string Title);

public record UpdateProjectItemRequest(string Title, string Status);

public record ProjectDetailDto(
    Guid Id, string ProjectCode, string Name, string? Description, string Status,
    DateTime CreatedAt, List<ProjectItemDto> Items
);
