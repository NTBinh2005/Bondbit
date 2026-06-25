namespace HabitSync.API.DTOs.Chat;

public record MessageResponse(
    long Id,
    long ConversationId,
    long SenderId,
    string SenderName,
    string Content,
    bool IsRead,
    DateTime SentAt
    );