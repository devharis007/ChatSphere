using System.Collections.Concurrent;
using ChatSphere.Api.Models;

namespace ChatSphere.Api.Services;

/// <summary>
/// Thread-safe, in-memory store mapping SignalR ConnectionId -&gt; (Username, Room).
/// This is intentionally lightweight (no database) since ChatSphere's focus is
/// demonstrating real-time mechanics rather than persistence.
/// </summary>
public sealed class ChatConnectionStore
{
    private readonly ConcurrentDictionary<string, UserConnection> _connections = new();

    /// <summary>Registers a connection for a room. Overwrites any prior mapping for the same connection.</summary>
    public void AddConnection(string connectionId, string username, string room)
    {
        _connections[connectionId] = new UserConnection(connectionId, username, room);
    }

    /// <summary>Removes a connection and returns what it was mapped to, if anything.</summary>
    public UserConnection? RemoveConnection(string connectionId)
    {
        return _connections.TryRemove(connectionId, out var connection) ? connection : null;
    }

    public UserConnection? GetConnection(string connectionId)
    {
        return _connections.TryGetValue(connectionId, out var connection) ? connection : null;
    }

    /// <summary>Distinct usernames currently connected to a room, sorted alphabetically.</summary>
    public IReadOnlyList<string> GetUsersInRoom(string room)
    {
        return _connections.Values
            .Where(c => string.Equals(c.Room, room, StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Username)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(u => u, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>Number of active connections per room, keyed by room name.</summary>
    public IReadOnlyDictionary<string, int> GetOnlineCountsByRoom()
    {
        return _connections.Values
            .GroupBy(c => c.Room, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Select(c => c.Username).Distinct(StringComparer.OrdinalIgnoreCase).Count(), StringComparer.OrdinalIgnoreCase);
    }
}
