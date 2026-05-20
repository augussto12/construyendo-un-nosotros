using Construyendo.Api.Domain;
using Microsoft.AspNetCore.Http;

namespace Construyendo.Api.Services;

public class LocalFileStorageService(IConfiguration configuration) : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    };

    private static readonly HashSet<string> DefaultAllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    public async Task<MediaAsset> SaveImageAsync(IFormFile file, Guid? uploadedById, string? altText, CancellationToken cancellationToken = default)
    {
        var validation = await ValidateImageAsync(file, cancellationToken);
        if (!validation.IsValid || validation.Extension is null || validation.MimeType is null)
        {
            throw new InvalidOperationException(validation.Error ?? "Archivo invalido.");
        }

        var now = DateTimeOffset.UtcNow;
        var safeFileName = $"{Guid.NewGuid():N}{validation.Extension}";
        var relativeDirectory = Path.Combine("media", now.Year.ToString("0000"), now.Month.ToString("00"));
        var storageRoot = GetStorageRoot();
        var targetDirectory = Path.GetFullPath(Path.Combine(storageRoot, relativeDirectory));
        EnsurePathInsideRoot(storageRoot, targetDirectory);
        Directory.CreateDirectory(targetDirectory);

        var targetPath = Path.GetFullPath(Path.Combine(targetDirectory, safeFileName));
        EnsurePathInsideRoot(storageRoot, targetPath);

        await using (var stream = new FileStream(targetPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        return new MediaAsset
        {
            Id = Guid.NewGuid(),
            FileName = safeFileName,
            OriginalFileName = SanitizeOriginalFileName(file.FileName),
            Url = $"{GetPublicBasePath().TrimEnd('/')}/media/{now.Year:0000}/{now.Month:00}/{safeFileName}",
            StoragePath = targetPath,
            MimeType = validation.MimeType,
            Extension = validation.Extension.TrimStart('.').ToLowerInvariant(),
            SizeBytes = file.Length,
            AltText = string.IsNullOrWhiteSpace(altText) ? null : altText.Trim(),
            UploadedById = uploadedById,
            CreatedAt = now,
        };
    }

    public async Task<FileValidationResult> ValidateImageAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
        {
            return FileValidationResult.Invalid("El archivo esta vacio.");
        }

        if (file.Length > GetMaxImageBytes())
        {
            return FileValidationResult.Invalid("La imagen supera el tamanio maximo permitido.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return FileValidationResult.Invalid("Extension de imagen no permitida.");
        }

        var contentType = file.ContentType.Trim().ToLowerInvariant();
        if (!GetAllowedMimeTypes().Contains(contentType))
        {
            return FileValidationResult.Invalid("Content-Type de imagen no permitido.");
        }

        if ((extension is ".jpg" or ".jpeg") && contentType != "image/jpeg")
        {
            return FileValidationResult.Invalid("Extension y Content-Type no coinciden.");
        }

        if (extension == ".png" && contentType != "image/png")
        {
            return FileValidationResult.Invalid("Extension y Content-Type no coinciden.");
        }

        if (extension == ".webp" && contentType != "image/webp")
        {
            return FileValidationResult.Invalid("Extension y Content-Type no coinciden.");
        }

        await using var stream = file.OpenReadStream();
        var header = new byte[12];
        var read = await stream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);

        return HasValidMagicBytes(header, read, contentType)
            ? FileValidationResult.Valid(extension, contentType)
            : FileValidationResult.Invalid("La firma del archivo no corresponde a una imagen permitida.");
    }

    public string GetStorageRoot()
    {
        var configuredRoot = configuration["MEDIA_STORAGE_ROOT"]
            ?? configuration["Media:StorageRoot"]
            ?? "uploads";
        return Path.GetFullPath(configuredRoot);
    }

    public string GetPublicBasePath()
    {
        var basePath = configuration["MEDIA_PUBLIC_BASE_PATH"]
            ?? configuration["Media:PublicBasePath"]
            ?? "/uploads";
        return basePath.StartsWith('/') ? basePath : $"/{basePath}";
    }

    private long GetMaxImageBytes()
    {
        return long.TryParse(configuration["MEDIA_MAX_IMAGE_BYTES"], out var configuredValue)
            ? configuredValue
            : 5 * 1024 * 1024;
    }

    private HashSet<string> GetAllowedMimeTypes()
    {
        var configuredTypes = configuration["MEDIA_ALLOWED_IMAGE_TYPES"];
        return string.IsNullOrWhiteSpace(configuredTypes)
            ? DefaultAllowedMimeTypes
            : configuredTypes
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static bool HasValidMagicBytes(byte[] header, int read, string contentType)
    {
        return contentType switch
        {
            "image/jpeg" => read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            "image/png" => read >= 8
                && header[0] == 0x89
                && header[1] == 0x50
                && header[2] == 0x4E
                && header[3] == 0x47
                && header[4] == 0x0D
                && header[5] == 0x0A
                && header[6] == 0x1A
                && header[7] == 0x0A,
            "image/webp" => read >= 12
                && header[0] == 0x52
                && header[1] == 0x49
                && header[2] == 0x46
                && header[3] == 0x46
                && header[8] == 0x57
                && header[9] == 0x45
                && header[10] == 0x42
                && header[11] == 0x50,
            _ => false,
        };
    }

    private static string SanitizeOriginalFileName(string fileName)
    {
        var name = Path.GetFileName(fileName);
        foreach (var invalidCharacter in Path.GetInvalidFileNameChars())
        {
            name = name.Replace(invalidCharacter, '_');
        }

        return string.IsNullOrWhiteSpace(name) ? "image" : name;
    }

    private static void EnsurePathInsideRoot(string root, string path)
    {
        var fullRoot = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
        var fullPath = Path.GetFullPath(path);

        if (!fullPath.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Ruta de almacenamiento invalida.");
        }
    }
}
