namespace HabitSync.API.DTOs.Partnership;

public record PartnershipResponse(long Id,
    long RequesterId,
    string RequesterName,
    long ReceiverId,
    string ReceiverName,
    long HabitId,
    string HabitName,
    string Status,
    int SharedStreak,
    DateTime CreatedAt
    );