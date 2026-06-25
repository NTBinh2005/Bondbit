using HabitSync.API.Extensions;
using HabitSync.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HabitSync.API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    public ChatController(IChatService chatService) => _chatService = chatService;

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = User.GetUserId();
        var result = await _chatService.GetConversationsAsync(userId);
        return Ok(result);
    }

    [HttpGet("conversations/{id}/messages")]
    public async Task<IActionResult> GetMessages(long id, [FromQuery] int page = 0)
    {
        var userId = User.GetUserId();
        var result = await _chatService.GetMessagesAsync(id, userId, page);
        return Ok(result);
    }
}