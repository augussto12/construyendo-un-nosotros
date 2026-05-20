namespace Construyendo.Api.DTOs.Public;

public class PublicPagedResultDto<T>
{
    public IReadOnlyList<T> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}

public class PublicNewsListItemDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public PublicNewsCategoryDto? Category { get; set; }
    public IReadOnlyList<PublicNewsTagDto> Tags { get; set; } = [];
    public DateTimeOffset? PublishedAt { get; set; }
    public string? DateLabel { get; set; }
    public string? AuthorName { get; set; }
    public PublicMediaAssetDto? MainImage { get; set; }
    public PublicVideoEmbedInfoDto? Video { get; set; }
    public string? SourceUrl { get; set; }
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public PublicMediaAssetDto? OgImage { get; set; }
    public bool IsFeatured { get; set; }
    public int FeaturedOrder { get; set; }
}

public class PublicNewsDetailDto : PublicNewsListItemDto
{
    public string ContentHtml { get; set; } = string.Empty;
    public IReadOnlyList<PublicNewsImageDto> Gallery { get; set; } = [];
}

public class PublicNewsCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class PublicNewsTagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class PublicMediaAssetDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string MimeType { get; set; } = string.Empty;
}

public class PublicNewsImageDto : PublicMediaAssetDto
{
    public Guid ImageId { get; set; }
    public string? Caption { get; set; }
    public int SortOrder { get; set; }
}

public class PublicVideoEmbedInfoDto
{
    public string Url { get; set; } = string.Empty;
    public string Provider { get; set; } = "external";
}

public class PublicSiteSettingDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
}
