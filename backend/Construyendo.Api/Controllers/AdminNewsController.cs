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
[Route("api/admin/news")]
public class AdminNewsController(
    AppDbContext dbContext,
    ISlugService slugService,
    IHtmlSanitizerService htmlSanitizer,
    IAdminAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<AdminNewsListItemDto>>> GetNews(
        [FromQuery] string? search,
        [FromQuery] NewsStatus? status,
        [FromQuery] Guid? categoryId,
        [FromQuery] Guid? tagId,
        [FromQuery] bool? featured,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sort = "-updatedAt")
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = dbContext.NewsArticles
            .AsNoTracking()
            .Include(article => article.Categories)
            .Include(article => article.Tags)
            .Where(article => article.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(article =>
                article.Title.ToLower().Contains(term)
                || article.Excerpt.ToLower().Contains(term)
                || article.Slug.ToLower().Contains(term));
        }

        if (status.HasValue)
        {
            query = query.Where(article => article.Status == status.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(article => article.Categories.Any(category => category.Id == categoryId.Value));
        }

        if (tagId.HasValue)
        {
            query = query.Where(article => article.Tags.Any(tag => tag.Id == tagId.Value));
        }

        if (featured.HasValue)
        {
            query = query.Where(article => article.IsFeatured == featured.Value);
        }

        query = ApplySort(query, sort);

        var totalItems = await query.CountAsync();
        var articles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var items = articles.Select(ToListDto).ToList();

        return Ok(new PagedResultDto<AdminNewsListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminNewsDetailDto>> GetNewsById(Guid id)
    {
        var article = await LoadArticleAsync(id);

        return article is null ? NotFound() : Ok(ToDetailDto(article));
    }

    [HttpPost]
    public async Task<ActionResult<AdminNewsDetailDto>> CreateNews([FromBody] CreateNewsRequest request)
    {
        var validation = await ValidateRequestAsync(request);
        if (validation is not null)
        {
            return validation;
        }

        var slug = await BuildUniqueSlugAsync(request.Title, request.Slug, null);
        var now = DateTimeOffset.UtcNow;
        var currentUserId = GetCurrentUserId();
        var article = new NewsArticle
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Slug = slug,
            Excerpt = request.Excerpt.Trim(),
            ContentHtml = htmlSanitizer.Sanitize(request.ContentHtml),
            Status = ResolveRequestedStatus(request.Status, request.PublishedAt, request.ExpiresAt),
            PublishedAt = ToUtc(request.PublishedAt),
            ScheduledAt = request.PublishedAt.HasValue && request.PublishedAt.Value > now ? ToUtc(request.PublishedAt) : null,
            ExpiresAt = ToUtc(request.ExpiresAt),
            AuthorName = TrimOrNull(request.AuthorName),
            IsFeatured = request.IsFeatured,
            FeaturedOrder = request.FeaturedOrder,
            SortOrder = request.SortOrder,
            SeoTitle = TrimOrNull(request.SeoTitle),
            SeoDescription = TrimOrNull(request.SeoDescription),
            SourceUrl = TrimOrNull(request.SourceUrl),
            VideoUrl = TrimOrNull(request.VideoUrl),
            VideoProvider = TrimOrNull(request.VideoProvider),
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await ApplyCategoryAsync(article, request.CategoryId);
        await ApplyTagsAsync(article, request.TagIds);

        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsCreated", nameof(NewsArticle), article.Id, Metadata(article));

        return CreatedAtAction(nameof(GetNewsById), new { id = article.Id }, ToDetailDto(article));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminNewsDetailDto>> UpdateNews(Guid id, [FromBody] UpdateNewsRequest request)
    {
        var article = await LoadArticleAsync(id, tracking: true);
        if (article is null)
        {
            return NotFound();
        }

        var validation = await ValidateRequestAsync(request);
        if (validation is not null)
        {
            return validation;
        }

        article.Title = request.Title.Trim();
        article.Slug = await BuildUniqueSlugAsync(request.Title, request.Slug, id);
        article.Excerpt = request.Excerpt.Trim();
        article.ContentHtml = htmlSanitizer.Sanitize(request.ContentHtml);
        article.Status = ResolveRequestedStatus(request.Status, request.PublishedAt, request.ExpiresAt);
        article.PublishedAt = ToUtc(request.PublishedAt);
        article.ScheduledAt = request.PublishedAt.HasValue && request.PublishedAt.Value > DateTimeOffset.UtcNow ? ToUtc(request.PublishedAt) : null;
        article.ExpiresAt = ToUtc(request.ExpiresAt);
        article.AuthorName = TrimOrNull(request.AuthorName);
        article.IsFeatured = request.IsFeatured;
        article.FeaturedOrder = request.FeaturedOrder;
        article.SortOrder = request.SortOrder;
        article.SeoTitle = TrimOrNull(request.SeoTitle);
        article.SeoDescription = TrimOrNull(request.SeoDescription);
        article.SourceUrl = TrimOrNull(request.SourceUrl);
        article.VideoUrl = TrimOrNull(request.VideoUrl);
        article.VideoProvider = TrimOrNull(request.VideoProvider);
        article.UpdatedById = GetCurrentUserId();
        article.UpdatedAt = DateTimeOffset.UtcNow;

        await ApplyCategoryAsync(article, request.CategoryId);
        await ApplyTagsAsync(article, request.TagIds);

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsUpdated", nameof(NewsArticle), article.Id, Metadata(article));

        return Ok(ToDetailDto(article));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNews(Guid id)
    {
        var article = await LoadArticleAsync(id, tracking: true);
        if (article is null)
        {
            return NotFound();
        }

        article.Status = NewsStatus.Archived;
        article.DeletedAt = DateTimeOffset.UtcNow;
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsSoftDeleted", nameof(NewsArticle), article.Id, Metadata(article));

        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<AdminNewsDetailDto>> Publish(Guid id)
    {
        var article = await LoadArticleAsync(id, tracking: true);
        if (article is null)
        {
            return NotFound();
        }

        var now = DateTimeOffset.UtcNow;
        article.Status = NewsStatus.Published;
        article.PublishedAt = now;
        article.ScheduledAt = null;
        article.UpdatedAt = now;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsPublished", nameof(NewsArticle), article.Id, Metadata(article));

        return Ok(ToDetailDto(article));
    }

    [HttpPost("{id:guid}/unpublish")]
    public async Task<ActionResult<AdminNewsDetailDto>> Unpublish(Guid id)
    {
        var article = await LoadArticleAsync(id, tracking: true);
        if (article is null)
        {
            return NotFound();
        }

        article.Status = NewsStatus.Unpublished;
        article.ScheduledAt = null;
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsUnpublished", nameof(NewsArticle), article.Id, Metadata(article));

        return Ok(ToDetailDto(article));
    }

    [HttpPost("{id:guid}/schedule")]
    public async Task<ActionResult<AdminNewsDetailDto>> Schedule(Guid id, [FromBody] ScheduleNewsRequest request)
    {
        var publishedAt = ToUtc(request.PublishedAt)!.Value;
        if (publishedAt <= DateTimeOffset.UtcNow)
        {
            return BadRequest(new { message = "La fecha de publicacion programada debe ser futura." });
        }

        var article = await LoadArticleAsync(id, tracking: true);
        if (article is null)
        {
            return NotFound();
        }

        article.Status = NewsStatus.Scheduled;
        article.PublishedAt = publishedAt;
        article.ScheduledAt = publishedAt;
        article.ExpiresAt = ToUtc(request.ExpiresAt);
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsScheduled", nameof(NewsArticle), article.Id, Metadata(article));

        return Ok(ToDetailDto(article));
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult<AdminNewsDetailDto>> Archive(Guid id)
    {
        var article = await LoadArticleAsync(id, tracking: true);
        if (article is null)
        {
            return NotFound();
        }

        article.Status = NewsStatus.Archived;
        article.ScheduledAt = null;
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsArchived", nameof(NewsArticle), article.Id, Metadata(article));

        return Ok(ToDetailDto(article));
    }

    [HttpPut("featured-order")]
    public async Task<IActionResult> UpdateFeaturedOrder([FromBody] FeaturedOrderRequest request)
    {
        var ids = request.Items.Select(item => item.Id).ToList();
        if (ids.Count != ids.Distinct().Count())
        {
            return BadRequest(new { message = "La lista de destacadas contiene noticias duplicadas." });
        }

        var orders = request.Items.Select(item => item.FeaturedOrder).ToList();
        if (orders.Count != orders.Distinct().Count())
        {
            return BadRequest(new { message = "La lista de destacadas contiene ordenes duplicados." });
        }

        var articles = await dbContext.NewsArticles
            .Where(article => ids.Contains(article.Id) && article.DeletedAt == null)
            .ToListAsync();

        if (articles.Count != ids.Count)
        {
            return BadRequest(new { message = "Una o mas noticias destacadas no existen o estan archivadas." });
        }

        foreach (var item in request.Items)
        {
            var article = articles.Single(candidate => candidate.Id == item.Id);

            article.IsFeatured = true;
            article.FeaturedOrder = item.FeaturedOrder;
            article.UpdatedAt = DateTimeOffset.UtcNow;
            article.UpdatedById = GetCurrentUserId();
        }

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsFeaturedOrderUpdated", nameof(NewsArticle), null, JsonSerializer.Serialize(request.Items));

        return NoContent();
    }

    private async Task<ActionResult?> ValidateRequestAsync(CreateNewsRequest request)
    {
        if (request.ExpiresAt.HasValue && request.PublishedAt.HasValue && ToUtc(request.ExpiresAt) <= ToUtc(request.PublishedAt))
        {
            return BadRequest(new { message = "ExpiresAt debe ser posterior a PublishedAt." });
        }

        if (request.Status == NewsStatus.Scheduled)
        {
            var publishedAt = ToUtc(request.PublishedAt);
            if (!publishedAt.HasValue || publishedAt <= DateTimeOffset.UtcNow)
            {
                return BadRequest(new { message = "Las noticias programadas requieren PublishedAt futuro." });
            }
        }

        if (request.CategoryId.HasValue && !await dbContext.NewsCategories.AnyAsync(category => category.Id == request.CategoryId.Value && category.IsActive))
        {
            return BadRequest(new { message = "La categoria indicada no existe o no esta activa." });
        }

        var tagIds = request.TagIds.Distinct().ToList();
        if (tagIds.Count > 0)
        {
            var existingTags = await dbContext.NewsTags.CountAsync(tag => tagIds.Contains(tag.Id));
            if (existingTags != tagIds.Count)
            {
                return BadRequest(new { message = "Uno o mas tags indicados no existen." });
            }
        }

        return null;
    }

    private async Task<string> BuildUniqueSlugAsync(string title, string? explicitSlug, Guid? currentArticleId)
    {
        var baseSlug = slugService.GenerateSlug(string.IsNullOrWhiteSpace(explicitSlug) ? title : explicitSlug);
        var slug = baseSlug;
        var index = 2;

        while (await dbContext.NewsArticles.AnyAsync(article =>
            article.Slug == slug
            && article.Id != currentArticleId))
        {
            slug = $"{baseSlug}-{index}";
            index++;
        }

        return slug;
    }

    private async Task<NewsArticle?> LoadArticleAsync(Guid id, bool tracking = false)
    {
        var query = dbContext.NewsArticles
            .Include(article => article.Categories)
            .Include(article => article.Tags)
            .Include(article => article.MainImage)
            .Include(article => article.GalleryImages)
            .ThenInclude(image => image.MediaAsset)
            .Where(article => article.DeletedAt == null);

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(article => article.Id == id);
    }

    private async Task ApplyCategoryAsync(NewsArticle article, Guid? categoryId)
    {
        article.Categories.Clear();

        if (!categoryId.HasValue)
        {
            return;
        }

        var category = await dbContext.NewsCategories.SingleAsync(item => item.Id == categoryId.Value);
        article.Categories.Add(category);
    }

    private async Task ApplyTagsAsync(NewsArticle article, IReadOnlyList<Guid> tagIds)
    {
        article.Tags.Clear();

        var distinctIds = tagIds.Distinct().ToList();
        if (distinctIds.Count == 0)
        {
            return;
        }

        var tags = await dbContext.NewsTags.Where(tag => distinctIds.Contains(tag.Id)).ToListAsync();
        foreach (var tag in tags)
        {
            article.Tags.Add(tag);
        }
    }

    private static NewsStatus ResolveRequestedStatus(NewsStatus? requestedStatus, DateTimeOffset? publishedAt, DateTimeOffset? expiresAt)
    {
        var now = DateTimeOffset.UtcNow;

        if (expiresAt.HasValue && expiresAt.Value <= now)
        {
            return NewsStatus.Expired;
        }

        if (requestedStatus.HasValue)
        {
            return requestedStatus.Value == NewsStatus.Published && publishedAt.HasValue && publishedAt.Value > now
                ? NewsStatus.Scheduled
                : requestedStatus.Value;
        }

        return publishedAt.HasValue && publishedAt.Value > now ? NewsStatus.Scheduled : NewsStatus.Draft;
    }

    private static IQueryable<NewsArticle> ApplySort(IQueryable<NewsArticle> query, string? sort)
    {
        return sort switch
        {
            "title" => query.OrderBy(article => article.Title),
            "-title" => query.OrderByDescending(article => article.Title),
            "publishedAt" => query.OrderBy(article => article.PublishedAt),
            "-publishedAt" => query.OrderByDescending(article => article.PublishedAt),
            "featuredOrder" => query.OrderBy(article => article.FeaturedOrder),
            "-featuredOrder" => query.OrderByDescending(article => article.FeaturedOrder),
            "sortOrder" => query.OrderBy(article => article.SortOrder),
            "-sortOrder" => query.OrderByDescending(article => article.SortOrder),
            "updatedAt" => query.OrderBy(article => article.UpdatedAt),
            _ => query.OrderByDescending(article => article.UpdatedAt),
        };
    }

    private static AdminNewsListItemDto ToListDto(NewsArticle article)
    {
        return new AdminNewsListItemDto
        {
            Id = article.Id,
            Title = article.Title,
            Slug = article.Slug,
            Excerpt = article.Excerpt,
            Status = article.Status.ToString(),
            PublishedAt = article.PublishedAt,
            ScheduledAt = article.ScheduledAt,
            ExpiresAt = article.ExpiresAt,
            AuthorName = article.AuthorName,
            IsFeatured = article.IsFeatured,
            FeaturedOrder = article.FeaturedOrder,
            SortOrder = article.SortOrder,
            Category = article.Categories.OrderBy(category => category.SortOrder).Select(ToDto).FirstOrDefault(),
            Tags = article.Tags.OrderBy(tag => tag.Name).Select(ToDto).ToList(),
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt,
        };
    }

    private static AdminNewsDetailDto ToDetailDto(NewsArticle article)
    {
        var item = ToListDto(article);
        return new AdminNewsDetailDto
        {
            Id = item.Id,
            Title = item.Title,
            Slug = item.Slug,
            Excerpt = item.Excerpt,
            Status = item.Status,
            PublishedAt = item.PublishedAt,
            ScheduledAt = item.ScheduledAt,
            ExpiresAt = item.ExpiresAt,
            AuthorName = item.AuthorName,
            IsFeatured = item.IsFeatured,
            FeaturedOrder = item.FeaturedOrder,
            SortOrder = item.SortOrder,
            Category = item.Category,
            Tags = item.Tags,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
            ContentHtml = article.ContentHtml,
            SeoTitle = article.SeoTitle,
            SeoDescription = article.SeoDescription,
            SourceUrl = article.SourceUrl,
            VideoUrl = article.VideoUrl,
            VideoProvider = article.VideoProvider,
            MainImage = article.MainImage is not null && article.MainImage.DeletedAt == null
                ? AdminMediaController.ToDto(article.MainImage)
                : null,
            Gallery = article.GalleryImages
                .Where(image => image.MediaAsset.DeletedAt == null)
                .OrderBy(image => image.SortOrder)
                .Select(ToDto)
                .ToList(),
        };
    }

    private static NewsImageDto ToDto(NewsImage image)
    {
        return new NewsImageDto
        {
            Id = image.Id,
            MediaAssetId = image.MediaAssetId,
            Media = AdminMediaController.ToDto(image.MediaAsset),
            Caption = image.Caption,
            AltText = image.AltText,
            SortOrder = image.SortOrder,
            IsMain = image.IsMain,
            CreatedAt = image.CreatedAt,
        };
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

    private static TagDto ToDto(NewsTag tag)
    {
        return new TagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            Slug = tag.Slug,
        };
    }

    private async Task<AdminUser?> GetCurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? await dbContext.AdminUsers.FindAsync(userId) : null;
    }

    private Guid? GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? userId : null;
    }

    private static DateTimeOffset? ToUtc(DateTimeOffset? value)
    {
        return value?.ToUniversalTime();
    }

    private static string? TrimOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string Metadata(NewsArticle article)
    {
        return JsonSerializer.Serialize(new { article.Slug, article.Status });
    }
}
