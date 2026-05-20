using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Public;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicTaxonomyController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<PublicNewsCategoryDto>>> GetCategories()
    {
        var categories = await dbContext.NewsCategories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .Select(category => new PublicNewsCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("tags")]
    public async Task<ActionResult<IReadOnlyList<PublicNewsTagDto>>> GetTags()
    {
        var now = DateTimeOffset.UtcNow;
        var tags = await dbContext.NewsTags
            .AsNoTracking()
            .Where(tag => tag.NewsArticles.Any(article =>
                article.DeletedAt == null
                && article.Status != NewsStatus.Archived
                && article.Status != NewsStatus.Unpublished
                && article.Status != NewsStatus.Draft
                && article.Status != NewsStatus.Expired
                && (article.Status == NewsStatus.Published || article.Status == NewsStatus.Scheduled)
                && article.PublishedAt != null
                && article.PublishedAt <= now
                && (article.ExpiresAt == null || article.ExpiresAt > now)))
            .OrderBy(tag => tag.Name)
            .Select(tag => new PublicNewsTagDto
            {
                Id = tag.Id,
                Name = tag.Name,
                Slug = tag.Slug,
            })
            .ToListAsync();

        return Ok(tags);
    }
}
