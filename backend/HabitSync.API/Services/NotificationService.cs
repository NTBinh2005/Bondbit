using System.Text;
using System.Text.Json;
using HabitSync.API.Data;
using HabitSync.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly HttpClient _httpClient;

    public NotificationService(AppDbContext db, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClient = httpClientFactory.CreateClient("expo");
    }

    public async Task RegisterTokenAsync(long userId, string token)
    {
        var existing = await _db.UserPushTokens
            .FirstOrDefaultAsync(u => u.UserId == userId);
        if (existing != null)
        {
            existing.Token = token;
            existing.UpdatedAt =  DateTime.UtcNow;
        }
        else
        {
            _db.UserPushTokens.Add(new UserPushToken
            {
                UserId = userId,
                Token = token,
            });
        }
        await _db.SaveChangesAsync();
    }

    public async Task SendPartnerCheckInNotificationAsync(long habitId, long checkedInUserId)
    {
        // find partner who have connect in that habit
        var partnership = await _db.Partnerships
            .Include(p => p.Habit)
            .FirstOrDefaultAsync(p => 
                p.Id == habitId &&
                p.Status == "accepted" &&
                (p.RequesterId == checkedInUserId || p.ReceiverId == checkedInUserId));
        if (partnership == null) return;
        
        var partnerId = partnership.RequesterId == checkedInUserId
            ? partnership.ReceiverId
            : partnership.RequesterId;

        var checkinUser = await _db.Users.FindAsync(checkedInUserId);
        var partnerToken = await _db.UserPushTokens
            .FirstOrDefaultAsync(p => p.UserId == partnerId);
        if (partnerToken == null)
            return;

        await SendExpoPushAsync(partnerToken.Token, "Partner vừa check-in!", 
            $"{checkinUser!.DisplayName} vừa hoàn thành '{{partnership.Habit.Name}}'. Đến lượt bạn!",
            new { type = "partner_checkin", habitId }
            );
    }

    public async Task SendDailyReminderAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        // find all user who not checkin today
        var usersWithHabit = await _db.Habits
            .Where(h => h.IsActive)
            .Select(h => h.UserId)
            .Distinct()
            .ToListAsync();

        foreach (var userId in usersWithHabit)
        {
            var hasCheckInToday = await _db.HabitLogs
                .AnyAsync(l =>
                    l.UserId == userId &&
                    l.Date == today &&
                    l.IsCompleted);
            if (hasCheckInToday) continue;
            
            var token = await _db.UserPushTokens
                .FirstOrDefaultAsync(p => p.UserId == userId);
            if (token == null) continue;

            await SendExpoPushAsync(token.Token,
                "⏰ Nhắc nhở habit hôm nay!",
                "Bạn chưa check-in habit nào hôm nay. Còn vài giờ nữa là hết ngày!",
                new { type = "daily_reminder" });
        }
    }
    
    // helper
    // Gửi notification qua Expo Push APIv
    private async Task SendExpoPushAsync(
        string expoPushToken, string title, string  body, object data)
    {
        var payload = new
        {
            to = expoPushToken,
            title,
            body,
            data,
            sound = "default",
            priority = "high"
        };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(
            "https://exp.host/--/api/v2/push/send", content);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            Console.WriteLine(error);
        }
    }
}