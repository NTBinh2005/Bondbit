using HabitSync.API.DTOs.Partnership;
using HabitSync.API.Extensions;
using HabitSync.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HabitSync.API.Controllers;

[ApiController]
[Route("api/partnerships")]
[Authorize]
public class PartnershipController : ControllerBase
{
    private readonly IPartnershipService _partnershipService;
    public PartnershipController(IPartnershipService partnershipService)
        => _partnershipService = partnershipService;

    [HttpPost("invite")]
    public async Task<IActionResult> Invite(InviteRequest inviteRequest)
    {
        var userId = User.GetUserId();
        var result = await _partnershipService.InviteAsync(inviteRequest, userId);
        return Ok(result);
    }

    [HttpPut("{id}/accept")]
    public async Task<IActionResult> Accept(long id)
    {
        var result = await _partnershipService.AcceptAsync(id, User.GetUserId());
        return Ok(result);
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(long id)
    {
        var result = await _partnershipService.RejectAsync(id, User.GetUserId());
        return Ok(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var result = await _partnershipService.GetMineAsync(User.GetUserId());
        return Ok(result);
    }
}