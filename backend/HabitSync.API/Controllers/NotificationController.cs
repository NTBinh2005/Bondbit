using HabitSync.API.DTOs;
using HabitSync.API.Extensions;
using HabitSync.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HabitSync.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    public NotificationController(INotificationService notificationService)
        => _notificationService = notificationService;

    [HttpPost("register-token")]
    public async Task<IActionResult> RegisterToken([FromBody] RegisterTokenRequest request)
    {
        var userId = User.GetUserId();
        await _notificationService.RegisterTokenAsync(userId, request.Token);
        return Ok();
    }
}
