namespace HabitSync.API.Models;

public class Conversation
{
    public long Id { get; set; }
    public long PartnershipId { get; set; }
    public DateTime CreatedAt { get; set; } =  DateTime.Now;
    
    public Partnership Partnership { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}