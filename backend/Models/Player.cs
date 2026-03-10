namespace Backend.Models;

public class Player
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public bool IsReady { get; set; }
    public Board Board { get; set; } = new();
}
