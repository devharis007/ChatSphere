using ChatSphere.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChatSphere.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RoomsController : ControllerBase
{
    private readonly RoomCatalog _roomCatalog;

    public RoomsController(RoomCatalog roomCatalog)
    {
        _roomCatalog = roomCatalog;
    }

    /// <summary>Lists the available chat rooms along with their live online-user counts.</summary>
    [HttpGet]
    public IActionResult GetRooms()
    {
        return Ok(_roomCatalog.GetRooms());
    }
}
