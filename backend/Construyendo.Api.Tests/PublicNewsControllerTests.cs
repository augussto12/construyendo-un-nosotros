using System.Text.Json;
using Construyendo.Api.Controllers;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Public;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Tests;

public class PublicNewsControllerTests
{
    [Fact]
    public async Task GetNews_ReturnsPublishedVisibleNews()
    {
        await using var dbContext = CreateDbContext();
        dbContext.NewsArticles.Add(CreateArticle("visible", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1)));
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews();

        var dto = AssertPagedResult(result);
        Assert.Single(dto.Items);
        Assert.Equal("visible", dto.Items[0].Slug);
    }

    [Theory]
    [InlineData(NewsStatus.Draft)]
    [InlineData(NewsStatus.Unpublished)]
    [InlineData(NewsStatus.Archived)]
    [InlineData(NewsStatus.Expired)]
    public async Task GetNews_DoesNotReturnNonPublicStatuses(NewsStatus status)
    {
        await using var dbContext = CreateDbContext();
        dbContext.NewsArticles.Add(CreateArticle(status.ToString(), status, DateTimeOffset.UtcNow.AddDays(-1)));
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews();

        var dto = AssertPagedResult(result);
        Assert.Empty(dto.Items);
    }

    [Fact]
    public async Task GetNews_DoesNotReturnFutureScheduledNews()
    {
        await using var dbContext = CreateDbContext();
        dbContext.NewsArticles.Add(CreateArticle("future", NewsStatus.Scheduled, DateTimeOffset.UtcNow.AddDays(1)));
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews();

        var dto = AssertPagedResult(result);
        Assert.Empty(dto.Items);
    }

    [Fact]
    public async Task GetNews_ReturnsElapsedScheduledNews()
    {
        await using var dbContext = CreateDbContext();
        dbContext.NewsArticles.Add(CreateArticle("elapsed", NewsStatus.Scheduled, DateTimeOffset.UtcNow.AddDays(-1)));
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews();

        var dto = AssertPagedResult(result);
        Assert.Single(dto.Items);
        Assert.Equal("elapsed", dto.Items[0].Slug);
    }

    [Fact]
    public async Task GetNews_ClampsInvalidPageValues()
    {
        await using var dbContext = CreateDbContext();
        for (var index = 0; index < 60; index++)
        {
            dbContext.NewsArticles.Add(CreateArticle($"visible-{index}", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1)));
        }
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews(page: -10, pageSize: 500);

        var dto = AssertPagedResult(result);
        Assert.Equal(1, dto.Page);
        Assert.Equal(50, dto.PageSize);
        Assert.Equal(50, dto.Items.Count);
    }

    [Fact]
    public async Task GetNews_FiltersByCategoryTagSearchAndFeatured()
    {
        await using var dbContext = CreateDbContext();
        var category = new NewsCategory { Id = Guid.NewGuid(), Name = "Comunidad", Slug = "comunidad", IsActive = true };
        var tag = new NewsTag { Id = Guid.NewGuid(), Name = "Obra", Slug = "obra" };
        var matchingArticle = CreateArticle("matching", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1), featuredOrder: 1);
        matchingArticle.Title = "Taller comunitario";
        matchingArticle.Categories.Add(category);
        matchingArticle.Tags.Add(tag);
        dbContext.NewsArticles.AddRange(
            matchingArticle,
            CreateArticle("other", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1)));
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews(
            category: "comunidad",
            tag: "obra",
            search: "taller",
            featured: true);

        var dto = AssertPagedResult(result);
        Assert.Single(dto.Items);
        Assert.Equal("matching", dto.Items[0].Slug);
    }

    [Fact]
    public async Task GetNews_DoesNotReturnExpiredNews()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("expired", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-2));
        article.ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1);
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews();

        var dto = AssertPagedResult(result);
        Assert.Empty(dto.Items);
    }

    [Fact]
    public async Task GetNews_DoesNotReturnSoftDeletedNews()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("deleted", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1));
        article.DeletedAt = DateTimeOffset.UtcNow;
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNews();

        var dto = AssertPagedResult(result);
        Assert.Empty(dto.Items);
    }

    [Fact]
    public async Task GetFeaturedNews_OrdersByFeaturedOrderThenPublishedAt()
    {
        await using var dbContext = CreateDbContext();
        var second = CreateArticle("second", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1), featuredOrder: 2);
        var first = CreateArticle("first", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-2), featuredOrder: 1);
        dbContext.NewsArticles.AddRange(second, first);
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetFeaturedNews();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<PublicNewsListItemDto>>(ok.Value);
        Assert.Equal(["first", "second"], items.Select(item => item.Slug).ToArray());
    }

    [Fact]
    public async Task GetNewsBySlug_ReturnsNotFoundWhenNewsIsNotVisible()
    {
        await using var dbContext = CreateDbContext();
        dbContext.NewsArticles.Add(CreateArticle("draft", NewsStatus.Draft, null));
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNewsBySlug("draft");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetNewsBySlug_DoesNotExposeInternalStoragePath()
    {
        await using var dbContext = CreateDbContext();
        var media = CreateMedia();
        var article = CreateArticle("with-media", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1));
        article.MainImage = media;
        article.MainImageId = media.Id;
        article.GalleryImages.Add(new NewsImage
        {
            Id = Guid.NewGuid(),
            MediaAsset = media,
            MediaAssetId = media.Id,
            Caption = "Pie",
            SortOrder = 1,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNewsBySlug("with-media");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var json = JsonSerializer.Serialize(ok.Value);
        Assert.DoesNotContain("StoragePath", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("C:\\internal", json, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("/uploads/media/image.jpg", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetNewsBySlug_ExposesExternalVideoInfo()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("with-video", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1));
        article.VideoUrl = "https://vimeo.com/123";
        article.VideoProvider = "vimeo";
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNewsBySlug("with-video");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PublicNewsDetailDto>(ok.Value);
        Assert.NotNull(dto.Video);
        Assert.Equal("https://vimeo.com/123", dto.Video.Url);
        Assert.Equal("vimeo", dto.Video.Provider);
    }

    [Fact]
    public async Task GetNewsBySlug_MapsMainImageAndOrdersGallery()
    {
        await using var dbContext = CreateDbContext();
        var mainMedia = CreateMedia("/uploads/media/main.jpg");
        var firstMedia = CreateMedia("/uploads/media/first.jpg");
        var secondMedia = CreateMedia("/uploads/media/second.jpg");
        var deletedMedia = CreateMedia("/uploads/media/deleted.jpg");
        deletedMedia.DeletedAt = DateTimeOffset.UtcNow;
        var article = CreateArticle("gallery", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1));
        article.MainImage = mainMedia;
        article.MainImageId = mainMedia.Id;
        article.GalleryImages.Add(CreateNewsImage(secondMedia, 2));
        article.GalleryImages.Add(CreateNewsImage(firstMedia, 1, caption: "Primera"));
        article.GalleryImages.Add(CreateNewsImage(deletedMedia, 3));
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = new PublicNewsController(dbContext);

        var result = await controller.GetNewsBySlug("gallery");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PublicNewsDetailDto>(ok.Value);
        Assert.Equal("/uploads/media/main.jpg", dto.MainImage?.Url);
        Assert.Equal(["/uploads/media/first.jpg", "/uploads/media/second.jpg"], dto.Gallery.Select(image => image.Url).ToArray());
        Assert.Equal("Primera", dto.Gallery[0].Caption);
    }

    [Fact]
    public async Task GetCategories_ReturnsOnlyActiveCategories()
    {
        await using var dbContext = CreateDbContext();
        dbContext.NewsCategories.AddRange(
            new NewsCategory { Id = Guid.NewGuid(), Name = "Activa", Slug = "activa", IsActive = true },
            new NewsCategory { Id = Guid.NewGuid(), Name = "Inactiva", Slug = "inactiva", IsActive = false });
        await dbContext.SaveChangesAsync();
        var controller = new PublicTaxonomyController(dbContext);

        var result = await controller.GetCategories();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<PublicNewsCategoryDto>>(ok.Value);
        Assert.Single(items);
        Assert.Equal("activa", items[0].Slug);
    }

    [Fact]
    public async Task GetTags_ReturnsOnlyTagsUsedByVisibleNews()
    {
        await using var dbContext = CreateDbContext();
        var visibleTag = new NewsTag { Id = Guid.NewGuid(), Name = "Visible", Slug = "visible" };
        var hiddenTag = new NewsTag { Id = Guid.NewGuid(), Name = "Hidden", Slug = "hidden" };
        var visibleArticle = CreateArticle("visible", NewsStatus.Published, DateTimeOffset.UtcNow.AddDays(-1));
        visibleArticle.Tags.Add(visibleTag);
        var draftArticle = CreateArticle("draft", NewsStatus.Draft, null);
        draftArticle.Tags.Add(hiddenTag);
        dbContext.NewsArticles.AddRange(visibleArticle, draftArticle);
        await dbContext.SaveChangesAsync();
        var controller = new PublicTaxonomyController(dbContext);

        var result = await controller.GetTags();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<PublicNewsTagDto>>(ok.Value);
        Assert.Single(items);
        Assert.Equal("visible", items[0].Slug);
    }

    private static PublicPagedResultDto<PublicNewsListItemDto> AssertPagedResult(ActionResult<PublicPagedResultDto<PublicNewsListItemDto>> result)
    {
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        return Assert.IsType<PublicPagedResultDto<PublicNewsListItemDto>>(ok.Value);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static NewsArticle CreateArticle(
        string slug,
        NewsStatus status,
        DateTimeOffset? publishedAt,
        int? featuredOrder = null)
    {
        return new NewsArticle
        {
            Id = Guid.NewGuid(),
            Title = slug,
            Slug = slug,
            Excerpt = "Resumen",
            ContentHtml = "<p>Contenido</p>",
            Status = status,
            PublishedAt = publishedAt,
            IsFeatured = featuredOrder.HasValue,
            FeaturedOrder = featuredOrder ?? 0,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    private static MediaAsset CreateMedia(string url = "/uploads/media/image.jpg")
    {
        return new MediaAsset
        {
            Id = Guid.NewGuid(),
            FileName = Path.GetFileName(url),
            OriginalFileName = "image.jpg",
            Url = url,
            StoragePath = "C:\\internal\\image.jpg",
            MimeType = "image/jpeg",
            Extension = "jpg",
            SizeBytes = 4,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }

    private static NewsImage CreateNewsImage(MediaAsset media, int sortOrder, string? caption = null)
    {
        return new NewsImage
        {
            Id = Guid.NewGuid(),
            MediaAsset = media,
            MediaAssetId = media.Id,
            Caption = caption,
            SortOrder = sortOrder,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }
}
