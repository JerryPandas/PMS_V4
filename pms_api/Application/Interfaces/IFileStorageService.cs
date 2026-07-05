namespace PmsApi.Application.Interfaces;

public interface IFileStorageService
{
    /// <summary>
    /// Saves the stream under a GUID-based subfolder to avoid filename collisions,
    /// and returns the relative storage path (used later for retrieval/deletion).
    /// </summary>
    Task<string> SaveAsync(Stream content, string originalFileName, Guid projectId, CancellationToken ct = default);

    void Delete(string relativeStoragePath);

    /// <summary>Builds the public URL the frontend can use to download the file.</summary>
    string GetDownloadUrl(string relativeStoragePath);
}
