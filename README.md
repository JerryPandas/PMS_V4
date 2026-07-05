# PMS — Full Project: Setup & Deployment Guide

> This document reflects the CURRENT state of the project, including the post-round bug fixes
> and the User Management module added afterward. All application text/UI is in **English**.

---

## 1. What's in the system

| Module                                              | Where                                                          | Notes                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| JWT dual-token auth (register/login/refresh/logout) | `AuthController` + `useAuth.jsx`                               | Access token 30 min, refresh token 1 day, rotated on each refresh                                                           |
| Password security                                   | `PasswordHasher.cs`                                            | PBKDF2-HMAC-SHA256, 100,000 iterations, 16-byte salt — passwords are never stored in plain text                             |
| RBAC (Admin / Manager / Member)                     | `[Authorize(Roles=...)]` everywhere + `RoleGuard.jsx`          | See the permission matrix in §7                                                                                             |
| Kanban board                                        | `KanbanBoard.jsx` + `TasksController`                          | Todo / InProgress / Review / Done columns, drag between columns                                                             |
| Team weekly board                                   | `WeeklyBoard.jsx` + `/api/tasks/weekly`, `/drag`               | Cross-person & cross-date drag, confirmation dialog before applying, audit log in `TaskChangeLog`                           |
| Task detail view                                    | `TaskDetailDialog.jsx` + `GET /api/tasks/{id}`                 | Click any card (on the kanban board OR the weekly board) to see full description, assignee, project, and its change history |
| Projects & sub-items                                | `ProjectsListPage`, `ProjectDetailPage` + `ProjectsController` | Project code e.g. `26AA01`, sub-items with status                                                                           |
| File upload                                         | `FileUploadPanel` + `FilesController`                          | 10 MB limit, GUID-subfolder local storage, duplicate detection                                                              |
| User management                                     | `UsersListPage`, `UserDetailPage` + `UsersController`          | Admin/Manager can edit anyone's profile, role, and active status; Members can edit only their own profile — see §7          |
| Charts dashboard                                    | `DashboardPage` + `ChartsController`                           | Kanban progress pie, priority breakdown pie, team workload bar chart (MUI X Charts)                                         |
| Google Material theme                               | `muiTheme.js`                                                  | Google Blue `#1a73e8`, Google Sans + Roboto, Hash routing via React Router DOM v7                                           |

---

## 2. Running the backend (`PmsApi`)

```bash
cd PmsApi
```

