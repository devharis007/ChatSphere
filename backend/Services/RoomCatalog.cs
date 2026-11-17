using ChatSphere.Api.Models;

namespace ChatSphere.Api.Services;

/// <summary>
/// Provides the set of available chat rooms. A small fixed catalog is used to keep the
/// portfolio project focused on real-time mechanics rather than room administration,
/// while still allowing the online count per room to be computed live.
/// </summary>
public sealed class RoomCatalog
{
    private static readonly IReadOnlyList<(string Name, string Description)> Rooms = new List<(string, string)>
    {
        ("General", "Casual conversation for anyone dropping by"),
        ("Tech Talk", "Discuss code, tools, and everything engineering"),
        ("Random", "Anything goes"),
        ("Help Desk", "Ask a question, get a hand from the room"),
    };

    private readonly ChatConnectionStore _connectionStore;

    public RoomCatalog(ChatConnectionStore connectionStore)
    {
        _connectionStore = connectionStore;
    }

    public IReadOnlyList<RoomDto> GetRooms()
    {
        var onlineCounts = _connectionStore.GetOnlineCountsByRoom();
        return Rooms
            .Select(r => new RoomDto(r.Name, r.Description, onlineCounts.TryGetValue(r.Name, out var count) ? count : 0))
            .ToList();
    }

    public bool RoomExists(string room)
    {
        return Rooms.Any(r => string.Equals(r.Name, room, StringComparison.OrdinalIgnoreCase));
    }
}
