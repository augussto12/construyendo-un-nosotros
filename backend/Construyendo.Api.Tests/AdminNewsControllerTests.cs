using Construyendo.Api.Controllers;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Admin;
using Construyendo.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Tests;

public class AdminNewsControllerTests
{
    [Fact]
    public async Task CreateNews_AutogeneratesUniqueSlug()
    {
        await using var dbContext = CreateDbContext();
        dbContext.NewsArticles.Add(CreateArticle("nueva-noticia"));
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.CreateNews(new CreateNewsRequest
        {
            Title = "Nueva Noticia",
            Excerpt = "Resumen",
            ContentHtml = "<p>Contenido</p>",
        });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var dto = Assert.IsType<AdminNewsDetailDto>(created.Value);
        Assert.Equal("nueva-noticia-2", dto.Slug);
    }

    [Fact]
    public async Task UpdateNews_EditsAndSanitizesContent()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("vieja-noticia");
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.UpdateNews(article.Id, new UpdateNewsRequest
        {
            Title = "Noticia Editada",
            Excerpt = "Resumen editado",
            ContentHtml = "<p onclick=\"alert(1)\">Hola</p><script>alert(1)</script>",
            Status = NewsStatus.Draft,
            VideoUrl = "https://www.youtube.com/watch?v=test",
            VideoProvider = "youtube",
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<AdminNewsDetailDto>(ok.Value);
        Assert.Equal("noticia-editada", dto.Slug);
        Assert.Equal("https://www.youtube.com/watch?v=test", dto.VideoUrl);
        Assert.Equal("youtube", dto.VideoProvider);
        Assert.DoesNotContain("onclick", dto.ContentHtml, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("script", dto.ContentHtml, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Publish_SetsPublishedStatusAndDate()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("publicable");
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.Publish(article.Id);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<AdminNewsDetailDto>(ok.Value);
        Assert.Equal(nameof(NewsStatus.Published), dto.Status);
        Assert.NotNull(dto.PublishedAt);
    }

    [Fact]
    public async Task Schedule_RejectsPastDate()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("programable");
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.Schedule(article.Id, new ScheduleNewsRequest
        {
            PublishedAt = DateTimeOffset.UtcNow.AddMinutes(-5),
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Schedule_WithFutureDate_SetsScheduledStatus()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("programable");
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);
        var futureDate = DateTimeOffset.UtcNow.AddDays(1);

        var result = await controller.Schedule(article.Id, new ScheduleNewsRequest
        {
            PublishedAt = futureDate,
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<AdminNewsDetailDto>(ok.Value);
        Assert.Equal(nameof(NewsStatus.Scheduled), dto.Status);
        Assert.Equal(futureDate.ToUniversalTime(), dto.PublishedAt);
    }

    [Fact]
    public async Task DeleteNews_ArchivesAndSoftDeletes()
    {
        await using var dbContext = CreateDbContext();
        var article = CreateArticle("archivable");
        dbContext.NewsArticles.Add(article);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext);

        var result = await controller.DeleteNews(article.Id);
        var storedArticle = await dbContext.NewsArticles.IgnoreQueryFilters().SingleAsync(item => item.Id == article.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(NewsStatus.Archived, storedArticle.Status);
        Assert.NotNull(storedArticle.DeletedAt);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static AdminNewsController CreateController(AppDbContext dbContext)
    {
        return new AdminNewsController(
            dbContext,
            new SlugService(),
            new BasicHtmlSanitizerService(),
            new TestAuditService())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext(),
            },
        };
    }

    private static NewsArticle CreateArticle(string slug)
    {
        return new NewsArticle
        {
            Id = Guid.NewGuid(),
            Title = slug,
            Slug = slug,
            Excerpt = "Resumen",
            ContentHtml = "<p>Contenido</p>",
            Status = NewsStatus.Draft,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

}
