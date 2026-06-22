namespace HabitSync.API.DTOs.Habit;

public record CreateHabitRequest(string Name, string? Description, string Frequency);