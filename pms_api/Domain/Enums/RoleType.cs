namespace PmsApi.Domain.Enums;

/// <summary>
/// System-wide user roles used for RBAC (Role-Based Access Control).
/// </summary>
public static class RoleType
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Member = "Member";

    public static readonly string[] All = { Admin, Manager, Member };

    public static bool IsValid(string role) => All.Contains(role);
}
