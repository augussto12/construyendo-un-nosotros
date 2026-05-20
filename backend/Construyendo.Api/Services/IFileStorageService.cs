using Construyendo.Api.Domain;
using Microsoft.AspNetCore.Http;

namespace Construyendo.Api.Services;

public interface IFileStorageService
{
    Task<MediaAsset> SaveImageAsync(IFormFile file, Guid? uploadedById, string? altText, CancellationToken cancellationToken = default);
    Task<FileValidationResult> ValidateImageAsync(IFormFile file, CancellationToken cancellationToken = default);
    string GetStorageRoot();
    string GetPublicBasePath();
}

public class FileValidationResult
{
    public bool IsValid { get; init; }
    public string? Error { get; init; }
    public string? Extension { get; init; }
    public string? MimeType { get; init; }

    public static FileValidationResult Valid(string extension, string mimeType)
    {
        return new FileValidationResult
        {
            IsValid = true,
            Extension = extension,
            MimeType = mimeType,
        };
    }

    public static FileValidationResult Invalid(string error)
    {
        return new FileValidationResult
        {
            IsValid = false,
            Error = error,
        };
    }
}
