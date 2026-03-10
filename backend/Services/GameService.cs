using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace Backend.Services;

public class GameService(IServiceScopeFactory scopeFactory)
{
    private static readonly int[] RequiredFleet = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    private const int WinXpGain = 25;
    private const int LossXpPenalty = 10;

    private readonly ConcurrentDictionary<string, OnlineRoom> _rooms = new();
    private readonly ConcurrentDictionary<Guid, SinglePlayerSession> _aiSessions = new();

    public RoomCreatedPayload CreateRoom(string connectionId, RoomCreateRequest request)
    {
        var roomId = GenerateRoomCode();
        var room = new OnlineRoom
        {
            RoomId = roomId,
            CreatedAtUtc = DateTime.UtcNow,
            CurrentTurnUserId = request.UserId,
            Phase = GamePhase.ShipPlacement,
            Player1 = new RuntimePlayer
            {
                ConnectionId = connectionId,
                UserId = request.UserId,
                Name = request.Name,
                Board = new RuntimeBoard()
            }
        };

        _rooms[roomId] = room;

        return new RoomCreatedPayload(roomId, request.Name, room.Phase.ToString());
    }

    public RoomJoinedPayload JoinRoom(string connectionId, JoinRoomRequest request)
    {
        if (!_rooms.TryGetValue(request.RoomId, out var room))
        {
            throw new InvalidOperationException("Room not found");
        }

        if (room.Player2 is not null)
        {
            throw new InvalidOperationException("Room is full");
        }

        room.Player2 = new RuntimePlayer
        {
            ConnectionId = connectionId,
            UserId = request.UserId,
            Name = request.Name,
            Board = new RuntimeBoard()
        };

        return new RoomJoinedPayload(room.RoomId, room.Player1.Name, room.Player2.Name, room.Phase.ToString());
    }

    public RoomJoinedPayload JoinRandomRoom(string connectionId, JoinRandomRoomRequest request)
    {
        var room = _rooms.Values
            .Where(r => r.Phase == GamePhase.ShipPlacement && r.Player2 is null && r.Player1.UserId != request.UserId)
            .OrderBy(r => r.CreatedAtUtc)
            .FirstOrDefault();

        if (room is null)
        {
            throw new InvalidOperationException("No open rooms available");
        }

        room.Player2 = new RuntimePlayer
        {
            ConnectionId = connectionId,
            UserId = request.UserId,
            Name = request.Name,
            Board = new RuntimeBoard()
        };

        return new RoomJoinedPayload(room.RoomId, room.Player1.Name, room.Player2.Name, room.Phase.ToString());
    }

