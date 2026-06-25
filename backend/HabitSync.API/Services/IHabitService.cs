using HabitSync.API.DTOs.Habit;

namespace HabitSync.API.Services;

public interface IHabitService
{
    Task<List<HabitResponse>> GetAllAsync(long userId);
    Task<HabitResponse> GetByIdAsync(long id, long userId);
    Task<HabitResponse> CreateAsync(CreateHabitRequest request, long userId);
    Task<HabitResponse> UpdateAsync(long id, UpdateHabitRequest request, long userId);
    Task DeleteAsync(long id, long userId);
    Task<CheckInResponse> CheckInAsync(long habitId, long userId);
    Task<List<LogResponse>> GetLogsAsync(long habitId, long userId, int days);

}