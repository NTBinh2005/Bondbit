namespace HabitSync.API.Models;

public class Habit
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Frequency { get; set; } = "daily"; // "daily" | "weekly"
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
    public ICollection<HabitLog>? HabitLogs { get; set; } = new List<HabitLog>();
}