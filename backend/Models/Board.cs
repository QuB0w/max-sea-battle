namespace Backend.Models;

public class Board
{
    public const int Size = 10;
    public string[][] Cells { get; set; } = Enumerable.Range(0, Size)
        .Select(_ => Enumerable.Repeat(CellState.Empty.ToString().ToLowerInvariant(), Size).ToArray())
        .ToArray();
    public List<Ship> Ships { get; set; } = [];
}
