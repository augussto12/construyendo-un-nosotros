using Construyendo.Api.Data;
using Construyendo.Api.Domain;

namespace Construyendo.Api.Services;

public class AdminAuditService(AppDbContext dbContext) : IAdminAuditService
{
    public async Task RecordAsync(AdminUser? user, string action, string entityName, Guid? entityId = null, string? metadataJson = null)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = user?.Id,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            MetadataJson = metadataJson,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        await dbContext.SaveChangesAsync();
    }
}
