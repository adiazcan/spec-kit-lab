using DiceEngine.API.Models;
using DiceEngine.Application.Exceptions;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

[ApiController]
[Route("api/adventures/{adventureId}/quests/{questId}/stages")]
public class StagesController : ControllerBase
{
    private readonly IStageProgressService _stageProgressService;

    public StagesController(IStageProgressService stageProgressService)
    {
        _stageProgressService = stageProgressService ?? throw new ArgumentNullException(nameof(stageProgressService));
    }

    /// <summary>
    /// Updates progress for a specific objective.
    /// </summary>
    [HttpPatch("{stageNumber}/objectives/{objectiveId}/update")]
    [ProducesResponseType(typeof(ObjectiveProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ObjectiveProgressDto>> UpdateObjectiveProgress(
        Guid adventureId,
        Guid questId,
        int stageNumber,
        Guid objectiveId,
        [FromBody] UpdateObjectiveProgressRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var objectiveProgress = await _stageProgressService.UpdateObjectiveProgressAsync(
                request.PlayerId,
                questId,
                stageNumber,
                objectiveId,
                request.ProgressAmount,
                cancellationToken);

            return Ok(objectiveProgress);
        }
        catch (QuestProgressNotFoundException ex)
        {
            return NotFound(new { error = ex.Message, statusCode = 404 });
        }
        catch (ObjectiveNotFoundException ex)
        {
            return NotFound(new { error = ex.Message, statusCode = 404 });
        }
        catch (QuestNotActiveException ex)
        {
            return Conflict(new { error = ex.Message, statusCode = 409 });
        }
        catch (ObjectiveAlreadyCompleteException ex)
        {
            return Conflict(new { error = ex.Message, statusCode = 409 });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message, statusCode = 400 });
        }
    }

    /// <summary>
    /// Attempts to complete the current stage and advance to the next.
    /// </summary>
    [HttpPost("{stageNumber}/complete")]
    [ProducesResponseType(typeof(StageCompletionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StageCompletionResultDto>> CompleteStage(
        Guid adventureId,
        Guid questId,
        int stageNumber,
        [FromBody] CompleteStageRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _stageProgressService.CompleteStageAsync(
                request.PlayerId,
                questId,
                stageNumber,
                cancellationToken);

            return Ok(result);
        }
        catch (QuestProgressNotFoundException ex)
        {
            return NotFound(new { error = ex.Message, statusCode = 404 });
        }
        catch (QuestNotActiveException ex)
        {
            return Conflict(new { error = ex.Message, statusCode = 409 });
        }
        catch (StageNotCompleteException ex)
        {
            return BadRequest(new { error = ex.Message, statusCode = 400 });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message, statusCode = 400 });
        }
    }
}
