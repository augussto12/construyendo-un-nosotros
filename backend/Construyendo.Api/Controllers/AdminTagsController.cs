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
[Authorize(Policy = "AdminOrEditor")]
[Route("api/admin/tags")]
public class AdminTagsController(
    AppDbContext dbContext,
    ISlugService slugService,
    IAdminAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TagDto>>> GetTags()
    {
        var items = await dbContext.NewsTags
            .AsNoTracking()
            .OrderBy(tag => tag.Name)
            .Select(tag => ToDto(tag))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<TagDto>> CreateTag([FromBody] UpsertTagRequest request)
    {
        var tag = new NewsTag
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = await BuildUniqueSlugAsync(request.Name, request.Slug, null),
        };

        dbContext.NewsTags.Add(tag);
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "TagCreated", nameof(NewsTag), tag.Id, Metadata(tag));

        return CreatedAtAction(nameof(GetTags), ToDto(tag));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TagDto>> UpdateTag(Guid id, [FromBody] UpsertTagRequest request)
    {
        var tag = await dbContext.NewsTags.SingleOrDefaultAsync(item => item.Id == id);
        if (tag is null)
        {
            return NotFound();
        }

        tag.Name = request.Name.Trim();
        tag.Slug = await BuildUniqueSlugAsync(request.Name, request.Slug, id);

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "TagUpdated", nameof(NewsTag), tag.Id, Metadata(tag));

        return Ok(ToDto(tag));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTag(Guid id)
    {
        var tag = await dbContext.NewsTags
            .Include(item => item.NewsArticles)
            .SingleOrDefaultAsync(item => item.Id == id);

        if (tag is null)
        {
            return NotFound();
        }

        tag.NewsArticles.Clear();
        dbContext.NewsTags.Remove(tag);
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "TagDeleted", nameof(NewsTag), tag.Id, Metadata(tag));

        return NoContent();
    }

    private async Task<string> BuildUniqueSlugAsync(string name, string? explicitSlug, Guid? currentTagId)
    {
        var baseSlug = slugService.GenerateSlug(string.IsNullOrWhiteSpace(explicitSlug) ? name : explicitSlug);
        var slug = baseSlug;
        var index = 2;

        while (await dbContext.NewsTags.AnyAsync(tag => tag.Slug == slug && tag.Id != currentTagId))
        {
            slug = $"{baseSlug}-{index}";
            index++;
        }

        return slug;
    }

    private async Task<AdminUser?> GetCurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? await dbContext.AdminUsers.FindAsync(userId) : null;
    }

    private static TagDto ToDto(NewsTag tag)
    {
        return new TagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            Slug = tag.Slug,
        };
    }

    private static string Metadata(NewsTag tag)
    {
        return JsonSerializer.Serialize(new { tag.Slug });
    }
}
