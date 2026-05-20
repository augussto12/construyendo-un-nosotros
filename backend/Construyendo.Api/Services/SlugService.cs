using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Construyendo.Api.Services;

public partial class SlugService : ISlugService
{
    public string GenerateSlug(string value)
    {
        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var slug = InvalidSlugCharacters().Replace(builder.ToString().Normalize(NormalizationForm.FormC), "-");
        slug = RepeatedDashes().Replace(slug, "-").Trim('-');

        return string.IsNullOrWhiteSpace(slug) ? "noticia" : slug;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex InvalidSlugCharacters();

    [GeneratedRegex("-+")]
    private static partial Regex RepeatedDashes();
}
