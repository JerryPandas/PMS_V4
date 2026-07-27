# PmsApi — Backend Skeleton (Round 2)

## What's included in this round
- Domain entities: `User`, `RefreshToken`, `Project`, `ProjectItem`, `TaskCard`, `TaskChangeLog`, `ProjectFile`
- EF Core `AppDbContext` with relationships configured
- JWT dual-token auth:
  - Access token: JWT, **30 minutes**, contains `sub`, `role` claims
  - Refresh token: opaque random string, **1 day**, stored in `RefreshTokens` table, rotated on every refresh
- `PasswordHasher` using built-in PBKDF2 (no external NuGet dependency)
- `AuthController`: `/api/auth/register`, `/login`, `/refresh`, `/logout`
- RBAC groundwork via `[Authorize(Roles = "Admin,Manager")]` and named policies `AdminOnly` / `AdminOrManager`

## Before running

1. **Generate a real JWT secret** (256-bit, base64) and put it in `appsettings.json` → `Jwt:Secret`.
   PowerShell example:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```

2. **Update the connection string** in `appsettings.json` → `ConnectionStrings:Default` to point at your SQL Server instance.

3. **Create the initial migration and update the database:**
   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

4. **Run the API:**
   ```bash
   dotnet run
   ```
   Swagger UI will be available at `/swagger` in Development.

## Token refresh flow recap
- Frontend calls protected endpoints with `Authorization: Bearer {accessToken}`.
- On `401`, frontend calls `POST /api/auth/refresh` with the stored refresh token.
- If the refresh token is still valid (< 1 day old, not revoked), a **new** access token AND a **new rotated** refresh token are returned; the old refresh token is marked revoked.
- If the refresh token is expired/revoked, the API returns `401` and the frontend must redirect to `/login`.

## Next round (Round 3)
Frontend skeleton: Vite + React 18 + MUI theme (Google Material style) + React Router DOM v7 (Hash router) + Login/Register pages + axios client with automatic access-token refresh interceptor.
