using HabitSync.API.Services;
using Microsoft.AspNetCore.Mvc;
using LoginRequest = HabitSync.API.DTOs.LoginRequest;
using RegisterRequest = HabitSync.API.DTOs.RegisterRequest;

namespace HabitSync.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) => _authService = authService;
    
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        return new OkObjectResult(response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return new OkObjectResult(response);
    }
    
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string  refreshToken)
    {
        var response = await _authService.RefreshAsync(refreshToken);
        return new OkObjectResult(response);
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] string refreshToken)
    {
        await _authService.RevokeAsync(refreshToken);
        return new OkResult();
    }
}