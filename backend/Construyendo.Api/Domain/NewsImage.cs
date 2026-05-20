namespace Construyendo.Api.Domain;

public class NewsImage
{
    public Guid Id { get; set; }
    public Guid NewsArticleId { get; set; }
    public NewsArticle NewsArticle { get; set; } = null!;
    public Guid MediaAssetId { get; set; }
    public MediaAsset MediaAsset { get; set; } = null!;
    public string? Caption { get; set; }
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsMain { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
