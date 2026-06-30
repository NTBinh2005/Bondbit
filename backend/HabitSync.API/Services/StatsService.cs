using HabitSync.API.Data;
using HabitSync.API.DTOs.Stats;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Services;

public class StatsService : IStatsService
{
    private readonly AppDbContext _db;
    public StatsService(AppDbContext db) => _db = db;

    public async Task<StatsResponse> GetStatsAsync(long userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thirtyDaysAgo = today.AddDays(-29);

        // Lấy toàn bộ log completed trong 30 ngày
        var logs = await _db.HabitLogs
            .Where(l => l.UserId == userId && l.IsCompleted && l.Date >= thirtyDaysAgo)
            .ToListAsync();

        // --- Streak Momentum: nhóm theo tuần (Week 1-4) ---
        var weeklyBars = new List<WeeklyBarData>();
        for (int week = 0; week < 4; week++)
        {
            var weekStart = thirtyDaysAgo.AddDays(week * 7);
            var weekEnd = weekStart.AddDays(6);
            var count = logs.Count(l => l.Date >= weekStart && l.Date <= weekEnd);
            weeklyBars.Add(new WeeklyBarData($"Week {week + 1}", count));
        }

        // --- Total streak days = streak cao nhất hiện tại trong các habit ---
        var habits = await _db.Habits.Where(h => h.UserId == userId && h.IsActive).ToListAsync();
        int totalStreak = 0;
        foreach (var h in habits)
        {
            var streak = await CalculateStreakAsync(h.Id, userId);
            totalStreak = Math.Max(totalStreak, streak);
        }

        // --- Weekly Progress: % hoàn thành mỗi ngày trong tuần này ---
        var weeklyProgress = new List<DailyProgress>();
        var dayNames = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
        var totalHabitsCount = habits.Count;

        // Tìm Monday của tuần hiện tại
        var dayOfWeek = (int)today.DayOfWeek;
        var daysFromMonday = dayOfWeek == 0 ? 6 : dayOfWeek - 1;
        var monday = today.AddDays(-daysFromMonday);

        for (int i = 0; i < 5; i++) // Mon-Fri theo UI
        {
            var date = monday.AddDays(i);
            if (date > today)
            {
                weeklyProgress.Add(new DailyProgress(dayNames[i], 0, false));
                continue;
            }

            var doneCount = logs.Count(l => l.Date == date);
            var percent = totalHabitsCount > 0
                ? (int)Math.Round((double)doneCount / totalHabitsCount * 100)
                : 0;

            weeklyProgress.Add(new DailyProgress(dayNames[i], percent, percent >= 100));
        }

        // --- Partner Synergy: lấy partnership đầu tiên đang accepted ---
        var partnership = await _db.Partnerships
            .FirstOrDefaultAsync(p => p.Status == "accepted" &&
                (p.RequesterId == userId || p.ReceiverId == userId));

        PartnerSynergyResponse? synergy = null;
        if (partnership != null)
        {
            var partnerId = partnership.RequesterId == userId
                ? partnership.ReceiverId : partnership.RequesterId;
            var partner = await _db.Users.FindAsync(partnerId);

            // Tính compatibility giả lập: dựa trên sharedStreak, cap 100
            var compatibility = Math.Min(100, 60 + partnership.SharedStreak * 2);

            synergy = new PartnerSynergyResponse(
                partner!.DisplayName,
                compatibility,
                partner.DisplayName.Substring(0, 1).ToUpper()
            );
        }

        return new StatsResponse(weeklyBars, totalStreak, weeklyProgress, synergy);
    }

    private async Task<int> CalculateStreakAsync(long habitId, long userId)
    {
        var dates = await _db.HabitLogs
            .Where(l => l.HabitId == habitId && l.UserId == userId && l.IsCompleted)
            .OrderByDescending(l => l.Date)
            .Select(l => l.Date)
            .ToListAsync();

        if (dates.Count == 0) return 0;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);
        if (dates[0] < yesterday) return 0;

        int streak = 1;
        for (int i = 1; i < dates.Count; i++)
        {
            if (dates[i - 1].DayNumber - dates[i].DayNumber == 1) streak++;
            else break;
        }
        return streak;
    }
}