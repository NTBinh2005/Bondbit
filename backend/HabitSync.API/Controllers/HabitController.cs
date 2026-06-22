using HabitSync.API.DTOs.Habit;
using HabitSync.API.Extensions;
using HabitSync.API.Models;
using HabitSync.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HabitSync.API.Controllers;

[ApiController]
[Route("api/habits")]
[Authorize]
public class HabitController : ControllerBase
{
    private readonly IHabitService _habitService;
    public HabitController(IHabitService habitService) => _habitService = habitService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.GetUserId();
        var habits = await _habitService.GetAllAsync(userId);
        return Ok(habits);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var userId = User.GetUserId();
        var habit = await _habitService.GetByIdAsync(id, userId);
        return Ok(habit);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHabitRequest  habit)
    {
        var userId = User.GetUserId();
        var result = await _habitService.CreateAsync(habit, userId);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateHabitRequest habit)
    {
        var userId = User.GetUserId();
        var result = await _habitService.UpdateAsync(id, habit, userId);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var userId = User.GetUserId();
        await _habitService.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpPost("{id}/check-in")]
    public async Task<IActionResult> CheckIn(long id)
    {
        var result = await _habitService.CheckInAsync(id, User.GetUserId());
        return Ok(result);
    }
}