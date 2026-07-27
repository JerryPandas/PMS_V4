namespace PmsApi.Application.DTOs.Files;

public record ProjectFileDto(
    Guid Id,
    Guid ProjectId,
    string FileName,
    long FileSize,
    string DownloadUrl,
    string UploadedByName,
    DateTime UploadedAt
);
