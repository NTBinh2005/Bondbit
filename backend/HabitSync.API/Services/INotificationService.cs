namespace HabitSync.API.Services;

public interface INotificationService
{
    Task RegisterTokenAsync(long userId, string token);
    Task SendPartnerCheckInNotificationAsync(long habitId, long checkedInUserId);
    Task SendDailyReminderAsync(); // Hangfire gọi lúc 21:00
}