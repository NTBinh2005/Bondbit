namespace HabitSync.API.DTOs.Habit;

public record HabitResponse(
    long Id,
    string Name,
    string? Description,
    string Frequency,
    bool IsActive,
    int CurrentStreak,
    DateOnly? LastCheckIn,
    DateTime CreatedAt
    );