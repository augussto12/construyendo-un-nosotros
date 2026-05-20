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
[Route("api/admin/categories")]
public class AdminCategoriesController(
    AppDbContext dbContext,
    ISlugService slugService,
    IAdminAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetCategories()
    {
        var items = await dbContext.NewsCategories
            .AsNoTracking()
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .Select(category => ToDto(category))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] UpsertCategoryRequest request)
    {
        var slug = await BuildUniqueSlugAsync(request.Name, request.Slug, null);
        var category = new NewsCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = slug,
            Description = TrimOrNull(request.Description),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
        };

        dbContext.NewsCategories.Add(category);
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "CategoryCreated", nameof(NewsCategory), category.Id, Metadata(category));

        return CreatedAtAction(nameof(GetCategories), ToDto(category));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(Guid id, [FromBody] UpsertCategoryRequest request)
    {
        var category = await dbContext.NewsCategories.SingleOrDefaultAsync(item => item.Id == id);
        if (category is null)
        {
            return NotFound();
        }

        category.Name = request.Name.Trim();
        category.Slug = await BuildUniqueSlugAsync(request.Name, request.Slug, id);
        category.Description = TrimOrNull(request.Description);
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "CategoryUpdated", nameof(NewsCategory), category.Id, Metadata(category));

        return Ok(ToDto(category));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var category = await dbContext.NewsCategories.SingleOrDefaultAsync(item => item.Id == id);
        if (category is null)
        {
            return NotFound();
        }

        category.IsActive = false;
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "CategoryDeleted", nameof(NewsCategory), category.Id, Metadata(category));

        return NoContent();
    }

    private async Task<string> BuildUniqueSlugAsync(string name, string? explicitSlug, Guid? currentCategoryId)
    {
        var baseSlug = slugService.GenerateSlug(string.IsNullOrWhiteSpace(explicitSlug) ? name : explicitSlug);
        var slug = baseSlug;
        var index = 2;

        while (await dbContext.NewsCategories.AnyAsync(category => category.Slug == slug && category.Id != currentCategoryId))
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

    private static CategoryDto ToDto(NewsCategory category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
        };
    }

    private static string? TrimOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string Metadata(NewsCategory category)
    {
        return JsonSerializer.Serialize(new { category.Slug, category.IsActive });
    }
}
