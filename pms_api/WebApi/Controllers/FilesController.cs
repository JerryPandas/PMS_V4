using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PmsApi.Application.DTOs.Files;
using PmsApi.Application.Interfaces;
using PmsApi.Domain.Entities;
using PmsApi.Domain.Enums;
using PmsApi.Infrastructure.Persistence;
using System.Security.Claims;

namespace PmsApi.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private readonly AppDbContext _db;
    private readonly IFileStorageService _storage;

    public FilesController(AppDbContext db, IFileStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string CurrentRole => User.FindFirst(ClaimTypes.Role)!.Value;
    private bool CanManageOthers => CurrentRole is RoleType.Admin or RoleType.Manager;

    [HttpGet]
    public async Task<ActionResult<List<ProjectFileDto>>> GetByProject([FromQuery] Guid projectId)
    {
        var files = await _db.ProjectFiles
            .Include(f => f.Project) // not strictly needed, but keeps EF from lazy-loading later
            .Where(f => f.ProjectId == projectId)
            .OrderByDescending(f => f.UploadedAt)
            .ToListAsync();

        var uploaderIds = files.Select(f => f.UploadedBy).Distinct().ToList();
        var uploaderNames = await _db.Users
            .Where(u => uploaderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.DisplayName);

        return files.Select(f => new ProjectFileDto(
            f.Id, f.ProjectId, f.FileName, f.FileSize,
            _storage.GetDownloadUrl(f.StoragePath),
            uploaderNames.GetValueOrDefault(f.UploadedBy, "Unknown"),
            f.UploadedAt
        )).ToList();
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxFileSizeBytes)]
    public async Task<ActionResult<ProjectFileDto>> Upload([FromForm] UploadFileRequest request)
    {
        var file = request.File;
        var projectId = request.ProjectId;

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file was provided." });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { message = "File exceeds the 10 MB limit." });

        var projectExists = await _db.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists) return NotFound(new { message = "Project not found." });

        // Duplicate detection: same file name + size already uploaded to this project.
        var isDuplicate = await _db.ProjectFiles.AnyAsync(f =>
            f.ProjectId == projectId && f.FileName == file.FileName && f.FileSize == file.Length);
        if (isDuplicate)
            return Conflict(new { message = "A file with the same name and size already exists on this project." });

        await using var stream = file.OpenReadStream();
        var relativePath = await _storage.SaveAsync(stream, file.FileName, projectId);

        var record = new ProjectFile
        {
            ProjectId = projectId,
            FileName = file.FileName,
            StoragePath = relativePath,
            FileSize = file.Length,
            UploadedBy = CurrentUserId
        };

        _db.ProjectFiles.Add(record);
        await _db.SaveChangesAsync();

        var uploader = await _db.Users.FindAsync(CurrentUserId);

        return new ProjectFileDto(
            record.Id, record.ProjectId, record.FileName, record.FileSize,
            _storage.GetDownloadUrl(record.StoragePath),
            uploader!.DisplayName, record.UploadedAt
        );
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var file = await _db.ProjectFiles.FindAsync(id);
        if (file is null) return NotFound();

        // Any member can upload, but may only delete their OWN files;
        // Admin/Manager may delete any file (per the role matrix).
        if (!CanManageOthers && file.UploadedBy != CurrentUserId)
            return Forbid();

        _storage.Delete(file.StoragePath);
        _db.ProjectFiles.Remove(file);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

/// <summary>
/// Bound as a single [FromForm] model (rather than separate scalar + IFormFile
/// parameters) because Swashbuckle cannot generate a Swagger schema for actions
/// that mix individually-bound [FromForm] parameters with an IFormFile parameter.
/// See: https://github.com/domaindrivendev/Swashbuckle.AspNetCore#handle-forms-and-file-uploads
/// </summary>
public class UploadFileRequest
{
    public Guid ProjectId { get; set; }
    public IFormFile File { get; set; } = default!;
}
