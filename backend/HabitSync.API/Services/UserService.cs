using HabitSync.API.Data;
using HabitSync.API.DTOs.User;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;
    public UserService(AppDbContext db) => _db = db;
    
    public async Task<List<UserSearchResponse>> SearchAsync(string keyword, long currentUserId)
    {
        var pattern = $"%{keyword}%";

        return await _db.Users
            .Where(u => u.Id != currentUserId &&
                        (EF.Functions.ILike(u.DisplayName, pattern) ||
                         EF.Functions.ILike(u.Email, pattern)))
            .Take(10)
            .Select(u => new UserSearchResponse(u.Id, u.DisplayName, u.Email, u.AvatarUrl))
            .ToListAsync();
    }
}