using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController(GameService gameService, AiService aiService) : ControllerBase
{
    [HttpPost("ai/start")]
    public IActionResult StartAiGame([FromBody] StartAiGameRequest request)
    {
        try
        {
            var response = gameService.StartAiGame(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("ai/player-shoot")]
    public IActionResult PlayerShootAi([FromBody] PlayerAiShootRequest request)
    {
        try
        {
            var response = gameService.PlayerShootAi(request, aiService);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("online/snapshot")]
    public IActionResult OnlineSnapshot([FromQuery] string roomId, [FromQuery] string userId)
    {
        try
        {
            var response = gameService.GetOnlineSnapshot(roomId, userId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("history/{userId}")]
    public async Task<IActionResult> History(string userId)
    {
        var history = await gameService.GetGamesHistoryAsync(userId);
        return Ok(history);
    }

    [HttpGet("statistics/{userId}")]
    public async Task<IActionResult> Statistics(string userId, [FromQuery] string name = "Player")
    {
        var statistics = await gameService.GetStatisticsAsync(userId, name);
        return Ok(statistics);
    }
}
