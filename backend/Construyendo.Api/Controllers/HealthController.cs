using Microsoft.AspNetCore.Mvc;

namespace Construyendo.Api.Controllers;

[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/api/public/ping")]
    public IActionResult Ping()
    {
        return Ok(new { message = "pong" });
    }
}
