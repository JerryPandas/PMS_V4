using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PmsApi.Application.Interfaces;
using PmsApi.Domain.Enums;
using PmsApi.Infrastructure.Persistence;
using System.Security.Claims;

namespace PmsApi.WebApi.Controllers;

public record UserSummaryDto(Guid Id, string UserName, string DisplayName, string Role, string? AvatarUrl);

public record UserDetailDto(
    Guid Id, string UserName, string DisplayName, string? Email,
    string Role, string? AvatarUrl, bool IsActive, DateTime CreatedAt
);

public record UpdateUserRequest(string? DisplayName, string? Email, string? AvatarUrl, string? Role, bool? IsActive);

public record ChangePasswordRequest(string? CurrentPassword, string NewPassword);

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public UsersController(AppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string CurrentRole => User.FindFirst(ClaimTypes.Role)!.Value;
    private bool CanManageOthers => CurrentRole is RoleType.Admin or RoleType.Manager;

    /// <summary>Lightweight active-user list, used for assignee pickers across the app.</summary>
    [HttpGet]
    public async Task<ActionResult<List<UserSummaryDto>>> GetAll()
    {
        var users = await _db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.DisplayName)
            .Select(u => new UserSummaryDto(u.Id, u.UserName, u.DisplayName, u.Role, u.AvatarUrl))
            .ToListAsync();

        return users;
    }

    /// <summary>Full user list (including inactive) for the User Management page.</summary>
    [Authorize(Roles = $"{RoleType.Admin},{RoleType.Manager}")]
    [HttpGet("management")]
    public async Task<ActionResult<List<UserDetailDto>>> GetForManagement()
    {
        var users = await _db.Users
            .OrderBy(u => u.DisplayName)
            .Select(u => new UserDetailDto(
                u.Id, u.UserName, u.DisplayName, u.Email, u.Role, u.AvatarUrl, u.IsActive, u.CreatedAt))
            .ToListAsync();

        return users;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDetailDto>> GetById(Guid id)
    {
        // Self can view their own profile; Admin/Manager can view anyone's.
        if (id != CurrentUserId && !CanManageOthers) return Forbid();

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        return new UserDetailDto(
            user.Id, user.UserName, user.DisplayName, user.Email, user.Role, user.AvatarUrl, user.IsActive, user.CreatedAt);
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<UserDetailDto>> Update(Guid id, UpdateUserRequest request)
    {
        var isSelf = id == CurrentUserId;
        if (!isSelf && !CanManageOthers) return Forbid();

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        // Anyone editing their own profile (or Admin/Manager editing someone else)
        // may update basic profile fields.
        if (request.DisplayName is not null) user.DisplayName = request.DisplayName;
        if (request.Email is not null) user.Email = request.Email;
        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;

        // Role and active-status changes are restricted to Admin/Manager.
        // A Member editing their own profile cannot grant themselves a role
        // or reactivate/deactivate their own account.
        if (CanManageOthers)
        {
            if (request.Role is not null && RoleType.IsValid(request.Role))
                user.Role = request.Role;

            if (request.IsActive is not null)
                user.IsActive = request.IsActive.Value;
        }

        await _db.SaveChangesAsync();

        return new UserDetailDto(
            user.Id, user.UserName, user.DisplayName, user.Email, user.Role, user.AvatarUrl, user.IsActive, user.CreatedAt);
    }

    [HttpPatch("{id:guid}/password")]
    public async Task<IActionResult> ChangePassword(Guid id, ChangePasswordRequest request)
    {
        var isSelf = id == CurrentUserId;
        if (!isSelf && !CanManageOthers) return Forbid();

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        // Self-service password changes must prove knowledge of the current password.
        // Admin/Manager resetting someone ELSE's password can skip that check.
        if (isSelf)
        {
            if (string.IsNullOrEmpty(request.CurrentPassword) ||
                !_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
