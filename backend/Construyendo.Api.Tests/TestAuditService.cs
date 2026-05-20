using Construyendo.Api.Domain;
using Construyendo.Api.Services;

namespace Construyendo.Api.Tests;

public class TestAuditService : IAdminAuditService
{
    public Task RecordAsync(AdminUser? user, string action, string entityName, Guid? entityId = null, string? metadataJson = null)
    {
        return Task.CompletedTask;
    }
}
