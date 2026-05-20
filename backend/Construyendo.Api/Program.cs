using Construyendo.Api.Data;
using Construyendo.Api.Auth;
using Construyendo.Api.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDevelopment", policy =>
    {
        var originsFromEnvironment = builder.Configuration["CORS_ALLOWED_ORIGINS"];
        var origins = !string.IsNullOrWhiteSpace(originsFromEnvironment)
            ? originsFromEnvironment.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : builder.Configuration.GetSection("Cors:FrontendOrigins").Get<string[]>()
                ?? ["http://localhost:5173", "http://localhost:3000"];

        policy
            .WithOrigins(origins)
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IPasswordHashService, PasswordHashService>();
builder.Services.AddScoped<IAdminAuditService, AdminAuditService>();
builder.Services.AddScoped<InitialAdminSeeder>();
builder.Services.AddScoped<ISlugService, SlugService>();
builder.Services.AddScoped<IHtmlSanitizerService, BasicHtmlSanitizerService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();

var dataProtectionKeysPath = builder.Configuration["DATA_PROTECTION_KEYS_PATH"]
    ?? builder.Configuration["DataProtection:KeysPath"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeysPath))
{
    var keysDirectory = new DirectoryInfo(dataProtectionKeysPath);
    keysDirectory.Create();
    builder.Services
        .AddDataProtection()
        .SetApplicationName("ConstruyendoUnNosotros")
        .PersistKeysToFileSystem(keysDirectory);
}

var cookieName = builder.Configuration["COOKIE_NAME"]
    ?? builder.Configuration["Auth:CookieName"]
    ?? "construyendo_admin";
var forceSecureCookie = bool.TryParse(builder.Configuration["AUTH_COOKIE_SECURE"], out var secureCookie)
    ? secureCookie
    : !builder.Environment.IsDevelopment();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = cookieName;
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = forceSecureCookie
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
        options.LoginPath = "/api/admin/auth/login";
        options.LogoutPath = "/api/admin/auth/logout";
        options.AccessDeniedPath = "/api/admin/auth/forbidden";
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("AdminOrEditor", policy => policy.RequireRole("Admin", "Editor"));
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("admin-login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });
});

builder.Services
    .AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendDevelopment");
app.UseRateLimiter();

using (var scope = app.Services.CreateScope())
{
    var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
    var storageRoot = fileStorage.GetStorageRoot();
    Directory.CreateDirectory(storageRoot);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(storageRoot),
        RequestPath = fileStorage.GetPublicBasePath(),
        ServeUnknownFileTypes = false,
    });
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapHealthChecks("/api/health");

using (var scope = app.Services.CreateScope())
{
    if (app.Environment.IsDevelopment())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    var seeder = scope.ServiceProvider.GetRequiredService<InitialAdminSeeder>();
    await seeder.SeedAsync();
}

app.Run();
