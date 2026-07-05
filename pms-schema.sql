/* ============================================================
   PMS Database — Manual DDL Script
   Run this directly in SSMS / Azure Data Studio instead of
   `dotnet ef database update`, if you prefer manual control.
   Matches the EF Core entities in PmsApi.Domain.Entities exactly.
   ============================================================ */

-- 0. Create database (skip if it already exists)
USE pms_v4

GO

/* ------------------------------------------------------------
   1. Users
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO
CREATE TABLE dbo.Users (
    Id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    UserName     NVARCHAR(50)     NOT NULL,
    DisplayName  NVARCHAR(50)     NOT NULL,
    PasswordHash NVARCHAR(256)    NOT NULL,
    Email        NVARCHAR(100)    NULL,
    Role         NVARCHAR(20)     NOT NULL DEFAULT 'Member', -- Admin / Manager / Member
    AvatarUrl    NVARCHAR(300)    NULL,
    IsActive     BIT              NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
CREATE UNIQUE INDEX UX_Users_UserName ON dbo.Users(UserName);
GO

/* ------------------------------------------------------------
   2. RefreshTokens
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NOT NULL DROP TABLE dbo.RefreshTokens;
GO
CREATE TABLE dbo.RefreshTokens (
    Id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    UserId           UNIQUEIDENTIFIER NOT NULL,
    Token            NVARCHAR(300)    NOT NULL,
    ExpiresAt        DATETIME2        NOT NULL,   -- issued time + 1 day
    CreatedAt        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    RevokedAt        DATETIME2        NULL,
    ReplacedByToken  NVARCHAR(300)    NULL,
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId)
        REFERENCES dbo.Users(Id) ON DELETE CASCADE
);
GO
CREATE INDEX IX_RefreshTokens_UserId ON dbo.RefreshTokens(UserId);
CREATE INDEX IX_RefreshTokens_Token ON dbo.RefreshTokens(Token);
GO

/* ------------------------------------------------------------
   3. Projects
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Projects', 'U') IS NOT NULL DROP TABLE dbo.Projects;
GO
CREATE TABLE dbo.Projects (
    Id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProjectCode  NVARCHAR(30)     NOT NULL,   -- e.g. 26AA01
    Name         NVARCHAR(200)    NOT NULL,
    Description  NVARCHAR(MAX)    NULL,
    Status       NVARCHAR(20)     NOT NULL DEFAULT 'Active', -- Active/OnHold/Completed
    OwnerId      UNIQUEIDENTIFIER NOT NULL,
    CreatedAt    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Projects_Owner FOREIGN KEY (OwnerId)
        REFERENCES dbo.Users(Id) ON DELETE NO ACTION
);
GO
CREATE UNIQUE INDEX UX_Projects_ProjectCode ON dbo.Projects(ProjectCode);
GO

/* ------------------------------------------------------------
   4. ProjectItems (sub-items)
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.ProjectItems', 'U') IS NOT NULL DROP TABLE dbo.ProjectItems;
GO
CREATE TABLE dbo.ProjectItems (
    Id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProjectId  UNIQUEIDENTIFIER NOT NULL,
    ItemCode   NVARCHAR(30)     NULL,        -- e.g. 26AA01-01
    Title      NVARCHAR(200)    NOT NULL,
    Status     NVARCHAR(20)     NOT NULL DEFAULT 'Todo', -- Todo/InProgress/Done
    SortOrder  INT              NOT NULL DEFAULT 0,
    CreatedAt  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ProjectItems_Projects FOREIGN KEY (ProjectId)
        REFERENCES dbo.Projects(Id) ON DELETE CASCADE
);
GO
CREATE INDEX IX_ProjectItems_ProjectId ON dbo.ProjectItems(ProjectId);
GO

/* ------------------------------------------------------------
   5. Tasks (kanban cards + weekly board cards)
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Tasks', 'U') IS NOT NULL DROP TABLE dbo.Tasks;
GO
CREATE TABLE dbo.Tasks (
    Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProjectId       UNIQUEIDENTIFIER NULL,
    ProjectItemId   UNIQUEIDENTIFIER NULL,
    Title           NVARCHAR(200)    NOT NULL,
    Description     NVARCHAR(MAX)    NULL,
    AssigneeId      UNIQUEIDENTIFIER NOT NULL,
    ScheduledDate   DATE             NOT NULL,   -- drag target for the weekly board
    KanbanColumn    NVARCHAR(20)     NOT NULL DEFAULT 'Todo', -- Todo/InProgress/Review/Done
    Priority        NVARCHAR(10)     NOT NULL DEFAULT 'Normal', -- Low/Normal/High
    SortOrder       INT              NOT NULL DEFAULT 0,
    CreatedBy       UNIQUEIDENTIFIER NOT NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Tasks_Projects FOREIGN KEY (ProjectId)
        REFERENCES dbo.Projects(Id) ON DELETE SET NULL,
    -- NOTE: NO ACTION here (not SET NULL) is deliberate. Projects -> ProjectItems
    -- is already ON DELETE CASCADE, and Projects -> Tasks (above) is ON DELETE
    -- SET NULL. If this FK also cascaded/set-null, SQL Server would refuse to
    -- create it with error 1785 "may cause cycles or multiple cascade paths",
    -- because Tasks would then be reachable from Projects via two different
    -- cascading routes. The app clears Tasks.ProjectItemId itself before
    -- deleting a ProjectItem (see ProjectsController.DeleteItem).
    CONSTRAINT FK_Tasks_ProjectItems FOREIGN KEY (ProjectItemId)
        REFERENCES dbo.ProjectItems(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Tasks_Assignee FOREIGN KEY (AssigneeId)
        REFERENCES dbo.Users(Id) ON DELETE NO ACTION
);
GO
CREATE INDEX IX_Tasks_ProjectId ON dbo.Tasks(ProjectId);
CREATE INDEX IX_Tasks_AssigneeId ON dbo.Tasks(AssigneeId);
CREATE INDEX IX_Tasks_ScheduledDate ON dbo.Tasks(ScheduledDate);
GO

/* ------------------------------------------------------------
   6. TaskChangeLogs (drag/reassign audit trail)
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.TaskChangeLogs', 'U') IS NOT NULL DROP TABLE dbo.TaskChangeLogs;
GO
CREATE TABLE dbo.TaskChangeLogs (
    Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    TaskId      UNIQUEIDENTIFIER NOT NULL,
    ChangeType  NVARCHAR(20)     NOT NULL, -- DateChanged / AssigneeChanged
    OldValue    NVARCHAR(100)    NULL,
    NewValue    NVARCHAR(100)    NULL,
    ChangedBy   UNIQUEIDENTIFIER NOT NULL,
    ChangedAt   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_TaskChangeLogs_Tasks FOREIGN KEY (TaskId)
        REFERENCES dbo.Tasks(Id) ON DELETE CASCADE
);
GO
CREATE INDEX IX_TaskChangeLogs_TaskId ON dbo.TaskChangeLogs(TaskId);
GO

/* ------------------------------------------------------------
   7. ProjectFiles
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.ProjectFiles', 'U') IS NOT NULL DROP TABLE dbo.ProjectFiles;
GO
CREATE TABLE dbo.ProjectFiles (
    Id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    ProjectId     UNIQUEIDENTIFIER NOT NULL,
    FileName      NVARCHAR(260)    NOT NULL,
    StoragePath   NVARCHAR(400)    NOT NULL,  -- {projectId}/{guid}/{fileName}
    FileSize      BIGINT           NOT NULL,
    UploadedBy    UNIQUEIDENTIFIER NOT NULL,
    UploadedAt    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ProjectFiles_Projects FOREIGN KEY (ProjectId)
        REFERENCES dbo.Projects(Id) ON DELETE CASCADE
);
GO
CREATE INDEX IX_ProjectFiles_ProjectId ON dbo.ProjectFiles(ProjectId);
GO

/* ============================================================
   8. Optional seed data
   Uncomment to insert a starter Admin user and a sample project.

   IMPORTANT: PasswordHash must be generated by the app's PBKDF2
   hasher (PmsApi.Infrastructure.Auth.PasswordHasher) — you cannot
   hand-write a valid hash here. Two ways to get a real admin:

     (a) Recommended: register normally through the app (creates a
         Member), then run just the UPDATE statement below to
         promote that account to Admin.

     (b) Advanced: generate a PBKDF2 hash offline in the exact
         "{iterations}.{saltBase64}.{hashBase64}" format the app
         uses, and paste it into the INSERT below.
   ============================================================ */

-- (a) Promote an existing user (registered via the app) to Admin:
-- UPDATE dbo.Users SET Role = 'Admin' WHERE UserName = 'your_username';

-- (b) Sample project + sub-items, once you have at least one user:
/*
DECLARE @OwnerId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM dbo.Users WHERE Role = 'Admin');

INSERT INTO dbo.Projects (ProjectCode, Name, Description, OwnerId)
VALUES ('26AA01', 'Sample Project', 'Seed data for local testing', @OwnerId);

DECLARE @ProjectId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Projects WHERE ProjectCode = '26AA01');

INSERT INTO dbo.ProjectItems (ProjectId, ItemCode, Title, Status, SortOrder) VALUES
    (@ProjectId, '26AA01-01', 'Requirements review', 'Done', 0),
    (@ProjectId, '26AA01-02', 'Database design',      'InProgress', 1),
    (@ProjectId, '26AA01-03', 'Frontend scaffolding',  'Todo', 2);
*/

PRINT 'PMS schema created successfully.';
