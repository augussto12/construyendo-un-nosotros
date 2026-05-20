namespace Construyendo.Api.Domain;

public class SiteSetting
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Type { get; set; } = "text";
    public bool IsPublic { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
