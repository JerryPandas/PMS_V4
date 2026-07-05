namespace PmsApi.Application.DTOs.Charts;

public record ColumnCountDto(string Column, int Count);

public record ProjectProgressDto(Guid ProjectId, int TotalTasks, List<ColumnCountDto> ByColumn);

public record WorkloadRowDto(Guid UserId, string DisplayName, int ActiveTaskCount, int DoneTaskCount);

public record PriorityBreakdownDto(string Priority, int Count);
