namespace HabitSync.API.Models;

public class HabitLog
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long HabitId { get; set; }
    public DateOnly Date { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User User { get; set; } = null!;
    public Habit Habit { get; set; } = null!;
}