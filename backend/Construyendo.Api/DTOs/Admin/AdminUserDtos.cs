using Construyendo.Api.Domain;

namespace Construyendo.Api.DTOs.Admin;

public class AdminUserListItemDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class AdminUserDetailDto : AdminUserListItemDto
{
}

public class CreateAdminUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public AdminRole Role { get; set; } = AdminRole.Editor;
    public string Password { get; set; } = string.Empty;
}

public class UpdateAdminUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public AdminRole Role { get; set; } = AdminRole.Editor;
}

public class ResetAdminUserPasswordRequest
{
    public string Password { get; set; } = string.Empty;
}
