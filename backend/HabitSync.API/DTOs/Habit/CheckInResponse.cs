namespace HabitSync.API.DTOs.Habit;

public record CheckInResponse(long LogId, DateOnly Date, int NewStreak);