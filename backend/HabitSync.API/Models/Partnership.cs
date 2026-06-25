using System.ComponentModel.DataAnnotations;

namespace HabitSync.API.Models;

public class Partnership
{
    public long Id { get; set; }
    public long RequesterId { get; set; }
    public long ReceiverId { get; set; }
    public long HabitId { get; set; }
    [MaxLength(10)]
    public string Status {get; set;} = "pending";
    public int SharedStreak { get; set; } = 0;
    public DateTime CreatedAt { get; set; } =  DateTime.UtcNow;

    public User Requester { get; set; } = null!;
    public User Receiver { get; set; } = null!;
    public Habit Habit { get; set; } = null!;
    public Conversation?  Conversation { get; set; } = null;
}