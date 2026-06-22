namespace HabitSync.API.DTOs.Habit;

public record UpdateHabitRequest(string Name, string? Description, string Frequency);