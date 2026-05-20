using System.Security.Claims;
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
[Route("api/admin/media")]
public class AdminMediaController(
    AppDbContext dbContext,
    IFileStorageService fileStorage,
    IAdminAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MediaAssetDto>>> GetMedia()
    {
        var media = await dbContext.MediaAssets
            .AsNoTracking()
            .Where(asset => asset.DeletedAt == null)
            .OrderByDescending(asset => asset.CreatedAt)
            .Select(asset => ToDto(asset))
            .ToListAsync();

        return Ok(media);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MediaAssetDto>> GetMediaById(Guid id)
    {
        var media = await dbContext.MediaAssets
            .AsNoTracking()
            .SingleOrDefaultAsync(asset => asset.Id == id && asset.DeletedAt == null);

        return media is null ? NotFound() : Ok(ToDto(media));
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<UploadMediaResponse>> UploadMedia([FromForm] UploadMediaRequest request, CancellationToken cancellationToken)
    {
        if (request.File is null)
        {
            return BadRequest(new { message = "El archivo es requerido." });
        }

        var validation = await fileStorage.ValidateImageAsync(request.File, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(new { message = validation.Error });
        }

        var media = await fileStorage.SaveImageAsync(request.File, GetCurrentUserId(), request.AltText, cancellationToken);
        dbContext.MediaAssets.Add(media);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync(await GetCurrentUserAsync(), "MediaUploaded", nameof(MediaAsset), media.Id, System.Text.Json.JsonSerializer.Serialize(new { media.Url, media.MimeType, media.SizeBytes }));

        return CreatedAtAction(nameof(GetMediaById), new { id = media.Id }, new UploadMediaResponse
        {
            Media = ToDto(media),
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMedia(Guid id)
    {
        var media = await dbContext.MediaAssets.SingleOrDefaultAsync(asset => asset.Id == id && asset.DeletedAt == null);
        if (media is null)
        {
            return NotFound();
        }

        media.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "MediaDeleted", nameof(MediaAsset), media.Id, System.Text.Json.JsonSerializer.Serialize(new { media.Url }));

        return NoContent();
    }

    public static MediaAssetDto ToDto(MediaAsset media)
    {
        return new MediaAssetDto
        {
            Id = media.Id,
            FileName = media.FileName,
            OriginalFileName = media.OriginalFileName,
            Url = media.Url,
            MimeType = media.MimeType,
            Extension = media.Extension,
            SizeBytes = media.SizeBytes,
            Width = media.Width,
            Height = media.Height,
            AltText = media.AltText,
            CreatedAt = media.CreatedAt,
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
}
