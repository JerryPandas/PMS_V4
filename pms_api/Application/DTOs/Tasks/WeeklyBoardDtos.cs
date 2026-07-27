namespace PmsApi.Application.DTOs.Tasks;

/// <summary>One row of the all-hands weekly board: a user + their tasks for the week.</summary>
public record WeeklyRowDto(Guid UserId, string DisplayName, string? AvatarUrl, List<TaskCardDto> Tasks);

public record WeeklyBoardDto(DateOnly WeekStart, DateOnly WeekEnd, List<WeeklyRowDto> Rows);
