using Backend.Models;
using System.Collections.Concurrent;

namespace Backend.Services;

public class AiService
{
    private readonly ConcurrentDictionary<Guid, Queue<(int X, int Y)>> _normalTargets = new();

    public (int X, int Y) GetNextShot(Guid sessionId, AiDifficulty difficulty, HashSet<(int X, int Y)> usedShots)
    {
        return difficulty switch
        {
            AiDifficulty.Normal => GetNormalShot(sessionId, usedShots),
            _ => GetRandomShot(usedShots)
        };
    }

    public void RegisterHit(Guid sessionId, int x, int y, HashSet<(int X, int Y)> usedShots)
    {
        var queue = _normalTargets.GetOrAdd(sessionId, _ => new Queue<(int X, int Y)>());
        var candidates = new[]
        {
            (x - 1, y),
            (x + 1, y),
            (x, y - 1),
            (x, y + 1)
        };

        foreach (var (nx, ny) in candidates)
        {
            if (nx < 0 || ny < 0 || nx >= Board.Size || ny >= Board.Size)
            {
                continue;
            }

            if (!usedShots.Contains((nx, ny)) && !queue.Contains((nx, ny)))
            {
                queue.Enqueue((nx, ny));
            }
        }
    }

    public void CleanupSession(Guid sessionId)
    {
        _normalTargets.TryRemove(sessionId, out _);
    }

    private (int X, int Y) GetNormalShot(Guid sessionId, HashSet<(int X, int Y)> usedShots)
    {
        if (_normalTargets.TryGetValue(sessionId, out var queue))
        {
            while (queue.Count > 0)
            {
                var next = queue.Dequeue();
                if (!usedShots.Contains(next))
                {
                    return next;
                }
            }
        }

        return GetRandomShot(usedShots);
    }

    private static (int X, int Y) GetRandomShot(HashSet<(int X, int Y)> usedShots)
    {
        while (true)
        {
            var x = Random.Shared.Next(0, Board.Size);
            var y = Random.Shared.Next(0, Board.Size);
            if (!usedShots.Contains((x, y)))
            {
                return (x, y);
            }
        }
    }
}
