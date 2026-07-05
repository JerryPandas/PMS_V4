namespace PmsApi.Application.DTOs.Auth;

public record LoginRequest(string UserName, string Password);

public record RegisterRequest(string UserName, string DisplayName, string Password, string? Email);

public record RefreshRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    UserDto User
);

public record UserDto(Guid Id, string UserName, string DisplayName, string Role, string? AvatarUrl);
