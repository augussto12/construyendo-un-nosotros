using System.Security.Claims;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Auth;
using Construyendo.Api.Auth;
using Construyendo.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController(
    AppDbContext dbContext,
    IPasswordHashService passwordHashService,
    IAdminAuditService auditService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("admin-login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.AdminUsers.SingleOrDefaultAsync(adminUser => adminUser.Email == email);

        if (user is null
            || !user.IsActive
            || !passwordHashService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Credenciales invalidas." });
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Role, user.Role.ToString()),
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                IssuedUtc = DateTimeOffset.UtcNow,
            });

        user.LastLoginAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(user, "AdminLogin", nameof(AdminUser), user.Id);

        return Ok(new AuthMeResponse
        {
            IsAuthenticated = true,
            User = ToDto(user),
        });
    }

    [HttpPost("logout")]
    [Authorize(Policy = "AdminOrEditor")]
    public async Task<IActionResult> Logout()
    {
        var user = await GetCurrentUserAsync();

        if (user is not null)
        {
            await auditService.RecordAsync(user, "AdminLogout", nameof(AdminUser), user.Id);
        }

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize(Policy = "AdminOrEditor")]
    public async Task<ActionResult<AuthMeResponse>> Me()
    {
        var user = await GetCurrentUserAsync();

        if (user is null || !user.IsActive)
        {
            return Unauthorized(new { message = "No autenticado." });
        }

        return Ok(new AuthMeResponse
        {
            IsAuthenticated = true,
            User = ToDto(user),
        });
    }

    private async Task<AdminUser?> GetCurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(id, out var userId)
            ? await dbContext.AdminUsers.FindAsync(userId)
            : null;
    }

    private static AdminUserDto ToDto(AdminUser user)
    {
        return new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
        };
    }
}
