using Construyendo.Api.Services;

namespace Construyendo.Api.Tests;

public class SlugServiceTests
{
    private readonly SlugService _slugService = new();

    [Theory]
    [InlineData("Cumplimos Un Año", "cumplimos-un-ano")]
    [InlineData("  Torneo de Fútbol Mixto!  ", "torneo-de-futbol-mixto")]
    [InlineData("###", "noticia")]
    public void GenerateSlug_NormalizesInput(string value, string expected)
    {
        var slug = _slugService.GenerateSlug(value);

        Assert.Equal(expected, slug);
    }
}