    public List<OpenRoomPayload> GetOpenRooms(string? forUserId = null, int limit = 50)
    {
        var safeLimit = Math.Clamp(limit, 1, 100);

        return _rooms.Values
            .Where(r => r.Phase == GamePhase.ShipPlacement && r.Player2 is null)
            .Where(r => string.IsNullOrWhiteSpace(forUserId) || r.Player1.UserId != forUserId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(safeLimit)
            .Select(r => new OpenRoomPayload(
                r.RoomId,
                r.Player1.UserId,
                r.Player1.Name,
                r.Phase.ToString(),
                r.CreatedAtUtc
            ))
            .ToList();
    }

    public ShipsPlacedPayload PlaceShips(PlaceShipsRequest request)
    {
        if (!_rooms.TryGetValue(request.RoomId, out var room))
        {
            throw new InvalidOperationException("Room not found");
        }

        var player = room.GetPlayer(request.UserId);
        if (player is null)
        {
            throw new InvalidOperationException("Player not found in this room");
        }

        ValidateFleet(request.Ships);

        player.Board = BuildBoardFromShips(request.Ships);
        player.IsReady = true;

        if (room.Player1.IsReady && room.Player2?.IsReady == true)
        {
            room.Phase = GamePhase.Battle;
            room.StartedAtUtc = DateTime.UtcNow;
        }

        return new ShipsPlacedPayload(room.RoomId, player.UserId, player.IsReady, room.Phase.ToString(), room.CurrentTurnUserId);
    }

    public ShotResult Shoot(ShootRequest request)
    {
        if (!_rooms.TryGetValue(request.RoomId, out var room))
        {
            return new ShotResult { IsValid = false, Message = "Room not found" };
        }

        if (room.Phase != GamePhase.Battle)
        {
            return new ShotResult { IsValid = false, Message = "Battle is not started", NextTurnUserId = room.CurrentTurnUserId };
        }

        if (room.CurrentTurnUserId != request.UserId)
        {
            return new ShotResult { IsValid = false, Message = "Not your turn", NextTurnUserId = room.CurrentTurnUserId };
        }

        if (request.X < 0 || request.Y < 0 || request.X >= Board.Size || request.Y >= Board.Size)
        {
            return new ShotResult { IsValid = false, Message = "Shot is out of board", NextTurnUserId = room.CurrentTurnUserId };
        }

        var shooter = room.GetPlayer(request.UserId);
        var target = room.GetOpponent(request.UserId);
        if (shooter is null || target is null)
        {
            return new ShotResult { IsValid = false, Message = "Players state is invalid", NextTurnUserId = room.CurrentTurnUserId };
        }

        if (target.Board.Shots.Contains((request.X, request.Y)))
        {
            return new ShotResult
            {
                IsValid = false,
                Message = "Cell already shot",
                NextTurnUserId = room.CurrentTurnUserId,
                ShooterBoardPrivate = shooter.Board.ToClientBoard(false),
                ShooterBoardPublic = shooter.Board.ToClientBoard(true),
                TargetBoardPrivate = target.Board.ToClientBoard(false),
                TargetBoardPublic = target.Board.ToClientBoard(true),
                TargetRemainingFleet = GetRemainingFleet(target.Board)
            };
        }

        target.Board.Shots.Add((request.X, request.Y));

        var isHit = target.Board.ShipCells.Contains((request.X, request.Y));
        if (isHit)
        {
            target.Board.HitCells.Add((request.X, request.Y));
        }

        var sunkShip = TryGetSunkShip(target.Board, request.X, request.Y);
        var isSunk = sunkShip is not null;
        if (sunkShip is not null)
        {
            MarkAroundSunkShip(target.Board, sunkShip);
        }

        var isGameOver = target.Board.ShipCells.All(target.Board.HitCells.Contains);

        if (isGameOver)
        {
            room.Phase = GamePhase.Finished;
            PersistGameResult(room, shooter, target);
        }
        else if (isHit)
        {
            room.CurrentTurnUserId = shooter.UserId;
        }
        else
        {
            room.CurrentTurnUserId = target.UserId;
        }

        return new ShotResult
        {
            IsValid = true,
            IsHit = isHit,
            IsSunk = isSunk,
            IsGameOver = isGameOver,
            WinnerUserId = isGameOver ? shooter.UserId : string.Empty,
            TargetRemainingFleet = GetRemainingFleet(target.Board),
            ShooterBoardPrivate = shooter.Board.ToClientBoard(false),
            ShooterBoardPublic = shooter.Board.ToClientBoard(true),
            TargetBoardPrivate = target.Board.ToClientBoard(false),
            TargetBoardPublic = target.Board.ToClientBoard(true),
            NextTurnUserId = room.CurrentTurnUserId,
            Message = isGameOver ? $"{shooter.Name} won" : (isSunk ? "Ship sunk" : (isHit ? "Hit" : "Miss"))
        };
    }

    public TurnEndedPayload EndTurn(EndTurnRequest request)
    {
        if (!_rooms.TryGetValue(request.RoomId, out var room))
        {
            throw new InvalidOperationException("Room not found");
        }

        var opponent = room.GetOpponent(request.UserId) ?? throw new InvalidOperationException("Opponent not found");
        room.CurrentTurnUserId = opponent.UserId;

        return new TurnEndedPayload(room.RoomId, room.CurrentTurnUserId);
    }

    public OnlineSnapshotPayload GetOnlineSnapshot(string roomId, string userId)
    {
        if (!_rooms.TryGetValue(roomId, out var room))
        {
            throw new InvalidOperationException("Room not found");
        }

        var player = room.GetPlayer(userId) ?? throw new InvalidOperationException("Player not found in room");
        var enemy = room.GetOpponent(userId) ?? throw new InvalidOperationException("Enemy not found in room");

        return new OnlineSnapshotPayload(
            room.RoomId,
            userId,
            room.CurrentTurnUserId,
            player.Board.ToClientBoard(false),
            enemy.Board.ToClientBoard(true),
            GetRemainingFleet(enemy.Board)
        );
    }

    public GameOverPayload ManualGameOver(string roomId, string winnerUserId)
    {
        if (!_rooms.TryGetValue(roomId, out var room))
        {
            throw new InvalidOperationException("Room not found");
        }

        var winner = room.GetPlayer(winnerUserId) ?? throw new InvalidOperationException("Winner not found");
        var loser = room.GetOpponent(winnerUserId) ?? throw new InvalidOperationException("Loser not found");

        room.Phase = GamePhase.Finished;
        PersistGameResult(room, winner, loser);

        return new GameOverPayload(roomId, winnerUserId);
    }

    public GameOverPayload PlayerForfeit(string roomId, string loserUserId)
    {
        if (!_rooms.TryGetValue(roomId, out var room))
        {
            throw new InvalidOperationException("Room not found");
        }

        var loser = room.GetPlayer(loserUserId) ?? throw new InvalidOperationException("Loser not found");
        var winner = room.GetOpponent(loserUserId) ?? throw new InvalidOperationException("Winner not found");

        if (room.Phase != GamePhase.Finished)
        {
            room.Phase = GamePhase.Finished;
            PersistGameResult(room, winner, loser);
        }

        return new GameOverPayload(room.RoomId, winner.UserId);
    }

    public async Task<List<Game>> GetGamesHistoryAsync(string userId)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        return await db.Games
            .Where(g => g.WinnerUserId == userId || g.LoserUserId == userId)
            .OrderByDescending(g => g.EndedAtUtc)
            .Take(50)
            .ToListAsync();
    }

