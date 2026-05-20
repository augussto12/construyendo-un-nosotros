using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Construyendo.Api.DTOs.Admin;

public class MediaAssetDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? AltText { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class UploadMediaRequest
{
    [Required]
    public IFormFile File { get; set; } = null!;

    [MaxLength(250)]
    public string? AltText { get; set; }
}

public class UploadMediaResponse
{
    public MediaAssetDto Media { get; set; } = new();
}

public class SetMainImageRequest
{
    public Guid MediaAssetId { get; set; }
}

public class AddNewsGalleryImageRequest
{
    public Guid MediaAssetId { get; set; }

    [MaxLength(300)]
    public string? Caption { get; set; }

    [MaxLength(250)]
    public string? AltText { get; set; }

    public int SortOrder { get; set; }
}

public class NewsImageDto
{
    public Guid Id { get; set; }
    public Guid MediaAssetId { get; set; }
    public MediaAssetDto Media { get; set; } = new();
    public string? Caption { get; set; }
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsMain { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class UpdateGalleryOrderRequest
{
    public IReadOnlyList<GalleryOrderItemDto> Items { get; set; } = [];
}

public class GalleryOrderItemDto
{
    public Guid ImageId { get; set; }
    public int SortOrder { get; set; }
}
