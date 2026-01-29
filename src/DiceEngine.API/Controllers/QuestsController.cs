using DiceEngine.API.Models;
using DiceEngine.Application.Exceptions;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

[ApiController]
[Route("api/adventures/{adventureId}/quests")]
public class QuestsController : ControllerBase
{
    private readonly IQuestService _questService;
    private readonly IDependencyResolver _dependencyResolver;

    public QuestsController(
        IQuestService questService,
        IDependencyResolver dependencyResolver)
    {
        _questService = questService ?? throw new ArgumentNullException(nameof(questService));
        _dependencyResolver = dependencyResolver ?? throw new ArgumentNullException(nameof(dependencyResolver));
    }

    /// <summary>
    /// Lists all available quests for an adventure.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ListQuests(
        Guid adventureId,
        [FromQuery] string? difficulty = null,
        [FromQuery] int skip = 0,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        if (limit > 50) limit = 50;
        if (skip < 0) skip = 0;

        var (quests, totalCount) = await _questService.ListQuestsAsync(
            adventureId,
            null, // playerId for lock status will be added in Phase 8
            difficulty,
            skip,
            limit,
            cancellationToken);

        return Ok(new
        {
            items = quests,
            totalCount,
            skip,
            limit
        });
    }

    /// <summary>
    /// Accepts a quest for a player, creating initial progress.
    /// </summary>
    [HttpPost("{questId}/accept")]
    [ProducesResponseType(typeof(QuestProgressDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<QuestProgressDto>> AcceptQuest(
        Guid adventureId,
        Guid questId,
        [FromBody] AcceptQuestRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var questProgress = await _questService.AcceptQuestAsync(
                request.PlayerId,
                questId,
                cancellationToken);

            return CreatedAtAction(
                nameof(ProgressController.GetQuestProgress),
                "Progress",
                new { adventureId, questId, playerId = request.PlayerId },
                questProgress);
        }
        catch (QuestNotFoundException ex)
        {
            return NotFound(new { error = ex.Message, statusCode = 404 });
        }
        catch (QuestAlreadyActiveException ex)
        {
            return UnprocessableEntity(new { error = ex.Message, statusCode = 422 });
        }
        catch (PrerequisiteNotMetException ex)
        {
            return Conflict(new { error = ex.Message, statusCode = 409 });
        }
        catch (MaxActiveQuestsExceededException ex)
        {
            return Conflict(new { error = ex.Message, statusCode = 409 });
        }
    }

    /// <summary>
    /// Abandons a quest in progress.
    /// </summary>
    [HttpPost("{questId}/abandon")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> AbandonQuest(
        Guid adventureId,
        Guid questId,
        [FromBody] AbandonQuestRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _questService.AbandonQuestAsync(request.PlayerId, questId, cancellationToken);
            return NoContent();
        }
        catch (QuestProgressNotFoundException ex)
        {
            return NotFound(new { error = ex.Message, statusCode = 404 });
        }
        catch (QuestNotActiveException ex)
        {
            return Conflict(new { error = ex.Message, statusCode = 409 });
        }
    }

    /// <summary>
    /// Gets dependency information for a quest.
    /// </summary>
    [HttpGet("{questId}/dependencies")]
    [ProducesResponseType(typeof(QuestDependencyInfoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<QuestDependencyInfoDto>> GetQuestDependencies(
        Guid adventureId,
        Guid questId,
        [FromQuery] Guid? playerId = null,
        CancellationToken cancellationToken = default)
    {
        var dependencyInfo = await _dependencyResolver.GetDependencyInfoAsync(
            questId,
            playerId,
            cancellationToken);

        return Ok(dependencyInfo);
    }
}
