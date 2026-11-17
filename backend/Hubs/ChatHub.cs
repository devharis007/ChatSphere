using ChatSphere.Api.Models;
using ChatSphere.Api.Services;
using Microsoft.AspNetCore.SignalR;

namespace ChatSphere.Api.Hubs;

/// <summary>
/// Real-time chat hub. Tracks room membership per connection, broadcasts messages and
/// typing indicators to everyone in a room, and keeps each room's connected-user list
/// in sync as clients join, leave, or disconnect.
/// </summary>
public sealed class ChatHub : Hub
{
    private const int MaxUsernameLength = 30;
    private const int MaxMessageLength = 1000;

    private readonly ChatConnectionStore _connectionStore;
    private readonly RoomCatalog _roomCatalog;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ChatConnectionStore connectionStore, RoomCatalog roomCatalog, ILogger<ChatHub> logger)
    {
        _connectionStore = connectionStore;
        _roomCatalog = roomCatalog;
        _logger = logger;
    }

    /// <summary>Joins the caller to a named room, registers them, and notifies the room.</summary>
    public async Task JoinRoom(string username, string room)
    {
        username = (username ?? string.Empty).Trim();
        room = (room ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(room))
        {
            await Clients.Caller.SendAsync("Error", "Username and room are required to join.");
            return;
        }

        if (username.Length > MaxUsernameLength)
        {
            username = username[..MaxUsernameLength];
        }

        // If this connection was already in a different room (e.g. switching rooms), leave it first.
        var existing = _connectionStore.GetConnection(Context.ConnectionId);
        if (existing is not null && !string.Equals(existing.Room, room, StringComparison.OrdinalIgnoreCase))
        {
            await LeaveRoomInternal(existing);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, room);
        _connectionStore.AddConnection(Context.ConnectionId, username, room);

        var joinMessage = new ChatMessageDto(
            Guid.NewGuid().ToString("N"),
            room,
            "system",
            $"{username} joined the room",
            DateTime.UtcNow,
            IsSystem: true);

        await Clients.Group(room).SendAsync("ReceiveMessage", joinMessage);
        await Clients.Group(room).SendAsync("UpdateUserList", _connectionStore.GetUsersInRoom(room));
        await Clients.Caller.SendAsync("JoinedRoom", room, username);

        _logger.LogInformation("{Username} joined room {Room} ({ConnectionId})", username, room, Context.ConnectionId);
    }

    /// <summary>Broadcasts a chat message to everyone in the caller's current room.</summary>
    public async Task SendMessage(string text)
    {
        var connection = _connectionStore.GetConnection(Context.ConnectionId);
        if (connection is null)
        {
            await Clients.Caller.SendAsync("Error", "You must join a room before sending messages.");
            return;
        }

        text = (text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return; // Ignore empty/whitespace-only messages.
        }

        if (text.Length > MaxMessageLength)
        {
            text = text[..MaxMessageLength];
        }

        var message = new ChatMessageDto(
            Guid.NewGuid().ToString("N"),
            connection.Room,
            connection.Username,
            text,
            DateTime.UtcNow,
            IsSystem: false);

        await Clients.Group(connection.Room).SendAsync("ReceiveMessage", message);
    }

    /// <summary>Notifies the room that the caller is (or has stopped) typing.</summary>
    public async Task Typing(bool isTyping)
    {
        var connection = _connectionStore.GetConnection(Context.ConnectionId);
        if (connection is null)
        {
            return;
        }

        await Clients.OthersInGroup(connection.Room).SendAsync("UserTyping", connection.Username, isTyping);
    }

    /// <summary>Explicitly leaves the current room (e.g. user clicks "leave" in the UI).</summary>
    public async Task LeaveRoom()
    {
        var connection = _connectionStore.GetConnection(Context.ConnectionId);
        if (connection is null)
        {
            return;
        }

        await LeaveRoomInternal(connection);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connection = _connectionStore.RemoveConnection(Context.ConnectionId);
        if (connection is not null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, connection.Room);

            var leaveMessage = new ChatMessageDto(
                Guid.NewGuid().ToString("N"),
                connection.Room,
                "system",
                $"{connection.Username} left the room",
                DateTime.UtcNow,
                IsSystem: true);

            await Clients.Group(connection.Room).SendAsync("ReceiveMessage", leaveMessage);
            await Clients.Group(connection.Room).SendAsync("UpdateUserList", _connectionStore.GetUsersInRoom(connection.Room));
            await Clients.Group(connection.Room).SendAsync("UserTyping", connection.Username, false);

            _logger.LogInformation("{Username} disconnected from room {Room} ({ConnectionId})", connection.Username, connection.Room, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task LeaveRoomInternal(UserConnection connection)
    {
        _connectionStore.RemoveConnection(connection.ConnectionId);
        await Groups.RemoveFromGroupAsync(connection.ConnectionId, connection.Room);

        var leaveMessage = new ChatMessageDto(
            Guid.NewGuid().ToString("N"),
            connection.Room,
            "system",
            $"{connection.Username} left the room",
            DateTime.UtcNow,
            IsSystem: true);

        await Clients.Group(connection.Room).SendAsync("ReceiveMessage", leaveMessage);
        await Clients.Group(connection.Room).SendAsync("UpdateUserList", _connectionStore.GetUsersInRoom(connection.Room));
    }
}
