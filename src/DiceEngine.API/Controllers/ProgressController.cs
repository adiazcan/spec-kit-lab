using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

[ApiController]
[Route("api/adventures/{adventureId}")]
public class ProgressController : ControllerBase
{
    private readonly IQuestService _questService;

    public ProgressController(IQuestService questService)
    {
        _questService = questService ?? throw new ArgumentNullException(nameof(questService));
    }

    /// <summary>
    /// Lists all active quests for a player.
    /// </summary>
    [HttpGet("players/{playerId}/quests/active")]
    [ProducesResponseType(typeof(IEnumerable<QuestProgressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<QuestProgressDto>>> ListActiveQuests(
        Guid adventureId,
        Guid playerId,
        CancellationToken cancellationToken = default)
    {
        var activeQuests = await _questService.ListActiveQuestsAsync(playerId, cancellationToken);
        return Ok(activeQuests);
    }

    /// <summary>
    /// Gets current progress for a specific quest.
    /// </summary>
    [HttpGet("quests/{questId}/progress")]
    [ProducesResponseType(typeof(QuestProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuestProgressDto>> GetQuestProgress(
        Guid adventureId,
        Guid questId,
        [FromQuery] Guid playerId,
        CancellationToken cancellationToken = default)
    {
        var progress = await _questService.GetQuestProgressAsync(playerId, questId, cancellationToken);

        if (progress == null)
        {
            return NotFound(new { error = "Quest progress not found", statusCode = 404 });
        }

        return Ok(progress);
    }
}
