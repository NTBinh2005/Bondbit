namespace HabitSync.API.DTOs.User;

public record UserSearchResponse(long Id, string DisplayName, string Email, string? AvatarUrl);