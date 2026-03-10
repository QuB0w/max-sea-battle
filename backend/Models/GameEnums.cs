namespace Backend.Models;

public enum CellState
{
    Empty,
    Ship,
    Hit,
    Miss
}

public enum GamePhase
{
    ShipPlacement,
    Battle,
    Finished
}

public enum AiDifficulty
{
    Easy,
    Normal
}

public enum GameMode
{
    Ai,
    Online
}
