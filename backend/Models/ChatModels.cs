namespace ChatSphere.Api.Models;

/// <summary>Represents a live SignalR connection mapped to a username and room.</summary>
public sealed record UserConnection(string ConnectionId, string Username, string Room);

/// <summary>A chat message broadcast to a room.</summary>
public sealed record ChatMessageDto(string Id, string Room, string User, string Text, DateTime Timestamp, bool IsSystem);

/// <summary>A room summary returned by the REST endpoint.</summary>
public sealed record RoomDto(string Name, string Description, int OnlineCount);
