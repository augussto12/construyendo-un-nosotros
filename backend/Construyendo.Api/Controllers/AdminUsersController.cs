using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using Construyendo.Api.Auth;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Admin;
using Construyendo.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/users")]
public class AdminUsersController(
    AppDbContext dbContext,
    IPasswordHashService passwordHashService,
    IAdminAuditService auditService) : ControllerBase
{
    private const int MinimumPasswordLength = 10;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminUserListItemDto>>> GetUsers()
    {
        var users = await dbContext.AdminUsers
            .AsNoTracking()
            .OrderByDescending(user => user.IsActive)
            .ThenBy(user => user.DisplayName)
            .Select(user => ToListDto(user))
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminUserDetailDto>> GetUser(Guid id)
    {
        var user = await dbContext.AdminUsers
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id);

        return user is null ? NotFound() : Ok(ToDetailDto(user));
    }

    [HttpPost]
    public async Task<ActionResult<AdminUserDetailDto>> CreateUser([FromBody] CreateAdminUserRequest request)
    {
        var validation = ValidateUserFields(request.Email, request.DisplayName, request.Password);
        if (validation is not null)
        {
            return BadRequest(new { message = validation });
        }

        var email = NormalizeEmail(request.Email);
        if (await dbContext.AdminUsers.AnyAsync(user => user.Email == email))
        {
            return Conflict(new { message = "Ya existe un usuario con ese email." });
        }

        var now = DateTimeOffset.UtcNow;
        var user = new AdminUser
        {
            Id = Guid.NewGuid(),
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            Role = request.Role,
            PasswordHash = passwordHashService.HashPassword(request.Password),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.AdminUsers.Add(user);
        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "AdminUserCreated", nameof(AdminUser), user.Id, Metadata(user));

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, ToDetailDto(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminUserDetailDto>> UpdateUser(Guid id, [FromBody] UpdateAdminUserRequest request)
    {
        var user = await dbContext.AdminUsers.SingleOrDefaultAsync(item => item.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        var validation = ValidateUserFields(request.Email, request.DisplayName);
        if (validation is not null)
        {
            return BadRequest(new { message = validation });
        }

        var currentUser = await GetCurrentUserAsync();
        var email = NormalizeEmail(request.Email);
        if (await dbContext.AdminUsers.AnyAsync(item => item.Email == email && item.Id != id))
        {
            return Conflict(new { message = "Ya existe un usuario con ese email." });
        }

        if (currentUser?.Id == user.Id
            && user.Role == AdminRole.Admin
            && request.Role != AdminRole.Admin
            && !await HasAnotherActiveAdminAsync(user.Id))
        {
            return BadRequest(new { message = "No podes dejar el sistema sin otro Admin activo." });
        }

        if (user.Role == AdminRole.Admin
            && request.Role != AdminRole.Admin
            && user.IsActive
            && !await HasAnotherActiveAdminAsync(user.Id))
        {
            return BadRequest(new { message = "No se puede quitar el rol Admin al ultimo Admin activo." });
        }

        var previousRole = user.Role;
        user.Email = email;
        user.DisplayName = request.DisplayName.Trim();
        user.Role = request.Role;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(currentUser, "AdminUserUpdated", nameof(AdminUser), user.Id, Metadata(user));
        if (previousRole != user.Role)
        {
            await auditService.RecordAsync(currentUser, "AdminUserRoleChanged", nameof(AdminUser), user.Id, JsonSerializer.Serialize(new
            {
                user.Email,
                From = previousRole.ToString(),
                To = user.Role.ToString(),
            }));
        }

        return Ok(ToDetailDto(user));
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<ActionResult<AdminUserDetailDto>> ActivateUser(Guid id)
    {
        var user = await dbContext.AdminUsers.SingleOrDefaultAsync(item => item.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsActive = true;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "AdminUserActivated", nameof(AdminUser), user.Id, Metadata(user));

        return Ok(ToDetailDto(user));
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<ActionResult<AdminUserDetailDto>> DeactivateUser(Guid id)
    {
        var user = await dbContext.AdminUsers.SingleOrDefaultAsync(item => item.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        var currentUser = await GetCurrentUserAsync();
        if (currentUser?.Id == user.Id)
        {
            return BadRequest(new { message = "No podes desactivar tu propio usuario." });
        }

        if (user.Role == AdminRole.Admin && user.IsActive && !await HasAnotherActiveAdminAsync(user.Id))
        {
            return BadRequest(new { message = "No se puede desactivar al ultimo Admin activo." });
        }

        user.IsActive = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(currentUser, "AdminUserDeactivated", nameof(AdminUser), user.Id, Metadata(user));

        return Ok(ToDetailDto(user));
    }

    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetAdminUserPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < MinimumPasswordLength)
        {
            return BadRequest(new { message = $"La password debe tener al menos {MinimumPasswordLength} caracteres." });
        }

        var user = await dbContext.AdminUsers.SingleOrDefaultAsync(item => item.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        user.PasswordHash = passwordHashService.HashPassword(request.Password);
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        await auditService.RecordAsync(await GetCurrentUserAsync(), "AdminUserPasswordReset", nameof(AdminUser), user.Id, JsonSerializer.Serialize(new { user.Email }));

        return NoContent();
    }

    private async Task<bool> HasAnotherActiveAdminAsync(Guid currentAdminId)
    {
        return await dbContext.AdminUsers.AnyAsync(user =>
            user.Id != currentAdminId
            && user.IsActive
            && user.Role == AdminRole.Admin);
    }

    private async Task<AdminUser?> GetCurrentUserAsync()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? await dbContext.AdminUsers.FindAsync(userId) : null;
    }

    private static string? ValidateUserFields(string email, string displayName, string? password = null)
    {
        if (string.IsNullOrWhiteSpace(email) || !new EmailAddressAttribute().IsValid(email.Trim()))
        {
            return "El email no tiene un formato valido.";
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return "El nombre es obligatorio.";
        }

        if (password is not null && (string.IsNullOrWhiteSpace(password) || password.Length < MinimumPasswordLength))
        {
            return $"La password debe tener al menos {MinimumPasswordLength} caracteres.";
        }

        return null;
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static AdminUserListItemDto ToListDto(AdminUser user)
    {
        return new AdminUserListItemDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
        };
    }

    private static AdminUserDetailDto ToDetailDto(AdminUser user)
    {
        return new AdminUserDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
        };
    }

    private static string Metadata(AdminUser user)
    {
        return JsonSerializer.Serialize(new
        {
            user.Email,
            Role = user.Role.ToString(),
            user.IsActive,
        });
    }
}
