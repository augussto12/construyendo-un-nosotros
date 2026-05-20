namespace Construyendo.Api.DTOs.Auth;

public class AuthMeResponse
{
    public bool IsAuthenticated { get; set; }
    public AdminUserDto? User { get; set; }
}
