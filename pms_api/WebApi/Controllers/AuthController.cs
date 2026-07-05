using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PmsApi.Application.DTOs.Auth;
using PmsApi.Application.Interfaces;
using PmsApi.Domain.Entities;
using PmsApi.Domain.Enums;
using PmsApi.Infrastructure.Persistence;

namespace PmsApi.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthController(AppDbContext db, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.UserName == request.UserName))
            return Conflict(new { message = "Username is already taken." });

        var user = new User
        {
            UserName = request.UserName,
            DisplayName = request.DisplayName,
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = RoleType.Member // new registrations always start as Member
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await IssueTokensAsync(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserName == request.UserName);

        if (user is null || !user.IsActive || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password." });

        return await IssueTokensAsync(user);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request)
    {
        var existingToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (existingToken is null || !existingToken.IsActive || existingToken.User is null)
            return Unauthorized(new { message = "Refresh token is invalid or expired. Please log in again." });

        // Rotate refresh token: revoke old, issue new
        existingToken.RevokedAt = DateTime.UtcNow;

        var response = await IssueTokensAsync(existingToken.User, revokedTokenLink: existingToken);
        return response;
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);
        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, RefreshToken? revokedTokenLink = null)
    {
        var (accessToken, accessExpiresAt) = _jwtTokenService.GenerateAccessToken(user);
        var (refreshTokenValue, refreshExpiresAt) = _jwtTokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = refreshExpiresAt
        };

        if (revokedTokenLink is not null)
            revokedTokenLink.ReplacedByToken = refreshTokenValue;

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponse(
            accessToken,
            accessExpiresAt,
            refreshTokenValue,
            refreshExpiresAt,
            new UserDto(user.Id, user.UserName, user.DisplayName, user.Role, user.AvatarUrl)
        );
    }
}
