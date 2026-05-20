using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Public;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Controllers;

[ApiController]
[Route("api/public/news")]
public class PublicNewsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PublicPagedResultDto<PublicNewsListItemDto>>> GetNews(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? category = null,
        [FromQuery] string? tag = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? featured = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = VisibleNewsQuery(DateTimeOffset.UtcNow);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var categorySlug = category.Trim().ToLowerInvariant();
            query = query.Where(article => article.Categories.Any(item => item.IsActive && item.Slug.ToLower() == categorySlug));
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var tagSlug = tag.Trim().ToLowerInvariant();
            query = query.Where(article => article.Tags.Any(item => item.Slug.ToLower() == tagSlug));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(article =>
                article.Title.ToLower().Contains(term)
                || article.Excerpt.ToLower().Contains(term));
        }

        if (featured.HasValue)
        {
            query = query.Where(article => article.IsFeatured == featured.Value);
        }

        query = query
            .OrderByDescending(article => article.PublishedAt)
            .ThenByDescending(article => article.CreatedAt);

        var totalItems = await query.CountAsync();
        var articles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PublicPagedResultDto<PublicNewsListItemDto>
        {
            Items = articles.Select(ToListDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
        });
    }

    [HttpGet("featured")]
    public async Task<ActionResult<IReadOnlyList<PublicNewsListItemDto>>> GetFeaturedNews([FromQuery] int take = 3)
    {
        take = Math.Clamp(take, 1, 12);

        var articles = await VisibleNewsQuery(DateTimeOffset.UtcNow)
            .Where(article => article.IsFeatured)
            .OrderBy(article => article.FeaturedOrder)
            .ThenByDescending(article => article.PublishedAt)
            .Take(take)
            .ToListAsync();

        return Ok(articles.Select(ToListDto).ToList());
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<PublicNewsDetailDto>> GetNewsBySlug(string slug)
    {
        var normalizedSlug = slug.Trim().ToLowerInvariant();
        var article = await VisibleNewsQuery(DateTimeOffset.UtcNow)
            .SingleOrDefaultAsync(item => item.Slug.ToLower() == normalizedSlug);

        return article is null ? NotFound() : Ok(ToDetailDto(article));
    }

    private IQueryable<NewsArticle> VisibleNewsQuery(DateTimeOffset now)
    {
        return dbContext.NewsArticles
            .AsNoTracking()
            .Include(article => article.Categories)
            .Include(article => article.Tags)
            .Include(article => article.MainImage)
            .Include(article => article.OgImage)
            .Include(article => article.GalleryImages)
            .ThenInclude(image => image.MediaAsset)
            .Where(article =>
                article.DeletedAt == null
                && article.Status != NewsStatus.Archived
                && article.Status != NewsStatus.Unpublished
                && article.Status != NewsStatus.Draft
                && article.Status != NewsStatus.Expired
                && (article.Status == NewsStatus.Published || article.Status == NewsStatus.Scheduled)
                && article.PublishedAt != null
                && article.PublishedAt <= now
                && (article.ExpiresAt == null || article.ExpiresAt > now));
    }

    private static PublicNewsListItemDto ToListDto(NewsArticle article)
    {
        return new PublicNewsListItemDto
        {
            Id = article.Id,
            Slug = article.Slug,
            Title = article.Title,
            Excerpt = article.Excerpt,
            Category = article.Categories
                .Where(category => category.IsActive)
                .OrderBy(category => category.SortOrder)
                .ThenBy(category => category.Name)
                .Select(ToDto)
                .FirstOrDefault(),
            Tags = article.Tags.OrderBy(tag => tag.Name).Select(ToDto).ToList(),
            PublishedAt = article.PublishedAt,
            AuthorName = article.AuthorName,
            MainImage = ToDto(article.MainImage),
            Video = ToVideoDto(article),
            SourceUrl = article.SourceUrl,
            SeoTitle = article.SeoTitle,
            SeoDescription = article.SeoDescription,
            OgImage = ToDto(article.OgImage),
            IsFeatured = article.IsFeatured,
            FeaturedOrder = article.FeaturedOrder,
        };
    }

    private static PublicNewsDetailDto ToDetailDto(NewsArticle article)
    {
        var item = ToListDto(article);

        return new PublicNewsDetailDto
        {
            Id = item.Id,
            Slug = item.Slug,
            Title = item.Title,
            Excerpt = item.Excerpt,
            Category = item.Category,
            Tags = item.Tags,
            PublishedAt = item.PublishedAt,
            AuthorName = item.AuthorName,
            MainImage = item.MainImage,
            Video = item.Video,
            SourceUrl = item.SourceUrl,
            SeoTitle = item.SeoTitle,
            SeoDescription = item.SeoDescription,
            OgImage = item.OgImage,
            IsFeatured = item.IsFeatured,
            FeaturedOrder = item.FeaturedOrder,
            ContentHtml = article.ContentHtml,
            Gallery = article.GalleryImages
                .Where(image => image.MediaAsset.DeletedAt == null)
                .OrderBy(image => image.SortOrder)
                .Select(ToDto)
                .ToList(),
        };
    }

    private static PublicNewsCategoryDto ToDto(NewsCategory category)
    {
        return new PublicNewsCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
        };
    }

    private static PublicNewsTagDto ToDto(NewsTag tag)
    {
        return new PublicNewsTagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            Slug = tag.Slug,
        };
    }

    private static PublicMediaAssetDto? ToDto(MediaAsset? media)
    {
        if (media is null || media.DeletedAt is not null)
        {
            return null;
        }

        return new PublicMediaAssetDto
        {
            Id = media.Id,
            Url = media.Url,
            AltText = media.AltText,
            Width = media.Width,
            Height = media.Height,
            MimeType = media.MimeType,
        };
    }

    private static PublicNewsImageDto ToDto(NewsImage image)
    {
        return new PublicNewsImageDto
        {
            Id = image.MediaAsset.Id,
            ImageId = image.Id,
            Url = image.MediaAsset.Url,
            AltText = image.AltText ?? image.MediaAsset.AltText,
            Width = image.MediaAsset.Width,
            Height = image.MediaAsset.Height,
            MimeType = image.MediaAsset.MimeType,
            Caption = image.Caption,
            SortOrder = image.SortOrder,
        };
    }

    private static PublicVideoEmbedInfoDto? ToVideoDto(NewsArticle article)
    {
        return string.IsNullOrWhiteSpace(article.VideoUrl)
            ? null
            : new PublicVideoEmbedInfoDto
            {
                Url = article.VideoUrl,
                Provider = string.IsNullOrWhiteSpace(article.VideoProvider) ? "external" : article.VideoProvider,
            };
    }
}