    public async Task<Statistic> GetStatisticsAsync(string userId, string name)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            user = new User { Id = userId, Name = name };
            db.Users.Add(user);
        }

        var stats = await db.Statistics.FirstOrDefaultAsync(s => s.UserId == userId);
        if (stats is null)
        {
            stats = new Statistic { UserId = userId, Level = 1, Experience = 0 };
            db.Statistics.Add(stats);
            await db.SaveChangesAsync();
        }

        return stats;
    }

    public async Task<List<LeaderboardEntryPayload>> GetLeaderboardAsync(int limit = 50)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var safeLimit = Math.Clamp(limit, 1, 100);

        return await db.Statistics
            .Include(s => s.User)
            .OrderByDescending(s => s.Level)
            .ThenByDescending(s => s.Experience)
            .ThenByDescending(s => s.Wins)
            .Take(safeLimit)
            .Select(s => new LeaderboardEntryPayload(
                s.UserId,
                s.User != null ? s.User.Name : "Player",
                s.Level,
                s.Experience,
                s.Wins,
                s.Losses,
                s.GamesPlayed
            ))
            .ToListAsync();
    }

    public object StartAiGame(StartAiGameRequest request)
    {
        var playerShips = BuildAutoFleet();
        var aiShips = BuildAutoFleet();

        var session = new SinglePlayerSession
        {
            Id = Guid.NewGuid(),
            PlayerUserId = request.UserId,
            PlayerName = request.Name,
            Difficulty = request.Difficulty,
            StartedAtUtc = DateTime.UtcNow,
            PlayerBoard = BuildBoardFromShips(playerShips),
            AiBoard = BuildBoardFromShips(aiShips)
        };

        _aiSessions[session.Id] = session;

        return new
        {
            sessionId = session.Id,
            phase = GamePhase.Battle.ToString(),
            playerBoard = session.PlayerBoard.ToClientBoard(false),
            enemyBoard = session.AiBoard.ToClientBoard(true),
            enemyFleetRemaining = GetRemainingFleet(session.AiBoard)
        };
    }

    public object PlayerShootAi(PlayerAiShootRequest request, AiService aiService)
    {
        if (!_aiSessions.TryGetValue(request.SessionId, out var session))
        {
            throw new InvalidOperationException("Session not found");
        }

        if (session.IsFinished)
        {
            throw new InvalidOperationException("Game already finished");
        }

        if (request.X < 0 || request.Y < 0 || request.X >= Board.Size || request.Y >= Board.Size)
        {
            throw new InvalidOperationException("Shot is out of board");
        }

        if (session.AiBoard.Shots.Contains((request.X, request.Y)))
        {
            throw new InvalidOperationException("Cell already shot");
        }

        session.Moves++;
        session.AiBoard.Shots.Add((request.X, request.Y));

        var playerHit = ApplyShot(session.AiBoard, request.X, request.Y);
        var playerSunkShip = TryGetSunkShip(session.AiBoard, request.X, request.Y);
        if (playerSunkShip is not null)
        {
            MarkAroundSunkShip(session.AiBoard, playerSunkShip);
        }
        var playerWin = session.AiBoard.ShipCells.All(session.AiBoard.HitCells.Contains);

        if (playerWin)
        {
            session.IsFinished = true;
            session.WinnerUserId = session.PlayerUserId;
            PersistAiResult(session, true);
            aiService.CleanupSession(session.Id);

            return new
            {
                playerShot = new { x = request.X, y = request.Y, hit = playerHit },
                aiShot = (object?)null,
                playerKeepsTurn = false,
                playerBoard = session.PlayerBoard.ToClientBoard(false),
                enemyBoard = session.AiBoard.ToClientBoard(true),
                enemyFleetRemaining = GetRemainingFleet(session.AiBoard),
                gameOver = true,
                winnerUserId = session.PlayerUserId
            };
        }

        if (playerHit)
        {
            return new
            {
                playerShot = new { x = request.X, y = request.Y, hit = true },
                aiShot = (object?)null,
                playerKeepsTurn = true,
                playerBoard = session.PlayerBoard.ToClientBoard(false),
                enemyBoard = session.AiBoard.ToClientBoard(true),
                enemyFleetRemaining = GetRemainingFleet(session.AiBoard),
                gameOver = false,
                winnerUserId = string.Empty
            };
        }
        (int X, int Y) aiCoords = default;
        var aiHit = false;
        var aiWin = false;
        do
        {
            aiCoords = aiService.GetNextShot(session.Id, session.Difficulty, session.PlayerBoard.Shots);
            session.PlayerBoard.Shots.Add(aiCoords);
            aiHit = ApplyShot(session.PlayerBoard, aiCoords.X, aiCoords.Y);
            if (aiHit)
            {
                aiService.RegisterHit(session.Id, aiCoords.X, aiCoords.Y, session.PlayerBoard.Shots);
                var aiSunkShip = TryGetSunkShip(session.PlayerBoard, aiCoords.X, aiCoords.Y);
                if (aiSunkShip is not null)
                {
                    MarkAroundSunkShip(session.PlayerBoard, aiSunkShip);
                }
            }

            aiWin = session.PlayerBoard.ShipCells.All(session.PlayerBoard.HitCells.Contains);
            if (aiWin)
            {
                session.IsFinished = true;
                session.WinnerUserId = "AI";
                PersistAiResult(session, false);
                aiService.CleanupSession(session.Id);
                break;
            }
        } while (aiHit);

        return new
        {
            playerShot = new { x = request.X, y = request.Y, hit = playerHit },
            aiShot = new { x = aiCoords.X, y = aiCoords.Y, hit = aiHit },
            playerKeepsTurn = false,
            playerBoard = session.PlayerBoard.ToClientBoard(false),
            enemyBoard = session.AiBoard.ToClientBoard(true),
            enemyFleetRemaining = GetRemainingFleet(session.AiBoard),
            gameOver = aiWin,
            winnerUserId = aiWin ? "AI" : string.Empty
        };
    }

    public GameOverPayload? HandleDisconnect(string connectionId)
    {
        foreach (var room in _rooms.Values)
        {
            if (room.Player1.ConnectionId == connectionId && room.Player2 is null)
            {
                _rooms.TryRemove(room.RoomId, out _);
                return null;
            }

            if (room.Phase == GamePhase.Finished)
            {
                continue;
            }

            RuntimePlayer? loser = null;
            RuntimePlayer? winner = null;

            if (room.Player1.ConnectionId == connectionId)
            {
                loser = room.Player1;
                winner = room.Player2;
            }
            else if (room.Player2?.ConnectionId == connectionId)
            {
                loser = room.Player2;
                winner = room.Player1;
            }

            if (loser is null || winner is null)
            {
                continue;
            }

            room.Phase = GamePhase.Finished;
            PersistGameResult(room, winner, loser);
            return new GameOverPayload(room.RoomId, winner.UserId);
        }

        return null;
    }

    private static bool ApplyShot(RuntimeBoard board, int x, int y)
    {
        var isHit = board.ShipCells.Contains((x, y));
        if (isHit)
        {
            board.HitCells.Add((x, y));
        }

        return isHit;
    }

    private static RuntimeShip? TryGetSunkShip(RuntimeBoard board, int x, int y)
    {
        if (!board.ShipCells.Contains((x, y)))
        {
            return null;
        }

        return board.Ships.FirstOrDefault(ship =>
            ship.Cells.Contains((x, y)) && ship.Cells.All(board.HitCells.Contains));
    }

    private static void MarkAroundSunkShip(RuntimeBoard board, RuntimeShip ship)
    {
        foreach (var (x, y) in ship.Cells)
        {
            for (var dx = -1; dx <= 1; dx++)
            {
                for (var dy = -1; dy <= 1; dy++)
                {
                    var nx = x + dx;
                    var ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= Board.Size || ny >= Board.Size)
                    {
                        continue;
                    }

                    if (board.ShipCells.Contains((nx, ny)))
                    {
                        continue;
                    }

                    board.Shots.Add((nx, ny));
                }
            }
        }
    }

    private static Dictionary<int, int> GetRemainingFleet(RuntimeBoard board)
    {
        var remaining = board.Ships
            .Where(ship => !ship.Cells.All(board.HitCells.Contains))
            .GroupBy(ship => ship.Cells.Count)
            .ToDictionary(group => group.Key, group => group.Count());

        for (var size = 1; size <= 4; size++)
        {
            if (!remaining.ContainsKey(size))
            {
                remaining[size] = 0;
            }
        }

        return remaining;
    }

    private static RuntimeBoard BuildBoardFromShips(List<Ship> ships)
    {
        var board = new RuntimeBoard();
        foreach (var ship in ships)
        {
            var cells = new List<(int X, int Y)>();
            for (var i = 0; i < ship.Length; i++)
            {
                var x = ship.IsHorizontal ? ship.X + i : ship.X;
                var y = ship.IsHorizontal ? ship.Y : ship.Y + i;
                cells.Add((x, y));
                board.ShipCells.Add((x, y));
            }

            board.Ships.Add(new RuntimeShip { Cells = cells });
        }

        return board;
    }

    private static List<Ship> BuildAutoFleet()
    {
        var ships = new List<Ship>();
        var occupied = new HashSet<(int X, int Y)>();

        foreach (var length in RequiredFleet)
        {
            var placed = false;
            while (!placed)
            {
                var isHorizontal = Random.Shared.Next(0, 2) == 0;
                var x = Random.Shared.Next(0, Board.Size);
                var y = Random.Shared.Next(0, Board.Size);

                var candidate = new Ship
                {
                    X = x,
                    Y = y,
                    Length = length,
                    IsHorizontal = isHorizontal
                };

                if (!TryGetShipCells(candidate, out var cells))
                {
                    continue;
                }

                if (TouchesExisting(occupied, cells))
                {
                    continue;
                }

                foreach (var cell in cells)
                {
                    occupied.Add(cell);
                }

                ships.Add(candidate);
                placed = true;
            }
        }

        return ships;
    }

    private static void ValidateFleet(List<Ship> ships)
    {
        var lengths = ships.Select(s => s.Length).OrderByDescending(x => x).ToArray();
        var required = RequiredFleet.OrderByDescending(x => x).ToArray();

        if (!lengths.SequenceEqual(required))
        {
            throw new InvalidOperationException("Invalid fleet composition");
        }

        var occupied = new HashSet<(int X, int Y)>();
        foreach (var ship in ships)
        {
            if (!TryGetShipCells(ship, out var cells))
            {
                throw new InvalidOperationException("Ship placement is out of board");
            }

            if (TouchesExisting(occupied, cells))
            {
                throw new InvalidOperationException("Ships cannot overlap or touch");
            }

            foreach (var cell in cells)
            {
                occupied.Add(cell);
            }
        }
    }

    private static bool TouchesExisting(HashSet<(int X, int Y)> occupied, List<(int X, int Y)> cells)
    {
        foreach (var (x, y) in cells)
        {
            for (var dx = -1; dx <= 1; dx++)
            {
                for (var dy = -1; dy <= 1; dy++)
                {
                    var nx = x + dx;
                    var ny = y + dy;
                    if (occupied.Contains((nx, ny)))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static bool TryGetShipCells(Ship ship, out List<(int X, int Y)> cells)
    {
        cells = [];
        for (var i = 0; i < ship.Length; i++)
        {
            var x = ship.IsHorizontal ? ship.X + i : ship.X;
            var y = ship.IsHorizontal ? ship.Y : ship.Y + i;

            if (x < 0 || y < 0 || x >= Board.Size || y >= Board.Size)
            {
                return false;
            }

            cells.Add((x, y));
        }

        return true;
    }

    private void PersistGameResult(OnlineRoom room, RuntimePlayer winner, RuntimePlayer loser)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        EnsureUser(db, winner.UserId, winner.Name);
        EnsureUser(db, loser.UserId, loser.Name);

        UpdateStatistic(db, winner.UserId, true);
        UpdateStatistic(db, loser.UserId, false);

        db.Games.Add(new Game
        {
            RoomId = room.RoomId,
            Mode = GameMode.Online.ToString(),
            WinnerUserId = winner.UserId,
            LoserUserId = loser.UserId,
            WinnerName = winner.Name,
            LoserName = loser.Name,
            TotalMoves = room.TotalShots,
            StartedAtUtc = room.StartedAtUtc,
            EndedAtUtc = DateTime.UtcNow
        });

        db.SaveChanges();
    }

    private void PersistAiResult(SinglePlayerSession session, bool playerWon)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        EnsureUser(db, session.PlayerUserId, session.PlayerName);
        UpdateStatistic(db, session.PlayerUserId, playerWon);

        db.Games.Add(new Game
        {
            RoomId = session.Id.ToString(),
            Mode = GameMode.Ai.ToString(),
            WinnerUserId = playerWon ? session.PlayerUserId : "AI",
            LoserUserId = playerWon ? "AI" : session.PlayerUserId,
            WinnerName = playerWon ? session.PlayerName : "AI",
            LoserName = playerWon ? "AI" : session.PlayerName,
            TotalMoves = session.Moves,
            StartedAtUtc = session.StartedAtUtc,
            EndedAtUtc = DateTime.UtcNow
        });

        db.SaveChanges();
    }

    private static void EnsureUser(AppDbContext db, string userId, string name)
    {
        if (userId == "AI")
        {
            return;
        }

        if (db.Users.Any(x => x.Id == userId))
        {
            return;
        }

        db.Users.Add(new User
        {
            Id = userId,
            Name = name
        });
    }

    private static void UpdateStatistic(AppDbContext db, string userId, bool win)
    {
        if (userId == "AI")
        {
            return;
        }

        var stats = db.Statistics.FirstOrDefault(s => s.UserId == userId);
        if (stats is null)
        {
            stats = new Statistic { UserId = userId, Level = 1, Experience = 0 };
            db.Statistics.Add(stats);
        }

        stats.GamesPlayed += 1;
        if (win)
        {
            stats.Wins += 1;
            stats.Experience += WinXpGain;
        }
        else
        {
            stats.Losses += 1;
            stats.Experience = Math.Max(0, stats.Experience - LossXpPenalty);
        }

        stats.Level = CalculateLevel(stats.Experience);
    }

    private static int CalculateLevel(int experience)
    {
        return Math.Max(1, (experience / 100) + 1);
    }

    private static string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[Random.Shared.Next(chars.Length)])
            .ToArray());
    }

    private sealed class OnlineRoom
    {
        public string RoomId { get; set; } = string.Empty;
        public RuntimePlayer Player1 { get; set; } = new();
        public RuntimePlayer? Player2 { get; set; }
        public GamePhase Phase { get; set; }
        public string CurrentTurnUserId { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
        public int TotalShots => Player1.Board.Shots.Count + (Player2?.Board.Shots.Count ?? 0);

        public RuntimePlayer? GetPlayer(string userId)
        {
            if (Player1.UserId == userId)
            {
                return Player1;
            }

            if (Player2?.UserId == userId)
            {
                return Player2;
            }

            return null;
        }

        public RuntimePlayer? GetOpponent(string userId)
        {
            if (Player1.UserId == userId)
            {
                return Player2;
            }

            if (Player2?.UserId == userId)
            {
                return Player1;
            }

            return null;
        }
    }

    private sealed class RuntimePlayer
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsReady { get; set; }
        public RuntimeBoard Board { get; set; } = new();
    }

    private sealed class RuntimeBoard
    {
        public List<RuntimeShip> Ships { get; set; } = [];
        public HashSet<(int X, int Y)> ShipCells { get; } = [];
        public HashSet<(int X, int Y)> HitCells { get; } = [];
        public HashSet<(int X, int Y)> Shots { get; } = [];

        public string[][] ToClientBoard(bool hideShips)
        {
            var cells = Enumerable.Range(0, Board.Size)
                .Select(_ => Enumerable.Repeat(CellState.Empty.ToString().ToLowerInvariant(), Board.Size).ToArray())
                .ToArray();

            foreach (var (x, y) in ShipCells)
            {
                if (!hideShips)
                {
                    cells[y][x] = CellState.Ship.ToString().ToLowerInvariant();
                }
            }

            foreach (var (x, y) in Shots)
            {
                var hit = HitCells.Contains((x, y));
                cells[y][x] = hit
                    ? CellState.Hit.ToString().ToLowerInvariant()
                    : CellState.Miss.ToString().ToLowerInvariant();
            }

            return cells;
        }
    }

    private sealed class RuntimeShip
    {
        public List<(int X, int Y)> Cells { get; set; } = [];
    }

    private sealed class SinglePlayerSession
    {
        public Guid Id { get; set; }
        public string PlayerUserId { get; set; } = string.Empty;
        public string PlayerName { get; set; } = string.Empty;
        public AiDifficulty Difficulty { get; set; }
        public RuntimeBoard PlayerBoard { get; set; } = new();
        public RuntimeBoard AiBoard { get; set; } = new();
        public DateTime StartedAtUtc { get; set; }
        public int Moves { get; set; }
        public bool IsFinished { get; set; }
        public string WinnerUserId { get; set; } = string.Empty;
    }
}
