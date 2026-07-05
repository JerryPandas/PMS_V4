using Microsoft.Extensions.Configuration;
using PmsApi.Application.Interfaces;

namespace PmsApi.Infrastructure.FileStorage;

/// <summary>
/// Stores files under {StorageRoot}/{projectId}/{guid}/{originalFileName}.
/// The GUID subfolder avoids filename collisions without renaming the user's file,
/// which keeps downloads friendly. Suitable for on-prem IIS deployment without
/// external blob storage.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _root;
    private readonly string _publicBasePath;

    public LocalFileStorageService(IConfiguration config)
    {
        // appsettings.json ships "uploads" (relative) for portability across machines,
        // so resolve it against the app's base directory here — otherwise it would
        // resolve against whatever the current working directory happens to be at
        // runtime (which differs between `dotnet run`, a published exe, and IIS),
        // and would silently mismatch the path Program.cs uses to serve /uploads.
        var configuredRoot = config["FileStorage:RootPath"] ?? "uploads";
        _root = Path.IsPathRooted(configuredRoot)
            ? configuredRoot
            : Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configuredRoot));

        _publicBasePath = config["FileStorage:PublicBasePath"] ?? "/uploads";
        Directory.CreateDirectory(_root);
    }

    public async Task<string> SaveAsync(Stream content, string originalFileName, Guid projectId, CancellationToken ct = default)
    {
        var safeFileName = Path.GetFileName(originalFileName); // strips any path traversal segments
        var subFolder = Guid.NewGuid().ToString("N");
        var relativeDir = Path.Combine(projectId.ToString(), subFolder);
        var fullDir = Path.Combine(_root, relativeDir);
        Directory.CreateDirectory(fullDir);

        var fullPath = Path.Combine(fullDir, safeFileName);
        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, ct);

        // Stored as forward-slash relative path regardless of OS, for consistent URLs.
        return $"{projectId}/{subFolder}/{safeFileName}";
    }

    public void Delete(string relativeStoragePath)
    {
        var fullPath = Path.Combine(_root, relativeStoragePath.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    public string GetDownloadUrl(string relativeStoragePath) => $"{_publicBasePath}/{relativeStoragePath}";
}
