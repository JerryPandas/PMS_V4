/* ============================================================
   PMS — Seed Data Script
   Run AFTER pms-schema.sql has created the tables.

   Single seed account:
     Username: admin
     Password: admin@123
   The password hash below is a REAL PBKDF2 hash generated with
   the exact same algorithm as PmsApi.Infrastructure.Auth.
   PasswordHasher (SHA256, 100,000 iterations, 16-byte salt,
   32-byte hash), so you can log in with it immediately — no
   need to register through the app first.
   ============================================================ */

USE pms_v4;
GO

/* ------------------------------------------------------------
    1. Users
    ------------------------------------------------------------ */
DECLARE @AdminId UNIQUEIDENTIFIER = NEWID();
DECLARE @ManagerId UNIQUEIDENTIFIER = NEWID();
DECLARE @Member1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Member2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Member3Id UNIQUEIDENTIFIER = NEWID();

-- admin / admin@123
INSERT INTO dbo.Users (Id, UserName, DisplayName, PasswordHash, Email, Role, IsActive) VALUES
(@AdminId, 'admin', 'Admin', '100000.1UpYuugOE6a2Zt3NkSlb/A==.qkaZ34iuhQpTHejq10M8hy862lGk/Ifdp0+s+ziI6Q0=', 'admin@pms.local', 'Admin', 1);

-- manager / manager@123
INSERT INTO dbo.Users (Id, UserName, DisplayName, PasswordHash, Email, Role, IsActive) VALUES
(@ManagerId, 'manager', 'Manager', '100000.1UpYuugOE6a2Zt3NkSlb/A==.qkaZ34iuhQpTHejq10M8hy862lGk/Ifdp0+s+ziI6Q0=', 'manager@pms.local', 'Manager', 1);

-- member1 / member1@123
INSERT INTO dbo.Users (Id, UserName, DisplayName, PasswordHash, Email, Role, IsActive) VALUES
(@Member1Id, 'member1', 'Member One', '100000.1UpYuugOE6a2Zt3NkSlb/A==.qkaZ34iuhQpTHejq10M8hy862lGk/Ifdp0+s+ziI6Q0=', 'member1@pms.local', 'Member', 1);

-- member2 / member2@123
INSERT INTO dbo.Users (Id, UserName, DisplayName, PasswordHash, Email, Role, IsActive) VALUES
(@Member2Id, 'member2', 'Member Two', '100000.1UpYuugOE6a2Zt3NkSlb/A==.qkaZ34iuhQpTHejq10M8hy862lGk/Ifdp0+s+ziI6Q0=', 'member2@pms.local', 'Member', 1);

-- member3 / member3@123
INSERT INTO dbo.Users (Id, UserName, DisplayName, PasswordHash, Email, Role, IsActive) VALUES
(@Member3Id, 'member3', 'Member Three', '100000.1UpYuugOE6a2Zt3NkSlb/A==.qkaZ34iuhQpTHejq10M8hy862lGk/Ifdp0+s+ziI6Q0=', 'member3@pms.local', 'Member', 1);

/* ------------------------------------------------------------
    2. Projects
    ------------------------------------------------------------ */
DECLARE @Project1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Project2Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.Projects (Id, ProjectCode, Name, Description, Status, OwnerId) VALUES
(@Project1Id, '26AA01', 'Warehouse Management Upgrade',
    'Modernize the warehouse inventory system with real-time tracking.', 'Active', @AdminId),
(@Project2Id, '26BB02', 'Customer Portal Revamp',
    'Redesign the customer-facing portal with a new UI and faster checkout.', 'Active', @ManagerId);

/* ------------------------------------------------------------
   3. Project sub-items
   ------------------------------------------------------------ */
