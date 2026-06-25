namespace HabitSync.API.DTOs;

public record AuthResponse(
    string AccessToken, 
    string RefreshToken, 
    string DisplayName, 
    string? AvatarUrl,
    long UserId);