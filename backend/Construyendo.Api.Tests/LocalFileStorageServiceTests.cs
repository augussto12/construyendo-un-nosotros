using Construyendo.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Construyendo.Api.Tests;

public class LocalFileStorageServiceTests : IDisposable
{
    private readonly string _storageRoot = Path.Combine(Path.GetTempPath(), $"cun-media-tests-{Guid.NewGuid():N}");
    private readonly LocalFileStorageService _storageService;

    public LocalFileStorageServiceTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MEDIA_STORAGE_ROOT"] = _storageRoot,
                ["MEDIA_PUBLIC_BASE_PATH"] = "/uploads",
                ["MEDIA_MAX_IMAGE_BYTES"] = "5242880",
                ["MEDIA_ALLOWED_IMAGE_TYPES"] = "image/jpeg,image/png,image/webp",
            })
            .Build();

        _storageService = new LocalFileStorageService(configuration);
    }

    [Fact]
    public async Task ValidateImage_RejectsInvalidExtension()
    {
        var file = CreateFile("image.gif", "image/gif", [0x47, 0x49, 0x46]);

        var result = await _storageService.ValidateImageAsync(file);

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task ValidateImage_RejectsEmptyFile()
    {
        var file = CreateFile("image.jpg", "image/jpeg", []);

        var result = await _storageService.ValidateImageAsync(file);

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task ValidateImage_RejectsInvalidContentType()
    {
        var file = CreateFile("image.jpg", "text/html", [0xFF, 0xD8, 0xFF]);

        var result = await _storageService.ValidateImageAsync(file);

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task ValidateImage_RejectsInvalidMagicBytes()
    {
        var file = CreateFile("image.png", "image/png", [0x3C, 0x68, 0x74, 0x6D, 0x6C]);

        var result = await _storageService.ValidateImageAsync(file);

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task ValidateImage_RejectsFileOverFiveMb()
    {
        var bytes = new byte[(5 * 1024 * 1024) + 1];
        bytes[0] = 0xFF;
        bytes[1] = 0xD8;
        bytes[2] = 0xFF;
        var file = CreateFile("image.jpg", "image/jpeg", bytes);

        var result = await _storageService.ValidateImageAsync(file);

        Assert.False(result.IsValid);
    }

    [Fact]
    public async Task SaveImage_CreatesSafeUniqueMediaAssetAndFile()
    {
        var file = CreateFile("../unsafe name.jpg", "image/jpeg", [0xFF, 0xD8, 0xFF, 0x00]);

        var media = await _storageService.SaveImageAsync(file, Guid.NewGuid(), "Alt");

        Assert.EndsWith(".jpg", media.FileName);
        Assert.DoesNotContain("unsafe name", media.FileName);
        Assert.StartsWith("/uploads/media/", media.Url);
        Assert.True(File.Exists(media.StoragePath));
        Assert.Equal(4, media.SizeBytes);
    }

    public void Dispose()
    {
        if (Directory.Exists(_storageRoot))
        {
            Directory.Delete(_storageRoot, recursive: true);
        }
    }

    private static IFormFile CreateFile(string fileName, string contentType, byte[] bytes)
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }
}
