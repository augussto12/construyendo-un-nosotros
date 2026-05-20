using Construyendo.Api.Domain;

namespace Construyendo.Api.Services;

public interface IAdminAuditService
{
    Task RecordAsync(AdminUser? user, string action, string entityName, Guid? entityId = null, string? metadataJson = null);
}
