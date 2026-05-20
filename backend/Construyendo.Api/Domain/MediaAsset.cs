namespace Construyendo.Api.Domain;

public class MediaAsset
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? AltText { get; set; }
    public Guid? UploadedById { get; set; }
    public AdminUser? UploadedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<NewsImage> NewsImages { get; set; } = [];
    public ICollection<NewsArticle> MainImageNewsArticles { get; set; } = [];
    public ICollection<NewsArticle> OgImageNewsArticles { get; set; } = [];
}
