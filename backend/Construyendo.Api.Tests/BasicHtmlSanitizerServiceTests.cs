using Construyendo.Api.Services;

namespace Construyendo.Api.Tests;

public class BasicHtmlSanitizerServiceTests
{
    private readonly BasicHtmlSanitizerService _sanitizer = new();

    [Fact]
    public void Sanitize_RemovesScriptBlocksAndEventHandlers()
    {
        var html = "<p onclick=\"alert(1)\">Hola</p><script>alert('x')</script>";

        var sanitized = _sanitizer.Sanitize(html);

        Assert.DoesNotContain("script", sanitized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", sanitized, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("<p>Hola</p>", sanitized);
    }

    [Fact]
    public void Sanitize_ReplacesJavascriptUrls()
    {
        var html = "<a href=\"javascript:alert(1)\">link</a>";

        var sanitized = _sanitizer.Sanitize(html);

        Assert.DoesNotContain("javascript:", sanitized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("href=", sanitized, StringComparison.OrdinalIgnoreCase);
    }
}
