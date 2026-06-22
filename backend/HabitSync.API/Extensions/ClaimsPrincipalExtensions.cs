using System.Security.Claims;

namespace HabitSync.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static long GetUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)
                    ?? throw new Exception("UserId claim not found");
        return long.Parse(claim.Value);
    }
}