using HabitSync.API.DTOs.Stats;

namespace HabitSync.API.Services;

public interface IStatsService
{
    Task<StatsResponse> GetStatsAsync(long userId);
}