INSERT INTO dbo.ProjectItems (ProjectId, ItemCode, Title, Status, SortOrder) VALUES
(@Project1Id, '26AA01-01', 'Requirements gathering',      'Done',       0),
(@Project1Id, '26AA01-02', 'Database schema design',      'Done',       1),
(@Project1Id, '26AA01-03', 'Barcode scanner integration', 'InProgress', 2),
(@Project1Id, '26AA01-04', 'UAT & sign-off',               'Todo',       3),
(@Project2Id, '26BB02-01', 'UX research & wireframes',    'Done',       0),
(@Project2Id, '26BB02-02', 'Checkout flow redesign',      'InProgress', 1),
(@Project2Id, '26BB02-03', 'Payment gateway migration',    'Todo',       2);

/* ------------------------------------------------------------
    4. Kanban tasks (spread across all 4 columns), assigned
       to multiple users for a realistic board.
    ------------------------------------------------------------ */
INSERT INTO dbo.Tasks (ProjectId, Title, Description, AssigneeId, ScheduledDate, KanbanColumn, Priority, SortOrder, CreatedBy) VALUES
(@Project1Id, 'Draft inventory data model',        'Define tables for stock, bins, and SKUs.', @AdminId, CAST(GETDATE() AS DATE),        'Done',       'Normal', 0, @AdminId),
(@Project1Id, 'Review schema with DBA',            NULL,                                        @AdminId, CAST(GETDATE() AS DATE),        'Done',       'Normal', 1, @AdminId),
(@Project1Id, 'Integrate barcode scanner SDK',      'Evaluate 2 vendor SDKs.',                   @Member1Id, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), 'InProgress', 'High',   0, @AdminId),
(@Project1Id, 'Write scanner integration tests',    NULL,                                        @Member1Id, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)), 'InProgress', 'Normal', 1, @AdminId),
(@Project1Id, 'Prepare UAT test cases',             NULL,                                        @Member2Id, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)), 'Review',     'Normal', 0, @AdminId),
(@Project1Id, 'Plan UAT sign-off meeting',          NULL,                                        @ManagerId, DATEADD(DAY, 5, CAST(GETDATE() AS DATE)), 'Todo',       'Low',    0, @AdminId),
(@Project2Id, 'Wireframe checkout screens',         NULL,                                        @Member3Id, CAST(GETDATE() AS DATE),        'Done',       'Normal', 0, @AdminId),
(@Project2Id, 'Build checkout React components',    'Cart summary, address form, payment step.', @Member3Id, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), 'InProgress', 'High',   0, @AdminId),
(@Project2Id, 'Research payment gateway options',   'Compare Stripe vs. Adyen fees.',            @Member2Id, DATEADD(DAY, 4, CAST(GETDATE() AS DATE)), 'Todo',       'Normal', 0, @AdminId);

/* ------------------------------------------------------------
    5. A few tasks scheduled for THIS WEEK, for testing the
       team weekly board.
    ------------------------------------------------------------ */
DECLARE @Monday DATE = DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) / 7 * 7, 0);

INSERT INTO dbo.Tasks (ProjectId, Title, AssigneeId, ScheduledDate, KanbanColumn, Priority, SortOrder, CreatedBy) VALUES
(@Project1Id, 'Standup notes',          @AdminId,   @Monday,                  'Todo', 'Low',    0, @AdminId),
(@Project1Id, 'Fix bin-location bug',   @Member1Id, DATEADD(DAY, 1, @Monday), 'Todo', 'High',   0, @AdminId),
(@Project2Id, 'Client feedback review', @Member2Id, DATEADD(DAY, 1, @Monday), 'Todo', 'Normal', 0, @AdminId),
(@Project2Id, 'Payment gateway demo',   @Member3Id, DATEADD(DAY, 3, @Monday), 'Todo', 'Normal', 0, @AdminId),
(@Project1Id, 'Sprint planning',        @ManagerId, DATEADD(DAY, 4, @Monday), 'Todo', 'Normal', 0, @AdminId);

PRINT 'Seed data inserted successfully.';
PRINT 'Login with: admin / admin@123 (Admin), manager / manager@123 (Manager), member1 / member1@123 (Member), member2 / member2@123 (Member), member3 / member3@123 (Member)';
