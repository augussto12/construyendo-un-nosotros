using System.Security.Claims;
using System.Text.Json;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Admin;
using Construyendo.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/settings")]
public class AdminSettingsController(
    AppDbContext dbContext,
    IAdminAuditService auditService) : ControllerBase
{
    private static readonly IReadOnlyDictionary<string, SettingDefinition> AllowedSettings =
        new Dictionary<string, SettingDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            ["donationUrl"] = new("url"),
            ["contactEmail"] = new("email"),
            ["whatsappUrl"] = new("url"),
            ["instagramUrl"] = new("url"),
            ["facebookUrl"] = new("url"),
            ["youtubeUrl"] = new("url"),
            ["addressText"] = new("text"),
            ["footerText"] = new("text"),
        };

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminSiteSettingDto>>> GetSettings()
    {
        var existing = await dbContext.SiteSettings
            .AsNoTracking()
            .Where(setting => AllowedSettings.Keys.Contains(setting.Key))
            .ToDictionaryAsync(setting => setting.Key, StringComparer.OrdinalIgnoreCase);

        var items = AllowedSettings
            .OrderBy(item => item.Key)
            .Select(item =>
            {
                existing.TryGetValue(item.Key, out var setting);
                return ToDto(item.Key, item.Value, setting);
            })
            .ToList();

        return Ok(items);
    }

    [HttpPut("{key}")]
    public async Task<ActionResult<AdminSiteSettingDto>> UpdateSetting(string key, [FromBody] UpdateSiteSettingRequest request)
    {
        if (!AllowedSettings.TryGetValue(key, out var definition))
        {
            return NotFound();
        }

        var value = request.Value.Trim();
        var validation = ValidateValue(value, definition.Type);
        if (validation is not null)
        {
            return BadRequest(new { message = validation });
        }

        var setting = await dbContext.SiteSettings.SingleOrDefaultAsync(item => item.Key == key);
        if (setting is null)
        {
            setting = new SiteSetting
            {
                Id = Guid.NewGuid(),
                Key = key,
                Type = definition.Type,
                IsPublic = true,
            };
            dbContext.SiteSettings.Add(setting);
        }

        setting.Value = value;
        setting.Type = definition.Type;
        setting.IsPublic = true;
        setting.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "SiteSettingUpdated", nameof(SiteSetting), setting.Id, JsonSerializer.Serialize(new { setting.Key }));

        return Ok(ToDto(key, definition, setting));
    }

    private static string? ValidateValue(string value, string type)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (type == "email")
        {
            var attribute = new System.ComponentModel.DataAnnotations.EmailAddressAttribute();
            return attribute.IsValid(value) ? null : "El email no tiene un formato valido.";
        }

        if (type == "url")
        {
            return Uri.TryCreate(value, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
                ? null
                : "La URL debe comenzar con http:// o https://.";
        }

        return null;
    }

    private static AdminSiteSettingDto ToDto(string key, SettingDefinition definition, SiteSetting? setting)
    {
        return new AdminSiteSettingDto
        {
            Key = key,
            Value = setting?.Value ?? string.Empty,
            Type = definition.Type,
            IsPublic = true,
            UpdatedAt = setting?.UpdatedAt,
        };
    }

    private async Task<AdminUser?> GetCurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? await dbContext.AdminUsers.FindAsync(userId) : null;
    }

    private sealed record SettingDefinition(string Type);
}
