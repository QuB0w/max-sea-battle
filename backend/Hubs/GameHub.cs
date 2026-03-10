using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs;

public class GameHub(GameService gameService) : Hub
{
    public List<OpenRoomPayload> GetOpenRooms(string? userId = null)
    {
        return gameService.GetOpenRooms(userId);
    }

    public async Task CreateRoom(RoomCreateRequest request)
    {
        var payload = gameService.CreateRoom(Context.ConnectionId, request);

        await Groups.AddToGroupAsync(Context.ConnectionId, payload.RoomId);
        await Clients.Caller.SendAsync("RoomCreated", payload);
        await Clients.All.SendAsync("OpenRoomsUpdated", gameService.GetOpenRooms());
    }

    public async Task JoinRoom(JoinRoomRequest request)
    {
        var payload = gameService.JoinRoom(Context.ConnectionId, request);
        await Groups.AddToGroupAsync(Context.ConnectionId, request.RoomId);
        await Clients.Group(request.RoomId).SendAsync("RoomJoined", payload);
        await Clients.All.SendAsync("OpenRoomsUpdated", gameService.GetOpenRooms());
    }

    public async Task JoinRandomRoom(JoinRandomRoomRequest request)
    {
        var payload = gameService.JoinRandomRoom(Context.ConnectionId, request);
        await Groups.AddToGroupAsync(Context.ConnectionId, payload.RoomId);
        await Clients.Group(payload.RoomId).SendAsync("RoomJoined", payload);
        await Clients.All.SendAsync("OpenRoomsUpdated", gameService.GetOpenRooms());
    }

    public async Task PlaceShips(PlaceShipsRequest request)
    {
        var payload = gameService.PlaceShips(request);
        await Clients.Group(request.RoomId).SendAsync("ShipsPlaced", payload);
    }

    public async Task Shoot(ShootRequest request)
    {
        var result = gameService.Shoot(request);
        await Clients.Group(request.RoomId).SendAsync("ShotProcessed", new
        {
            roomId = request.RoomId,
            userId = request.UserId,
            x = request.X,
            y = request.Y,
            result
        });
    }

    public async Task EndTurn(EndTurnRequest request)
    {
        var payload = gameService.EndTurn(request);
        await Clients.Group(request.RoomId).SendAsync("TurnEnded", payload);
    }

    public async Task GameOver(string roomId, string winnerUserId)
    {
        var payload = gameService.ManualGameOver(roomId, winnerUserId);
        await Clients.Group(roomId).SendAsync("GameFinished", payload);
    }

    public async Task Surrender(string roomId, string userId)
    {
        var payload = gameService.PlayerForfeit(roomId, userId);
        await Clients.Group(roomId).SendAsync("GameFinished", payload);
        await Clients.All.SendAsync("OpenRoomsUpdated", gameService.GetOpenRooms());
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var payload = gameService.HandleDisconnect(Context.ConnectionId);
        if (payload is not null)
        {
            await Clients.Group(payload.RoomId).SendAsync("GameFinished", payload);
        }

        await Clients.All.SendAsync("OpenRoomsUpdated", gameService.GetOpenRooms());

        await base.OnDisconnectedAsync(exception);
    }
}
