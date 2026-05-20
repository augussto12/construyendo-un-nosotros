using System.Security.Claims;
using Construyendo.Api.Auth;
using Construyendo.Api.Controllers;
using Construyendo.Api.Data;
using Construyendo.Api.Domain;
using Construyendo.Api.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construyendo.Api.Tests;

public class AdminUsersControllerTests
{
    [Fact]
    public void Controller_RequiresAdminOnlyPolicy()
    {
        var attribute = (AuthorizeAttribute)Assert.Single(
            typeof(AdminUsersController).GetCustomAttributes(typeof(AuthorizeAttribute), true));

        Assert.Equal("AdminOnly", attribute.Policy);
    }

    [Fact]
    public async Task CreateUser_HashesPasswordAndDoesNotExposeHash()
    {
        await using var dbContext = CreateDbContext();
        var currentAdmin = CreateUser("admin@site.test", AdminRole.Admin);
        dbContext.AdminUsers.Add(currentAdmin);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext, currentAdmin);

        var result = await controller.CreateUser(new CreateAdminUserRequest
        {
            Email = "editor@site.test",
            DisplayName = "Editor",
            Role = AdminRole.Editor,
            Password = "Password123!",
        });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var dto = Assert.IsType<AdminUserDetailDto>(created.Value);
        var storedUser = await dbContext.AdminUsers.SingleAsync(user => user.Email == "editor@site.test");

        Assert.Equal("Editor", dto.Role);
        Assert.NotEqual("Password123!", storedUser.PasswordHash);
        Assert.True(new PasswordHashService().VerifyPassword("Password123!", storedUser.PasswordHash));
        Assert.DoesNotContain(dto.GetType().GetProperties(), property => property.Name == nameof(AdminUser.PasswordHash));
    }

    [Fact]
    public async Task CreateUser_RejectsDuplicateEmail()
    {
        await using var dbContext = CreateDbContext();
        var currentAdmin = CreateUser("admin@site.test", AdminRole.Admin);
        dbContext.AdminUsers.AddRange(currentAdmin, CreateUser("editor@site.test", AdminRole.Editor));
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext, currentAdmin);

        var result = await controller.CreateUser(new CreateAdminUserRequest
        {
            Email = "EDITOR@site.test",
            DisplayName = "Editor duplicado",
            Role = AdminRole.Editor,
            Password = "Password123!",
        });

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task DeactivateUser_RejectsCurrentUser()
    {
        await using var dbContext = CreateDbContext();
        var currentAdmin = CreateUser("admin@site.test", AdminRole.Admin);
        var otherAdmin = CreateUser("admin2@site.test", AdminRole.Admin);
        dbContext.AdminUsers.AddRange(currentAdmin, otherAdmin);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext, currentAdmin);

        var result = await controller.DeactivateUser(currentAdmin.Id);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task DeactivateUser_RejectsLastActiveAdmin()
    {
        await using var dbContext = CreateDbContext();
        var currentAdmin = CreateUser("admin@site.test", AdminRole.Admin);
        var lastOtherAdmin = CreateUser("admin2@site.test", AdminRole.Admin);
        dbContext.AdminUsers.AddRange(currentAdmin, lastOtherAdmin);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext, currentAdmin);

        currentAdmin.Role = AdminRole.Editor;
        await dbContext.SaveChangesAsync();

        var result = await controller.DeactivateUser(lastOtherAdmin.Id);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task ResetPassword_ChangesHash()
    {
        await using var dbContext = CreateDbContext();
        var currentAdmin = CreateUser("admin@site.test", AdminRole.Admin);
        var editor = CreateUser("editor@site.test", AdminRole.Editor);
        dbContext.AdminUsers.AddRange(currentAdmin, editor);
        await dbContext.SaveChangesAsync();
        var oldHash = editor.PasswordHash;
        var controller = CreateController(dbContext, currentAdmin);

        var result = await controller.ResetPassword(editor.Id, new ResetAdminUserPasswordRequest
        {
            Password = "NewPassword123!",
        });

        Assert.IsType<NoContentResult>(result);
        Assert.NotEqual(oldHash, editor.PasswordHash);
        Assert.True(new PasswordHashService().VerifyPassword("NewPassword123!", editor.PasswordHash));
    }

    [Fact]
    public async Task UpdateUser_RejectsRemovingLastActiveAdminRole()
    {
        await using var dbContext = CreateDbContext();
        var currentAdmin = CreateUser("admin@site.test", AdminRole.Admin);
        dbContext.AdminUsers.Add(currentAdmin);
        await dbContext.SaveChangesAsync();
        var controller = CreateController(dbContext, currentAdmin);

        var result = await controller.UpdateUser(currentAdmin.Id, new UpdateAdminUserRequest
        {
            Email = currentAdmin.Email,
            DisplayName = currentAdmin.DisplayName,
            Role = AdminRole.Editor,
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static AdminUsersController CreateController(AppDbContext dbContext, AdminUser currentUser)
    {
        var controller = new AdminUsersController(
            dbContext,
            new PasswordHashService(),
            new TestAuditService());

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, currentUser.Id.ToString()),
            new(ClaimTypes.Role, currentUser.Role.ToString()),
        };

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth")),
            },
        };

        return controller;
    }

    private static AdminUser CreateUser(string email, AdminRole role)
    {
        var now = DateTimeOffset.UtcNow;
        return new AdminUser
        {
            Id = Guid.NewGuid(),
            Email = email,
            DisplayName = email,
            Role = role,
            PasswordHash = new PasswordHashService().HashPassword("Password123!"),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }
}
