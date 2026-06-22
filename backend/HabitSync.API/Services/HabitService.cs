using HabitSync.API.Data;
using HabitSync.API.DTOs.Habit;
using HabitSync.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Services;

public class HabitService : IHabitService
{
    private readonly AppDbContext _db;
    public HabitService(AppDbContext db) => _db = db;
    
    public async Task<List<HabitResponse>> GetAllAsync(long userId)
    {
        var habits = await _db.Habits
            .Where(h => h.UserId == userId && h.IsActive)
            .ToListAsync();
        
        var result = new List<HabitResponse>();
        foreach (var habit in habits)
        {
            var(steak,lastCheckIn) = await CalculateSteakAsync(habit.Id, habit.UserId);
            result.Add(ToResponse(habit, steak, lastCheckIn));
        }
        return result;
    }

    public async Task<HabitResponse> GetByIdAsync(long id, long userId)
    {
        var habit = await _db.Habits
            .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId)
            ?? throw new Exception("Habit not found");

        var(streak,lastCheckIn) = await CalculateSteakAsync(habit.Id, habit.UserId);
        return ToResponse(habit, streak, lastCheckIn);
    }

    public async Task<HabitResponse> CreateAsync(CreateHabitRequest request, long userId)
    {
        if (request.Frequency != "daily" && request.Frequency != "weekly")
            throw new Exception("Frequency must be either daily or Weekly");

        var habit = new Habit
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            Frequency = request.Frequency,
        };
        _db.Habits.Add(habit);
        await _db.SaveChangesAsync();
        return ToResponse(habit, 0, null);
    }

    public async Task<HabitResponse> UpdateAsync(long id, UpdateHabitRequest request, long userId)
    {
        var habit = await _db.Habits
            .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId)
            ?? throw new Exception("Habit not found");
        
        habit.Name = request.Name;
        habit.Description = request.Description;
        habit.Frequency = request.Frequency;
        await _db.SaveChangesAsync();

        var(streak, lastCheckIn) = await CalculateSteakAsync(habit.Id, habit.UserId);
        return ToResponse(habit, streak, lastCheckIn);
    }

    public async Task DeleteAsync(long id, long userId)
    {
        var habit = _db.Habits
            .FirstOrDefault(h => h.Id == id && h.UserId == userId)
            ?? throw new Exception("Habit not found");
        
        habit.IsActive = false;
        await _db.SaveChangesAsync();
    }

    public async Task<CheckInResponse> CheckInAsync(long habitId, long userId)
    {
        var habit = await _db.Habits
            .FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId)
            ?? throw new Exception("Habit not found");
        
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        
        // check habit logs have today or not
        var existing = await _db.HabitLogs
            .FirstOrDefaultAsync(l => l.HabitId == habit.Id && l.UserId == userId && l.Date == today);
        
        if (existing != null)
            throw new Exception("Habit already exists");

        var log = new HabitLog
        {
            HabitId = habit.Id,
            UserId = userId,
            Date = today,
            IsCompleted = true
        };
        _db.HabitLogs.Add(log);
        await _db.SaveChangesAsync();
        
        var (newStreak, _)  = await CalculateSteakAsync(habit.Id, habit.UserId);
        return new CheckInResponse(log.Id, today, newStreak);
    }
    
    // steak logic
    private async Task<(int streak, DateOnly? lastCheckIn)> CalculateSteakAsync(long habitId, long userId)
    {
        var completedDates = await _db.HabitLogs
            .Where(l => l.HabitId == habitId && l.UserId == userId && l.IsCompleted)
            .OrderByDescending(l => l.Date)
            .Select(l => l.Date)
            .ToListAsync();
        
        if (completedDates.Count == 0) 
            return (0, null);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);

        if (completedDates[0] < yesterday)
            return (0, completedDates[0]);
        
        int streak = 1;
        for (int i = 1; i < completedDates.Count; i++)
        {
            if (completedDates[i-1].DayNumber - completedDates[i].DayNumber == 1)
                streak++;
            else 
                break;
        }
        
        return (streak, completedDates[0]);
    }
    
    private static HabitResponse ToResponse(Habit habit, int streak, DateOnly? lastCheckIn) =>
        new(habit.Id, habit.Name, habit.Description, habit.Frequency,
            habit.IsActive, streak, lastCheckIn, habit.CreatedAt);
}