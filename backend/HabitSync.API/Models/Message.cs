using System.ComponentModel.DataAnnotations;

namespace HabitSync.API.Models;

public class Message
{
    public long Id { get; set; } 
    public long ConversationId { get; set; }
    public long SenderId { get; set; }
    [MaxLength(120)]
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.MinValue;
    
    public Conversation Conversation { get; set; } = null!;
    public User Sender { get; set; } = null!;
}