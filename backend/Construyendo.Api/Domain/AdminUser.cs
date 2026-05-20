namespace Construyendo.Api.Domain;

public class AdminUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public AdminRole Role { get; set; } = AdminRole.Editor;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<NewsArticle> CreatedNewsArticles { get; set; } = [];
    public ICollection<NewsArticle> UpdatedNewsArticles { get; set; } = [];
    public ICollection<MediaAsset> UploadedMediaAssets { get; set; } = [];
    public ICollection<AuditLog> AuditLogs { get; set; } = [];
}
