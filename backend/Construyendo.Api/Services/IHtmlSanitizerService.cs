namespace Construyendo.Api.Services;

public interface IHtmlSanitizerService
{
    string Sanitize(string html);
}
