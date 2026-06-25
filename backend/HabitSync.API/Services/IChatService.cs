using HabitSync.API.DTOs.Chat;

namespace HabitSync.API.Services;

public interface IChatService
{
    Task<List<ConversationResponse>> GetConversationsAsync(long userId);
    Task<List<MessageResponse>> GetMessagesAsync(long conversationId, long userId, int page);
    Task<MessageResponse> SaveMessageAsync(long conversationId, long senderId, string content);
    Task MarkAsReadAsync(long conversationId, long userId);
}