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
    public DbSet<Partnership> Partnerships => Set<Partnership>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Conversation>  Conversations => Set<Conversation>();
    public DbSet<UserPushToken> UserPushTokens => Set<UserPushToken>();

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
        
        // partnership
        modelBuilder.Entity<Partnership>()
            .HasOne(p => p.Requester)
            .WithMany()
            .HasForeignKey(p => p.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<Partnership>()
            .HasOne(p => p.Receiver)
            .WithMany()
            .HasForeignKey(p => p.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Partnership>()
            .HasOne(p => p.Habit)
            .WithMany()
            .HasForeignKey(p => p.HabitId);
        
        modelBuilder.Entity<Partnership>()
            .HasIndex(p => new { p.RequesterId, p.ReceiverId, p.HabitId})
            .IsUnique();
        
        // conservation
        modelBuilder.Entity<Conversation>()
            .HasOne(c => c.Partnership)
            .WithOne(p => p.Conversation)
            .HasForeignKey<Conversation>(c => c.PartnershipId);
        
        // message
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId);
        
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // user push token
        modelBuilder.Entity<UserPushToken>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId);

// Mỗi user chỉ lưu một token — upsert khi đổi thiết bị
        modelBuilder.Entity<UserPushToken>()
            .HasIndex(t => t.UserId)
            .IsUnique();
    }
}