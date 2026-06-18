namespace HabitSync.API.DTOs;

public record RegisterRequest(string Email, string Password, string DisplayName);