using System.ComponentModel.DataAnnotations;

namespace HabitSync.API.Models;

public class Habit
{
    public long Id { get; set; }
    public long UserId { get; set; }
    [MaxLength(30)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(150)]
    public string? Description { get; set; }
    [MaxLength(10)]
    public string Frequency { get; set; } = "daily"; // "daily" | "weekly"
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
    public ICollection<HabitLog>? HabitLogs { get; set; } = new List<HabitLog>();
}