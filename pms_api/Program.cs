using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PmsApi.Application.Interfaces;
using PmsApi.Infrastructure.Auth;
using PmsApi.Infrastructure.FileStorage;
using PmsApi.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // JWT bearer auth support in Swagger UI, so protected endpoints can be tested there.
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Paste ONLY the access token (no \"Bearer \" prefix needed here)."
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();

// Raise the multipart form limits so uploads up to our 10 MB app-level check
// (see FilesController.MaxFileSizeBytes) are never rejected earlier by the
// framework's own (lower) defaults for individual multipart sections.
const long MaxUploadBytes = 12 * 1024 * 1024; // small headroom above the 10 MB app limit
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = MaxUploadBytes;
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MaxUploadBytes;
});

// CORS: allow the Vite dev server / production frontend origin.
// Falls back to the standard Vite dev ports if Cors:AllowedOrigins is missing
// from configuration, so a misconfigured appsettings.json never silently
// blocks every request instead of failing loudly.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
if (allowedOrigins is null || allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:5173", "http://127.0.0.1:5173" };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// JWT Bearer authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var secret = jwtSection["Secret"]!;

// Fail fast, at startup, with a clear message — rather than letting an invalid
// secret surface later as a cryptic System.FormatException deep inside the
// first login/register request.
try
{
    var secretBytes = Convert.FromBase64String(secret);
    if (secretBytes.Length < 32)
    {
        throw new InvalidOperationException(
            $"Jwt:Secret in appsettings.json decodes to only {secretBytes.Length} bytes; it must be at least 32 bytes (256 bits).");
    }
}
catch (FormatException)
{
    throw new InvalidOperationException(
        "Jwt:Secret in appsettings.json is not a valid base64 string. Generate one with, e.g.:\n" +
        "  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))  (PowerShell)\n" +
        "and paste the result into appsettings.json → Jwt:Secret.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSection["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSection["Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(secret)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero // no grace period: 30-minute access token means what it says
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
    options.AddPolicy("AdminOrManager", p => p.RequireRole("Admin", "Manager"));
});

var app = builder.Build();

// ---------- Middleware pipeline ----------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Production: never leak stack traces — return a consistent JSON error shape instead.
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            // Always log the real exception to the console/log sink, even though the
            // HTTP response stays generic — otherwise a production-mode error becomes
            // completely invisible and impossible to diagnose.
            var exceptionFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
            if (exceptionFeature?.Error is { } ex)
            {
                var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "Unhandled exception on {Path}", exceptionFeature.Path);
            }

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "An unexpected error occurred." });
        });
    });
}

app.UseHttpsRedirection();

// Serve uploaded project files (matches LocalFileStorageService's PublicBasePath = /uploads).
// FileStorage:RootPath in appsettings.json is "uploads" (relative) for portability across
// machines, but PhysicalFileProvider throws "The path must be absolute" if given a relative
// path — so resolve it against the app's base directory before using it.
var configuredUploadsRoot = builder.Configuration["FileStorage:RootPath"] ?? "uploads";
var uploadsRoot = Path.IsPathRooted(configuredUploadsRoot)
    ? configuredUploadsRoot
    : Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configuredUploadsRoot));
Directory.CreateDirectory(uploadsRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads"
});

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
