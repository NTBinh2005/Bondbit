using HabitSync.API.Extensions;
using HabitSync.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HabitSync.API.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly IStatsService _statsService;
    public StatsController(IStatsService statsService) => _statsService = statsService;

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        var userId = User.GetUserId();
        var result = await _statsService.GetStatsAsync(userId);
        return Ok(result);
    }
}