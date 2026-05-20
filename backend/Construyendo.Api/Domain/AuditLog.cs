namespace Construyendo.Api.Domain;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public AdminUser? User { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
