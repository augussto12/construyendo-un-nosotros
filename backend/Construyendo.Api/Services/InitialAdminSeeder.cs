using Construyendo.Api.Auth;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Services;

public class InitialAdminSeeder(
    AppDbContext dbContext,
    IPasswordHashService passwordHashService,
    IConfiguration configuration,
    ILogger<InitialAdminSeeder> logger)
{
    public async Task SeedAsync()
    {
        if (await dbContext.AdminUsers.AnyAsync())
        {
            return;
        }

        var email = configuration["ADMIN_EMAIL"];
        var password = configuration["ADMIN_PASSWORD"];
        var displayName = configuration["ADMIN_DISPLAY_NAME"];

        if (string.IsNullOrWhiteSpace(email)
            || string.IsNullOrWhiteSpace(password)
            || string.IsNullOrWhiteSpace(displayName))
        {
            logger.LogWarning(
                "No initial admin was created. Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_DISPLAY_NAME when bootstrapping the backoffice.");
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var admin = new AdminUser
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHashService.HashPassword(password),
            DisplayName = displayName.Trim(),
            Role = AdminRole.Admin,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.AdminUsers.Add(admin);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Initial admin user created for {Email}.", admin.Email);
    }
}
