using HabitSync.API.DTOs.Partnership;

namespace HabitSync.API.Services;

public interface IPartnershipService
{
    Task<PartnershipResponse> InviteAsync(InviteRequest request, long requesterId);
    Task<PartnershipResponse> AcceptAsync(long partnershipId, long userId);
    Task<PartnershipResponse> RejectAsync(long partnershipId, long userId);
    Task<List<PartnershipResponse>> GetMineAsync(long userId);
    Task EvaluateSharedStreaksAsync(); // Hangfire sẽ gọi cái này lúc 23:59
}