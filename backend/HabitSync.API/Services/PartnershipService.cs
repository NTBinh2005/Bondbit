using HabitSync.API.Data;
using HabitSync.API.DTOs.Partnership;
using HabitSync.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Services;

public class PartnershipService : IPartnershipService
{
    private readonly AppDbContext _db;
    public PartnershipService(AppDbContext db) => _db = db;
    
    public async Task<PartnershipResponse> InviteAsync(InviteRequest request, long requesterId)
    {
        if (request.ReceiverId ==  requesterId)
            throw new Exception("You cannot invite yourself");
        
        var habit = await _db.Habits
            .FirstOrDefaultAsync(h => h.Id == request.HabitId && h.UserId == requesterId)
            ??  throw new Exception("Habits not found or not yours");
        
        var receiver = await _db.Users.FindAsync(request.ReceiverId)
            ?? throw new Exception("Receiver not found");
        
        var existing = await _db.Partnerships.AnyAsync(p =>
            p.RequesterId == requesterId &&
            p.ReceiverId == request.ReceiverId &&
            p.HabitId == request.HabitId);
        
        if (existing)
            throw new Exception("Invitation already sent");

        var partnership = new Partnership
        {
            RequesterId = requesterId,
            ReceiverId = request.ReceiverId,
            HabitId = request.HabitId,
            Status = "pending",
        };
        
        _db.Partnerships.Add(partnership);
        await _db.SaveChangesAsync();
        
        var requester = await _db.Users.FindAsync(requesterId);
        return ToResponse(partnership, requester!, receiver, habit);
    }

    public async Task<PartnershipResponse> AcceptAsync(long partnershipId, long userId)
    {
        var partnership = await _db.Partnerships
            .FirstOrDefaultAsync(p => p.Id == partnershipId && p.ReceiverId == userId)
            ??  throw new Exception("Partnership not found");
        
        if (partnership.Status != "pending")
            throw new Exception("Partnership is no longer pending");
        
        partnership.Status = "accepted";
        
        // Tạo Conversation — trigger trong DB cũng làm điều này,
        // nhưng làm thêm ở đây để chắc chắn và trả về ngay
        var conversation = new Conversation {PartnershipId = partnership.Id, CreatedAt = DateTime.UtcNow};
        _db.Conversations.Add(conversation);
        
        await _db.SaveChangesAsync();
        return await LoadPartnershipAsync(partnership);
    }

    public async Task<PartnershipResponse> RejectAsync(long partnershipId, long userId)
    {
        var partnership = await  _db.Partnerships
            .FirstOrDefaultAsync(p => p.Id == partnershipId && p.ReceiverId == userId)
            ??  throw new Exception("Partnership not found");
        
        partnership.Status = "rejected";
        await _db.SaveChangesAsync();
        return await LoadPartnershipAsync(partnership);
    }

    public async Task<List<PartnershipResponse>> GetMineAsync(long userId)
    {
        var partnerships = await _db.Partnerships
            .Where(p => p.RequesterId == userId || p.ReceiverId == userId)
            .ToListAsync();
        
        var result = new List<PartnershipResponse>();
        foreach (var partnership in partnerships)
            result.Add(await LoadPartnershipAsync(partnership));
        return result;
    }

    // Hangfire Job — chạy lúc 23:59 mỗi ngày
    public async Task EvaluateSharedStreaksAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var partnerships = await _db.Partnerships
            .Where(p => p.Status == "accepted")
            .ToListAsync();

        foreach (var partnership in partnerships)
        {
            var requesterCkeckIn = await _db.HabitLogs.AnyAsync(l =>
                l.HabitId == partnership.HabitId &&
                l.UserId == partnership.RequesterId &&
                l.Date == today &&
                l.IsCompleted);

            var receiverCheckIn = await _db.HabitLogs.AnyAsync(l => 
            l.HabitId == partnership.HabitId &&
            l.UserId == partnership.ReceiverId &&
            l.Date == today &&
            l.IsCompleted);

            if (requesterCkeckIn && requesterCkeckIn)
                partnership.SharedStreak += 1;
            else
                partnership.SharedStreak = 0;
        }

        await _db.SaveChangesAsync();
    }
    
    // helper
    private async Task<PartnershipResponse> LoadPartnershipAsync(Partnership partnership)
    {
        var requester = await _db.Users.FindAsync(partnership.RequesterId);
        var receiver = await _db.Users.FindAsync(partnership.ReceiverId);
        var habit = await _db.Habits.FindAsync(partnership.HabitId);
        return ToResponse(partnership, requester!, receiver!, habit!);
    }

    private static PartnershipResponse ToResponse( 
        Partnership partnership, User requester, User receiver, Habit habit) =>
        new(partnership.Id, partnership.RequesterId, requester.DisplayName,
            partnership.ReceiverId, receiver.DisplayName,
            partnership.HabitId, habit.Name,
            partnership.Status, partnership.SharedStreak, partnership.CreatedAt
        );
}