using HabitSync.API.DTOs;
using LoginRequest = HabitSync.API.DTOs.LoginRequest;
using RegisterRequest = HabitSync.API.DTOs.RegisterRequest;

namespace HabitSync.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshAsync(string refreshToken);
    Task RevokeAsync(string refreshToken);
}