namespace Backend.Models;

public record RoomCreateRequest(string UserId, string Name);
public record JoinRoomRequest(string RoomId, string UserId, string Name);
public record PlaceShipsRequest(string RoomId, string UserId, List<Ship> Ships);
public record ShootRequest(string RoomId, string UserId, int X, int Y);
public record EndTurnRequest(string RoomId, string UserId);

public record StartAiGameRequest(string UserId, string Name, AiDifficulty Difficulty);
public record PlayerAiShootRequest(Guid SessionId, int X, int Y);

public record RoomCreatedPayload(string RoomId, string Player, string Phase);
public record RoomJoinedPayload(string RoomId, string Player1, string Player2, string Phase);
public record ShipsPlacedPayload(string RoomId, string UserId, bool Ready, string Phase, string CurrentTurnUserId);
public record TurnEndedPayload(string RoomId, string CurrentTurnUserId);
public record GameOverPayload(string RoomId, string WinnerUserId);
public record OnlineSnapshotPayload(string RoomId, string UserId, string CurrentTurnUserId, string[][] MyBoard, string[][] EnemyBoard, Dictionary<int, int> EnemyFleetRemaining);
public record LeaderboardEntryPayload(string UserId, string Name, int Level, int Experience, int Wins, int Losses, int GamesPlayed);

public class ShotResult
{
    public bool IsValid { get; set; }
    public bool IsHit { get; set; }
    public bool IsSunk { get; set; }
    public bool IsGameOver { get; set; }
    public string WinnerUserId { get; set; } = string.Empty;
    public Dictionary<int, int> TargetRemainingFleet { get; set; } = [];
    public string[][]? ShooterBoardPrivate { get; set; }
    public string[][]? ShooterBoardPublic { get; set; }
    public string[][]? TargetBoardPrivate { get; set; }
    public string[][]? TargetBoardPublic { get; set; }
    public string Message { get; set; } = string.Empty;
    public string NextTurnUserId { get; set; } = string.Empty;
}
