using PmsApi.Domain.Entities;

namespace PmsApi.Application.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}

public interface IJwtTokenService
{
    /// <summary>Generates a short-lived JWT access token (30 minutes).</summary>
    (string token, DateTime expiresAt) GenerateAccessToken(User user);

    /// <summary>Generates a long-lived opaque refresh token (1 day), not JWT.</summary>
    (string token, DateTime expiresAt) GenerateRefreshToken();
}
