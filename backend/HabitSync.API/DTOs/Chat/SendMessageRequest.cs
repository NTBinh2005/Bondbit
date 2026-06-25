namespace HabitSync.API.DTOs.Chat;

public record SendMessageRequest(long ConversationId, string Content);