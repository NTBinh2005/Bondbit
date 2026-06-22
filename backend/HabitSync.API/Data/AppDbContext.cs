using HabitSync.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
    
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<HabitLog> HabitLogs => Set<HabitLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId);
        
        modelBuilder.Entity<Habit>()
            .HasOne(h => h.User)
            .WithMany()
            .HasForeignKey(h => h.UserId);
        
        // habit log
        modelBuilder.Entity<HabitLog>()
            .HasOne(l => l.Habit)
            .WithMany(h => h.HabitLogs)
            .HasForeignKey(l => l.HabitId);
        
        modelBuilder.Entity<HabitLog>()
            .HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId);
        // Unique constraint on HabitLog for UserId, HabitId, and Date
        modelBuilder.Entity<HabitLog>()
            .HasIndex(l => new { l.UserId, l.HabitId, l.Date })
            .IsUnique();
    }
}