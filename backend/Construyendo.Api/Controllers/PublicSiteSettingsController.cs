using Construyendo.Api.Data;
using Construyendo.Api.DTOs.Public;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Controllers;

[ApiController]
[Route("api/public/site-settings")]
public class PublicSiteSettingsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PublicSiteSettingDto>>> GetSiteSettings()
    {
        var settings = await dbContext.SiteSettings
            .AsNoTracking()
            .Where(setting => setting.IsPublic)
            .OrderBy(setting => setting.Key)
            .Select(setting => new PublicSiteSettingDto
            {
                Key = setting.Key,
                Value = setting.Value,
                Type = setting.Type,
            })
            .ToListAsync();

        return Ok(settings);
    }
}
