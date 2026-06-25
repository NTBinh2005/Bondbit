using HabitSync.API.DTOs.User;

namespace HabitSync.API.Services;

public interface IUserService
{
    Task<List<UserSearchResponse>> SearchAsync(string keyword, long currentUserId);
}