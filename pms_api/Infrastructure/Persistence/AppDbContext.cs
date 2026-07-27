using Microsoft.EntityFrameworkCore;
using PmsApi.Domain.Entities;

namespace PmsApi.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectItem> ProjectItems => Set<ProjectItem>();
    public DbSet<TaskCard> Tasks => Set<TaskCard>();
    public DbSet<TaskChangeLog> TaskChangeLogs => Set<TaskChangeLog>();
    public DbSet<ProjectFile> ProjectFiles => Set<ProjectFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.UserName).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasOne(rt => rt.User)
             .WithMany(u => u.RefreshTokens)
             .HasForeignKey(rt => rt.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.HasIndex(p => p.ProjectCode).IsUnique();
            e.HasOne(p => p.Owner)
             .WithMany()
             .HasForeignKey(p => p.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectItem>(e =>
        {
            e.HasOne(pi => pi.Project)
             .WithMany(p => p.Items)
             .HasForeignKey(pi => pi.ProjectId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TaskCard>(e =>
        {
            e.HasOne(t => t.Project)
             .WithMany(p => p.Tasks)
             .HasForeignKey(t => t.ProjectId)
             .OnDelete(DeleteBehavior.SetNull);

            // NOTE: NoAction here (not SetNull) is deliberate. Projects -> ProjectItems
            // is Cascade, and Projects -> Tasks (above, via ProjectId) is SetNull.
            // If this FK also cascaded/set-null, SQL Server would refuse to create it
            // with error 1785 "may cause cycles or multiple cascade paths", because
            // Tasks would then be reachable from Projects via two different cascading
            // routes. The app clears Tasks.ProjectItemId itself before deleting a
            // ProjectItem — see ProjectsController.DeleteItem.
            e.HasOne(t => t.ProjectItem)
             .WithMany()
             .HasForeignKey(t => t.ProjectItemId)
             .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(t => t.Assignee)
             .WithMany()
             .HasForeignKey(t => t.AssigneeId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TaskChangeLog>(e =>
        {
            e.HasOne(l => l.Task)
             .WithMany(t => t.ChangeLogs)
             .HasForeignKey(l => l.TaskId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectFile>(e =>
        {
            e.HasOne(f => f.Project)
             .WithMany(p => p.Files)
             .HasForeignKey(f => f.ProjectId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
