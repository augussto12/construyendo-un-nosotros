using Construyendo.Api.Controllers;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Admin;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Tests;

public class AdminNewsMediaControllerTests
{
    [Fact]
    public async Task SetMainImage_AssignsMediaAsset()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle();
        var media = CreateMedia();
        dbContext.AddRange(article, media);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.SetMainImage(article.Id, new SetMainImageRequest { MediaAssetId = media.Id });

        Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(media.Id, (await dbContext.NewsArticles.SingleAsync()).MainImageId);
    }

    [Fact]
    public async Task SetMainImage_RejectsDeletedMediaAsset()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle();
        var media = CreateMedia();
        media.DeletedAt = DateTimeOffset.UtcNow;
        dbContext.AddRange(article, media);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.SetMainImage(article.Id, new SetMainImageRequest { MediaAssetId = media.Id });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task RemoveMainImage_DoesNotDeleteMediaAsset()
    {
        await using var dbContext = CreateDbContext();
        var media = CreateMedia();
        var article = CreateArticle();
        article.MainImageId = media.Id;
        dbContext.AddRange(article, media);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.RemoveMainImage(article.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Null((await dbContext.NewsArticles.SingleAsync()).MainImageId);
        Assert.NotNull(await dbContext.MediaAssets.FindAsync(media.Id));
    }

    [Fact]
    public async Task AddGalleryImage_AddsRelation()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle();
        var media = CreateMedia();
        dbContext.AddRange(article, media);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.AddGalleryImage(article.Id, new AddNewsGalleryImageRequest
        {
            MediaAssetId = media.Id,
            SortOrder = 1,
            Caption = "Caption",
        });

        Assert.IsType<OkObjectResult>(result.Result);
        Assert.Single(dbContext.NewsImages);
    }

    [Fact]
    public async Task AddGalleryImage_RejectsDuplicateMedia()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle();
        var media = CreateMedia();
        article.GalleryImages.Add(new NewsImage
        {
            Id = Guid.NewGuid(),
            MediaAssetId = media.Id,
            MediaAsset = media,
            SortOrder = 1,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        dbContext.Add(article);
        dbContext.Add(media);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.AddGalleryImage(article.Id, new AddNewsGalleryImageRequest
        {
            MediaAssetId = media.Id,
            SortOrder = 2,
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddGalleryImage_RejectsDeletedMediaAsset()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle();
        var media = CreateMedia();
        media.DeletedAt = DateTimeOffset.UtcNow;
        dbContext.AddRange(article, media);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.AddGalleryImage(article.Id, new AddNewsGalleryImageRequest
        {
            MediaAssetId = media.Id,
            SortOrder = 1,
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddGalleryImage_RejectsMoreThanTwentyImages()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle();
        for (var index = 0; index < 20; index++)
        {
            var media = CreateMedia();
            article.GalleryImages.Add(new NewsImage
            {
                Id = Guid.NewGuid(),
                MediaAssetId = media.Id,
                MediaAsset = media,
                SortOrder = index,
                CreatedAt = DateTimeOffset.UtcNow,
            });
        }
        var extraMedia = CreateMedia();
        dbContext.Add(article);
        dbContext.Add(extraMedia);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.AddGalleryImage(article.Id, new AddNewsGalleryImageRequest
        {
            MediaAssetId = extraMedia.Id,
            SortOrder = 21,
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateGalleryOrder_RejectsDuplicateIds()
    {
        await using var dbContext = CreateDbContext();
        var (article, image) = await CreateArticleWithGalleryImage(dbContext);
        var controller = CreateController(dbContext);

        var result = await controller.UpdateGalleryOrder(article.Id, new UpdateGalleryOrderRequest
        {
            Items =
            [
                new GalleryOrderItemDto { ImageId = image.Id, SortOrder = 1 },
                new GalleryOrderItemDto { ImageId = image.Id, SortOrder = 2 },
            ],
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task UpdateGalleryOrder_RejectsDuplicateSortOrders()
    {
        await using var dbContext = CreateDbContext();
        var (article, firstImage) = await CreateArticleWithGalleryImage(dbContext);
        var secondMedia = CreateMedia();
        var secondImage = new NewsImage
        {
            Id = Guid.NewGuid(),
            NewsArticleId = article.Id,
            MediaAssetId = secondMedia.Id,
            MediaAsset = secondMedia,
            SortOrder = 2,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        dbContext.NewsImages.Add(secondImage);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.UpdateGalleryOrder(article.Id, new UpdateGalleryOrderRequest
        {
            Items =
            [
                new GalleryOrderItemDto { ImageId = firstImage.Id, SortOrder = 1 },
                new GalleryOrderItemDto { ImageId = secondImage.Id, SortOrder = 1 },
            ],
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task UpdateGalleryOrder_RejectsMissingExistingImageIds()
    {
        await using var dbContext = CreateDbContext();
        var (article, _) = await CreateArticleWithGalleryImage(dbContext);
        var controller = CreateController(dbContext);

        var result = await controller.UpdateGalleryOrder(article.Id, new UpdateGalleryOrderRequest
        {
            Items =
            [
                new GalleryOrderItemDto { ImageId = Guid.NewGuid(), SortOrder = 1 },
            ],
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task RemoveGalleryImage_DoesNotDeleteMediaAsset()
    {
        await using var dbContext = CreateDbContext();
        var (article, image) = await CreateArticleWithGalleryImage(dbContext);
        var mediaId = image.MediaAssetId;
        var controller = CreateController(dbContext);

        var result = await controller.RemoveGalleryImage(article.Id, image.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Empty(dbContext.NewsImages);
        Assert.NotNull(await dbContext.MediaAssets.FindAsync(mediaId));
    }

    private static async Task<(NewsArticle Article, NewsImage Image)> CreateArticleWithGalleryImage(AppDbContext dbContext)
    {
        var article = CreateArticle();
        var media = CreateMedia();
        var image = new NewsImage
        {
            Id = Guid.NewGuid(),
            MediaAssetId = media.Id,
            MediaAsset = media,
            SortOrder = 1,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        article.GalleryImages.Add(image);
        dbContext.Add(article);
        await dbContext.SaveChangesAsync();
        return (article, image);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static AdminNewsMediaController CreateController(AppDbContext dbContext)
    {
        dbContext.ChangeTracker.Clear();

        return new AdminNewsMediaController(dbContext, new TestAuditService())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext(),
            },
        };
    }

    private static NewsArticle CreateArticle()
    {
        return new NewsArticle
        {
            Id = Guid.NewGuid(),
            Title = "Noticia",
            Slug = Guid.NewGuid().ToString("N"),
            Excerpt = "Resumen",
            ContentHtml = "<p>Contenido</p>",
            Status = NewsStatus.Draft,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    private static MediaAsset CreateMedia()
    {
        return new MediaAsset
        {
            Id = Guid.NewGuid(),
            FileName = $"{Guid.NewGuid():N}.jpg",
            OriginalFileName = "image.jpg",
            Url = "/uploads/media/2026/05/image.jpg",
            StoragePath = "internal",
            MimeType = "image/jpeg",
            Extension = "jpg",
            SizeBytes = 4,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }
}
