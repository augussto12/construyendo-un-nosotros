using System.ComponentModel.DataAnnotations;

namespace Construyendo.Api.DTOs.Admin;

public class AdminSiteSettingDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool IsPublic { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

public class UpdateSiteSettingRequest
{
    [MaxLength(2000)]
    public string Value { get; set; } = string.Empty;
}
