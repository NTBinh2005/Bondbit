using HabitSync.API.Data;
using HabitSync.API.DTOs.Chat;
using HabitSync.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _db;
    public ChatService(AppDbContext db) => _db = db;
    
    public async Task<List<ConversationResponse>> GetConversationsAsync(long userId)
    {
        // take conversations which user participant vis partnership
        var conversations = await _db.Conversations
            .Include(c => c.Partnership)
            .Where(c =>
                c.Partnership.RequesterId == userId ||
                c.Partnership.ReceiverId ==  userId)
            .ToListAsync();
        
        var result = new List<ConversationResponse>();
        foreach (var conv in conversations)
        {
            var partnerId = conv.Partnership.RequesterId == userId
                ? conv.Partnership.ReceiverId 
                : conv.Partnership.RequesterId;
            var partner = await _db.Users.FindAsync(partnerId);
            var habit = await _db.Habits.FindAsync(conv.Partnership.HabitId);
            
            var lastMessage = await _db.Messages
                .Where(m => m.ConversationId == conv.Id)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageResponse(
                    m.Id, m.ConversationId, m.SenderId, "", m.Content, m.IsRead, m.SentAt))
                .FirstOrDefaultAsync();

            var unreadCount = await _db.Messages
                .CountAsync(m => m.ConversationId == conv.Id
                                 && m.SenderId != userId 
                                 && !m.IsRead);
            
            result.Add(new ConversationResponse(
                conv.Id, conv.PartnershipId, partner!.DisplayName,
                habit!.Name, lastMessage, unreadCount));
        }
        return result;
    }

    public async Task<List<MessageResponse>> GetMessagesAsync(long conversationId, long userId, int page)
    {
        var conv = await _db.Conversations
            .Include(c => c.Partnership)
            .FirstOrDefaultAsync(c => c.Id ==  conversationId &&
                                      (c.Partnership.RequesterId == userId ||
                                       c.Partnership.ReceiverId == userId))
            ?? throw new Exception("Conversation not found");
        const int pageSize = 20;
        
        var messages = await _db.Messages
            .Where(m => m.ConversationId == conv.Id)
            .OrderByDescending(m => m.SentAt)
            .Skip(page * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        var result = new List<MessageResponse>();
        foreach (var m in messages)
        {
            var sender =  await _db.Users.FindAsync(m.SenderId);
            result.Add(new MessageResponse(
                m.Id, m.ConversationId, m.SenderId, sender!.DisplayName, m.Content, m.IsRead, m.SentAt));
        }
        return result;
    }

    public async Task<MessageResponse> SaveMessageAsync(long conversationId, long senderId, string content)
    {
        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = content,
            SentAt = DateTime.Now
        };
        _db.Messages.Add(message);
        await _db.SaveChangesAsync();
        var sender = await _db.Users.FindAsync(message.SenderId);
        return new MessageResponse(message.Id, message.ConversationId, message.SenderId,
            sender!.DisplayName, message.Content, message.IsRead, message.SentAt);
    }

    public async Task MarkAsReadAsync(long conversationId, long userId)
    {
        var unread = await _db.Messages
            .Where(m => m.ConversationId == conversationId 
                        && m.SenderId != userId 
                        && !m.IsRead)
            .ToListAsync();
        foreach (var m in unread)
            m.IsRead = true;
            
        await _db.SaveChangesAsync();
    }
}