1. Set a real JWT secret in `appsettings.json` → `Jwt:Secret` (256-bit, base64):
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
2. Point `ConnectionStrings:Default` at your SQL Server instance.
3. Create the database schema — **two ways**, pick one:

   **(a) EF Core migrations** (auto-generates from the C# entities):
   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

   **(b) Manual SQL scripts** (if you prefer full control over the DDL):
   ```bash
   # Run in SSMS / Azure Data Studio, in this order:
   # 1. Database/pms-schema.sql      — creates all 7 tables + indexes + FKs
   # 2. Database/pms-seed-data.sql   — inserts 4 ready-to-login test accounts,
   #                                    2 sample projects, sub-items, and tasks
   ```
   Both files live in `PmsApi/Database/`. See §6 for the seeded test accounts.

4. Run:
   ```bash
   dotnet run
   ```
   Swagger UI: `https://localhost:7080/swagger` (or whatever port `launchSettings.json` assigns). Swagger now supports JWT auth directly — click **Authorize** and paste your access token (no `Bearer ` prefix needed).

### Seeding the first Admin user

If you used the manual SQL scripts (§2b), you already have a ready-to-use `admin` account — skip to §6.

If you used EF migrations instead, there's no seed data yet: register normally through the app (new accounts default to **Member**), then promote that user to Admin directly in SQL:

```sql
UPDATE Users SET Role = 'Admin' WHERE UserName = 'your_username';
```

Once promoted, that Admin can manage every other user's role and active status from the **Users** page in the app — no more manual SQL needed after this first bootstrap step.

---

## 3. Running the frontend (`pms-web`)

```bash
cd pms-web
npm install
npm run dev
```

- Dev server: `http://localhost:5173`
- `vite.config.js` proxies `/api/*` to the backend — update the `target` to match your `PmsApi` URL.
- Because routing is hash-based, deep links look like `http://localhost:5173/#/kanban`. This means the frontend can be hosted as static files on IIS without needing URL-rewrite rules for client-side routes.
- Vite is pinned to `^6.3.0` (bundles a patched esbuild, fixing the `GHSA-67mh-4wv8-2f99` dev-server CORS advisory) with an `overrides` entry forcing `esbuild >=0.25.0` as a second safety net. Requires **Node.js 18+** (20+ recommended).

### Production build

```bash
npm run build
```
Outputs to `pms-web/dist/` — copy that folder to your IIS site's physical path.

---

## 4. IIS deployment notes

**Backend (`PmsApi`):**
- Publish with `dotnet publish -c Release -o ./publish`
- Requires the ASP.NET Core Hosting Bundle installed on the IIS server
- Create an IIS site/app pool with "No Managed Code" (the bundle's in-process module handles .NET)
- Make sure the app pool identity has write access to the `uploads` folder (`FileStorage:RootPath`)
- `Program.cs` raises Kestrel/form limits to ~12 MB so uploads up to the app's 10 MB cap are never rejected earlier by framework defaults — if you raise `FilesController.MaxFileSizeBytes`, raise the matching Kestrel/`FormOptions` limits in `Program.cs` too, and IIS's own `maxAllowedContentLength` in `web.config` if applicable
- Production (non-Development) requests now get a generic JSON 500 error instead of a leaked stack trace (see `app.UseExceptionHandler` in `Program.cs`)

**Frontend (`pms-web`):**
- Static site: point an IIS site at `dist/`
- No special URL Rewrite rules needed thanks to hash routing
- Set the production API URL by either (a) reverse-proxying `/api` to the backend site in IIS, or (b) building with an env var if you introduce `import.meta.env.VITE_API_BASE_URL` later (not wired up in this build — currently `apiClient.js` and `authAxios.js` use relative `/api`, assuming same-origin or a proxy)

---

## 5. Two bugs that were fixed after the initial build

Worth knowing about if you pull an older copy of the code:

1. **File upload silently failed.** `fileApi.js` was manually setting `Content-Type: multipart/form-data` without a boundary, and `apiClient.js`'s instance-level default `Content-Type: application/json` was overriding axios's automatic `FormData` handling on top of that. Fix: the upload call now explicitly clears the header (`headers: { 'Content-Type': undefined }`) so the browser generates the correct boundary itself.
2. **Swagger crashed on `/swagger/v1/swagger.json`.** The old `Upload` action bound `[FromForm] Guid projectId` and `[FromForm] IFormFile file` as two separate parameters, which Swashbuckle cannot generate a schema for. Fix: both are now bound through a single `UploadFileRequest` model class with `[Consumes("multipart/form-data")]`.

---

## 6. End-to-end test flow

**Fastest path — use the seed data (§2b):** log in directly with any of these (all share the password `Passw0rd!`):

| Username   | Display name | Role    |
| ---------- | ------------ | ------- |
| `admin`    | Alice Admin  | Admin   |
| `manager1` | Mia Manager  | Manager |
| `member1`  | Mark Member  | Member  |
| `member2`  | Mona Member  | Member  |

Seed data already includes 2 projects (`26AA01`, `26BB02`) with sub-items and tasks spread across kanban columns and the current week, so you can jump straight to steps 5–8 below.

**Full manual flow (no seed data):**
1. Go to `/#/register`, create the first account → becomes Member by default.
2. Promote it to Admin via SQL (see §2).
3. Log out, log back in as that Admin.
4. **Projects** → New project (e.g. code `26AA01`) → open it → add a few sub-items.
5. **Kanban** → select the project → New task → drag it across columns → click a card to see its full detail view.
6. **Weekly board** → drag a task to a different date or a different person → confirm the dialog → click a chip to see its change history.
7. **Project detail** → upload a file.
8. **Dashboard** → see the kanban/priority pies and the team workload bar chart update.
9. **Users** (Admin/Manager only) → open any user → change their role/active status. Click your own avatar in the top bar → edit your own profile or change your password.
10. Wait 30 minutes (or edit the token expiry down temporarily for testing) → confirm the app silently refreshes the access token instead of logging you out; only after the refresh token's 1-day window closes should you be redirected to `/#/login`.

---

## 7. Permission matrix (as actually implemented)

| Action                                       | Admin                          | Manager                        | Member                                |
| -------------------------------------------- | ------------------------------ | ------------------------------ | ------------------------------------- |
| View kanban / weekly board                   | ✅                              | ✅                              | ✅                                     |
| Create/drag own tasks                        | ✅                              | ✅                              | ✅                                     |
| Create/drag/reassign **anyone's** tasks      | ✅                              | ✅                              | ❌                                     |
| Create projects & sub-items                  | ✅                              | ✅                              | ❌                                     |
| Upload files                                 | ✅                              | ✅                              | ✅                                     |
| Delete files                                 | any file                       | any file                       | own files only                        |
| View `/users` list                           | ✅                              | ✅                              | ❌ (own profile only, via avatar menu) |
| Edit own profile (name/email)                | ✅                              | ✅                              | ✅                                     |
| Edit **anyone's** profile/role/active status | ✅                              | ✅                              | ❌                                     |
| Change own password                          | ✅ (needs current password)     | ✅ (needs current password)     | ✅ (needs current password)            |
| Reset **anyone's** password                  | ✅ (no current password needed) | ✅ (no current password needed) | ❌                                     |

> **Security note:** Manager and Admin currently have *identical* user-management power, including the ability to grant/revoke the Admin role itself and deactivate other Admins. This was implemented literally per your instruction ("manager can manage everyone"). If you'd rather Managers be unable to touch Admin accounts (a common privilege-escalation safeguard), that's a small, well-contained change in `UsersController.Update` — let me know and I'll add it.

---

## 8. Known gaps / good next steps

- No email verification / password-reset-via-email flow (password resets are done in-app by Admin/Manager, or via SQL for the very first bootstrap)
- Kanban/weekly drag uses native HTML5 DnD, not a library like `dnd-kit` — works well, but a dedicated DnD library would give smoother animations and touch/mobile support
- No automated tests (unit/integration) yet
- No env-var-based API base URL for the frontend production build yet (see §4)
- Manager/Admin have equal user-management power (see the security note in §7)
