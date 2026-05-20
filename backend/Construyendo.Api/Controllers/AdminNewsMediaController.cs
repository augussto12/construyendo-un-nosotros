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
[Route("api/admin/news/{newsId:guid}")]
public class AdminNewsMediaController(
    AppDbContext dbContext,
    IAdminAuditService auditService) : ControllerBase
{
    private const int MaxGalleryImages = 20;

    [HttpPost("main-image")]
    public async Task<ActionResult<MediaAssetDto>> SetMainImage(Guid newsId, [FromBody] SetMainImageRequest request)
    {
        var article = await LoadEditableArticleAsync(newsId);
        if (article is null)
        {
            return NotFound();
        }

        var media = await LoadImageAssetAsync(request.MediaAssetId);
        if (media is null)
        {
            return BadRequest(new { message = "La imagen indicada no existe o no esta disponible." });
        }

        article.MainImageId = media.Id;
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsMainImageSet", nameof(NewsArticle), article.Id, Metadata(article.Id, media.Id));

        return Ok(AdminMediaController.ToDto(media));
    }

    [HttpDelete("main-image")]
    public async Task<IActionResult> RemoveMainImage(Guid newsId)
    {
        var article = await LoadEditableArticleAsync(newsId);
        if (article is null)
        {
            return NotFound();
        }

        var oldMediaId = article.MainImageId;
        article.MainImageId = null;
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsMainImageRemoved", nameof(NewsArticle), article.Id, Metadata(article.Id, oldMediaId));

        return NoContent();
    }

    [HttpPost("gallery")]
    public async Task<ActionResult<NewsImageDto>> AddGalleryImage(Guid newsId, [FromBody] AddNewsGalleryImageRequest request)
    {
        var article = await LoadEditableArticleWithGalleryAsync(newsId);
        if (article is null)
        {
            return NotFound();
        }

        if (article.GalleryImages.Count >= MaxGalleryImages)
        {
            return BadRequest(new { message = "La galeria alcanzo el maximo de 20 imagenes." });
        }

        if (article.GalleryImages.Any(image => image.MediaAssetId == request.MediaAssetId))
        {
            return BadRequest(new { message = "La imagen ya existe en la galeria de esta noticia." });
        }

        var media = await LoadImageAssetAsync(request.MediaAssetId);
        if (media is null)
        {
            return BadRequest(new { message = "La imagen indicada no existe o no esta disponible." });
        }

        var newsImage = new NewsImage
        {
            Id = Guid.NewGuid(),
            NewsArticleId = article.Id,
            NewsArticle = article,
            MediaAssetId = media.Id,
            MediaAsset = media,
            Caption = TrimOrNull(request.Caption),
            AltText = TrimOrNull(request.AltText),
            SortOrder = request.SortOrder,
            IsMain = false,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.NewsImages.Add(newsImage);
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsGalleryImageAdded", nameof(NewsArticle), article.Id, Metadata(article.Id, media.Id));

        return Ok(ToDto(newsImage));
    }

    [HttpDelete("gallery/{imageId:guid}")]
    public async Task<IActionResult> RemoveGalleryImage(Guid newsId, Guid imageId)
    {
        var article = await LoadEditableArticleWithGalleryAsync(newsId);
        if (article is null)
        {
            return NotFound();
        }

        var image = article.GalleryImages.SingleOrDefault(item => item.Id == imageId);
        if (image is null)
        {
            return NotFound();
        }

        dbContext.NewsImages.Remove(image);
        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsGalleryImageRemoved", nameof(NewsArticle), article.Id, Metadata(article.Id, image.MediaAssetId));

        return NoContent();
    }

    [HttpPut("gallery-order")]
    public async Task<IActionResult> UpdateGalleryOrder(Guid newsId, [FromBody] UpdateGalleryOrderRequest request)
    {
        var article = await LoadEditableArticleWithGalleryAsync(newsId);
        if (article is null)
        {
            return NotFound();
        }

        var ids = request.Items.Select(item => item.ImageId).ToList();
        if (ids.Count != ids.Distinct().Count())
        {
            return BadRequest(new { message = "La lista de galeria contiene imagenes duplicadas." });
        }

        var orders = request.Items.Select(item => item.SortOrder).ToList();
        if (orders.Count != orders.Distinct().Count())
        {
            return BadRequest(new { message = "La lista de galeria contiene ordenes duplicados." });
        }

        if (ids.Count != article.GalleryImages.Count || article.GalleryImages.Any(image => !ids.Contains(image.Id)))
        {
            return BadRequest(new { message = "La lista de galeria debe incluir todas las imagenes existentes y solo imagenes existentes." });
        }

        foreach (var item in request.Items)
        {
            var image = article.GalleryImages.Single(candidate => candidate.Id == item.ImageId);
            image.SortOrder = item.SortOrder;
        }

        article.UpdatedAt = DateTimeOffset.UtcNow;
        article.UpdatedById = GetCurrentUserId();

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "NewsGalleryReordered", nameof(NewsArticle), article.Id, JsonSerializer.Serialize(request.Items));

        return NoContent();
    }

    private async Task<NewsArticle?> LoadEditableArticleAsync(Guid newsId)
    {
        return await dbContext.NewsArticles
            .SingleOrDefaultAsync(article =>
                article.Id == newsId
                && article.DeletedAt == null
                && article.Status != NewsStatus.Archived);
    }

    private async Task<NewsArticle?> LoadEditableArticleWithGalleryAsync(Guid newsId)
    {
        return await dbContext.NewsArticles
            .Include(article => article.GalleryImages)
            .ThenInclude(image => image.MediaAsset)
            .SingleOrDefaultAsync(article =>
                article.Id == newsId
                && article.DeletedAt == null
                && article.Status != NewsStatus.Archived);
    }

    private async Task<MediaAsset?> LoadImageAssetAsync(Guid mediaAssetId)
    {
        return await dbContext.MediaAssets
            .SingleOrDefaultAsync(media =>
                media.Id == mediaAssetId
                && media.DeletedAt == null
                && (media.MimeType == "image/jpeg" || media.MimeType == "image/png" || media.MimeType == "image/webp"));
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

    private Guid? GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? userId : null;
    }

    private async Task<AdminUser?> GetCurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? await dbContext.AdminUsers.FindAsync(userId) : null;
    }

    private static string? TrimOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string Metadata(Guid newsId, Guid? mediaAssetId)
    {
        return JsonSerializer.Serialize(new { NewsId = newsId, MediaAssetId = mediaAssetId });
    }
}
