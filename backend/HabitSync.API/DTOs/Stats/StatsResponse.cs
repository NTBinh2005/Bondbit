namespace HabitSync.API.DTOs.Stats;

public record StatsResponse(
    List<WeeklyBarData> StreakMomentum,
    int TotalStreakDays,
    List<DailyProgress> WeeklyProgress,
    PartnerSynergyResponse? PartnerSynergy
);