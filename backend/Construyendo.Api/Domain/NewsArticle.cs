namespace Construyendo.Api.Domain;

public class NewsArticle
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public NewsStatus Status { get; set; } = NewsStatus.Draft;
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? AuthorName { get; set; }
    public Guid? MainImageId { get; set; }
    public MediaAsset? MainImage { get; set; }
    public string? VideoUrl { get; set; }
    public string? VideoProvider { get; set; }
    public string? SourceUrl { get; set; }
    public bool IsFeatured { get; set; }
    public int FeaturedOrder { get; set; }
    public int SortOrder { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public Guid? OgImageId { get; set; }
    public MediaAsset? OgImage { get; set; }
    public Guid? CreatedById { get; set; }
    public AdminUser? CreatedBy { get; set; }
    public Guid? UpdatedById { get; set; }
    public AdminUser? UpdatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<NewsCategory> Categories { get; set; } = [];
    public ICollection<NewsTag> Tags { get; set; } = [];
    public ICollection<NewsImage> GalleryImages { get; set; } = [];
}
