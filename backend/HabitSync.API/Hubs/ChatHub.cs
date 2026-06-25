using System.Collections.Concurrent;
using System.Security.Claims;
using HabitSync.API.Data;
using HabitSync.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HabitSync.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    
    // Lưu mapping userId → connectionId để biết ai đang online
    // ConcurrentDictionary để thread-safe vì nhiều connection có thể đến cùng lúc
    private static readonly ConcurrentDictionary<long, string> OnlineUsers = new();

    public ChatHub(IChatService chatService) => _chatService = chatService;
    
    // when client connect to hub
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        OnlineUsers[userId] = Context.ConnectionId;
        
        // notification when user online
        await Clients.Others.SendAsync("UserOnline", userId);
        // take list online user 
        await Clients.Caller.SendAsync("OnlineUsers", OnlineUsers.Keys);
        
        await base.OnConnectedAsync();
    }
    
    //client disconnect
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        OnlineUsers.TryRemove(userId, out _);
        
        await Clients.Others.SendAsync("UserOffline", userId);
        await base.OnDisconnectedAsync(exception);
    }
    
    // client call this method to send message
    public async Task SendMessageAsync(long conversationId, string content)
    {
        var senderId = GetUserId();
        
        var message = await _chatService.SaveMessageAsync(conversationId, senderId, content);
        var partnerId = await GetPartnerIdAsync(conversationId, senderId);
        
        await Clients.Caller.SendAsync("ReceiveMessage", message);
        
        if (partnerId.HasValue && OnlineUsers.TryGetValue(partnerId.Value, out var partnerConnectionId))
            await Clients.Client(partnerConnectionId).SendAsync("ReceiveMessage", message);
    }
    
    // client call this method when open conversation
    public async Task MarkAsRead(long conversationId)
    {
        var userId = GetUserId();
        await _chatService.MarkAsReadAsync(conversationId, userId);
        
        var partnerId = await GetPartnerIdAsync(conversationId, userId);
        if (partnerId.HasValue && OnlineUsers.TryGetValue(partnerId.Value, out var partnerConnectionId))
            await Clients.Client(partnerConnectionId).SendAsync("MarkAsRead", conversationId);
    }
    // helper
    private long GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?? throw new Exception("UnAuthorized");
        return long.Parse(claim.Value);
    }

    private async Task<long?> GetPartnerIdAsync(long conversationId, long userId)
    {
        // Import AppDbContext qua constructor nếu cần
        // Tạm thời resolve từ DI
        var db = Context.GetHttpContext()!
            .RequestServices.GetRequiredService<AppDbContext>();

        var conv = await db.Conversations
            .Include(c => c.Partnership)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conv == null) return null;
        return conv.Partnership.RequesterId == userId
            ? conv.Partnership.ReceiverId
            : conv.Partnership.RequesterId;
    }
}