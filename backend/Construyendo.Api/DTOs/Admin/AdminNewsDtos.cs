using System.ComponentModel.DataAnnotations;
using Construyendo.Api.Domain;

namespace Construyendo.Api.DTOs.Admin;

public class AdminNewsListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? AuthorName { get; set; }
    public bool IsFeatured { get; set; }
    public int FeaturedOrder { get; set; }
    public int SortOrder { get; set; }
    public CategoryDto? Category { get; set; }
    public IReadOnlyList<TagDto> Tags { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class AdminNewsDetailDto : AdminNewsListItemDto
{
    public string ContentHtml { get; set; } = string.Empty;
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SourceUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? VideoProvider { get; set; }
    public MediaAssetDto? MainImage { get; set; }
    public IReadOnlyList<NewsImageDto> Gallery { get; set; } = [];
}

public class CreateNewsRequest
{
    [Required]
    [MaxLength(220)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(240)]
    public string? Slug { get; set; }

    [Required]
    [MaxLength(600)]
    public string Excerpt { get; set; } = string.Empty;

    public string ContentHtml { get; set; } = string.Empty;
    public NewsStatus? Status { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    [MaxLength(160)]
    public string? AuthorName { get; set; }

    public bool IsFeatured { get; set; }
    public int FeaturedOrder { get; set; }
    public int SortOrder { get; set; }

    [MaxLength(220)]
    public string? SeoTitle { get; set; }

    [MaxLength(320)]
    public string? SeoDescription { get; set; }

    [MaxLength(1000)]
    public string? SourceUrl { get; set; }

    [MaxLength(1000)]
    public string? VideoUrl { get; set; }

    [MaxLength(32)]
    public string? VideoProvider { get; set; }

    public Guid? CategoryId { get; set; }
    public IReadOnlyList<Guid> TagIds { get; set; } = [];
}

public class UpdateNewsRequest : CreateNewsRequest
{
}

public class ScheduleNewsRequest
{
    [Required]
    public DateTimeOffset PublishedAt { get; set; }

    public DateTimeOffset? ExpiresAt { get; set; }
}

public class FeaturedOrderRequest
{
    public IReadOnlyList<FeaturedOrderItemDto> Items { get; set; } = [];
}

public class FeaturedOrderItemDto
{
    public Guid Id { get; set; }
    public int FeaturedOrder { get; set; }
}

public class PagedResultDto<T>
{
    public IReadOnlyList<T> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
