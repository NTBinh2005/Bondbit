namespace HabitSync.API.DTOs.Chat;

public record ConversationResponse(
    long Id,
    long PartnershipId,
    string PartnerName,
    string HabitName,
    MessageResponse? LastMessage,
    int UnreadCount
    );