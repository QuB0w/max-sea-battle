using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Game
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public string? RoomId { get; set; }
    public string Mode { get; set; } = GameMode.Ai.ToString();
    public string WinnerUserId { get; set; } = string.Empty;
    public string LoserUserId { get; set; } = string.Empty;
    public string WinnerName { get; set; } = string.Empty;
    public string LoserName { get; set; } = string.Empty;
    public int TotalMoves { get; set; }
    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime EndedAtUtc { get; set; } = DateTime.UtcNow;
}
