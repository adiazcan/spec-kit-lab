using DiceEngine.API.Models;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.Application.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Dice rolling API controller providing endpoints for rolling dice, validating expressions, and calculating statistics.
/// Supports standard RPG dice notation (2d6, 1d20+5), complex expressions (2d6+1d4+3), and advantage/disadvantage mechanics (1d20a, 1d20d).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RollController : ControllerBase
{
    private readonly IDiceService _diceService;

    public RollController(IDiceService diceService)
    {
        _diceService = diceService;
    }

    /// <summary>
    /// Rolls dice according to the specified expression.
    /// </summary>
    /// <param name="request">The roll request containing the dice expression (e.g., "2d6+3", "1d20a", "2d6+1d4+5")</param>
    /// <returns>A roll result with individual rolls, totals, and metadata</returns>
    /// <response code="200">Returns the roll result with dice values and total</response>
    /// <response code="400">Invalid expression or parameters</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    /// 
    ///     POST /api/roll
    ///     {
    ///         "expression": "2d6+3"
    ///     }
    ///     
    /// Supported notation:
    /// - Basic: NdS (e.g., 2d6 = roll 2 six-sided dice)
    /// - With modifier: NdS±M (e.g., 1d20+5 = roll 1 twenty-sided die and add 5)
    /// - Complex: Multiple groups (e.g., 2d6+1d4+3 = roll 2d6, 1d4, then add 3)
    /// - Advantage: NdSa (e.g., 1d20a = roll twice, take higher)
    /// - Disadvantage: NdSd (e.g., 1d20d = roll twice, take lower)
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(StandardResponse<RollResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(StandardResponse<RollResult>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(StandardResponse<RollResult>), StatusCodes.Status500InternalServerError)]
    public ActionResult<StandardResponse<RollResult>> Roll([FromBody] RollRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(StandardResponse<RollResult>.Fail("INVALID_PARAMETERS", "Expression is required."));
        }

        try
        {
            var result = _diceService.Roll(request.Expression);
            return Ok(StandardResponse<RollResult>.Ok(result));
        }
        catch (InvalidExpressionException ex)
        {
            return BadRequest(StandardResponse<RollResult>.Fail("INVALID_EXPRESSION", ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(StandardResponse<RollResult>.Fail("INVALID_PARAMETERS", ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, StandardResponse<RollResult>.Fail("INTERNAL_ERROR", ex.Message));
        }
    }

    /// <summary>
    /// Validates a dice expression without rolling.
    /// </summary>
    /// <param name="request">The validation request containing the dice expression</param>
    /// <returns>Validation result with parsed components and expected min/max values</returns>
    /// <response code="200">Returns validation result (valid or invalid with reason)</response>
    /// <response code="400">Invalid request parameters</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    /// 
    ///     POST /api/roll/validate
    ///     {
    ///         "expression": "2d6+1d4+3"
    ///     }
    ///     
    /// Returns parsed dice groups, modifiers, and expected min/max without performing the roll.
    /// </remarks>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(StandardResponse<ValidateResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(StandardResponse<ValidateResponse>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(StandardResponse<ValidateResponse>), StatusCodes.Status500InternalServerError)]
    public ActionResult<StandardResponse<ValidateResponse>> Validate([FromBody] ValidateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(StandardResponse<ValidateResponse>.Fail("INVALID_PARAMETERS", "Expression is required."));
        }

        try
        {
            var diceExpression = _diceService.ValidateExpression(request.Expression);

            // Convert domain entity to response model
            var parsedComponents = new ParsedComponents
            {
                DiceRolls = diceExpression.DiceRolls.Select(roll => new DiceRollComponent
                {
                    NumberOfDice = roll.NumberOfDice,
                    SidesPerDie = roll.SidesPerDie,
                    Modifier = roll.Modifier
                }).ToList(),
                GlobalModifier = diceExpression.TotalModifier,
                HasAdvantage = diceExpression.HasAdvantage,
                HasDisadvantage = diceExpression.HasDisadvantage
            };

            var response = new ValidateResponse
            {
                IsValid = true,
                OriginalExpression = request.Expression,
                ParsedComponents = parsedComponents,
                ExpectedMinimum = diceExpression.DiceRolls.Sum(r => r.NumberOfDice) + diceExpression.TotalModifier,
                ExpectedMaximum = diceExpression.DiceRolls.Sum(r => r.NumberOfDice * r.SidesPerDie) + diceExpression.TotalModifier,
                Message = null
            };

            return Ok(StandardResponse<ValidateResponse>.Ok(response));
        }
        catch (InvalidExpressionException ex)
        {
            var response = new ValidateResponse
            {
                IsValid = false,
                OriginalExpression = request.Expression,
                ParsedComponents = null,
                ExpectedMinimum = null,
                ExpectedMaximum = null,
                Message = ex.Message
            };
            return Ok(StandardResponse<ValidateResponse>.Ok(response));
        }
        catch (Exception ex)
        {
            return StatusCode(500, StandardResponse<ValidateResponse>.Fail("INTERNAL_ERROR", ex.Message));
        }
    }

    /// <summary>
    /// Calculates statistical information for a dice expression.
    /// </summary>
    /// <param name="expression">The dice expression to analyze (e.g., "2d6", "1d20+5")</param>
    /// <returns>Statistical analysis including min, max, mean, standard deviation, mode, and median</returns>
    /// <response code="200">Returns statistical analysis of the expression</response>
    /// <response code="400">Invalid expression or parameters</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    /// 
    ///     GET /api/roll/stats/2d6
    ///     
    /// Returns theoretical statistics without performing a roll.
    /// </remarks>
    [HttpGet("stats/{expression}")]
    [ProducesResponseType(typeof(StandardResponse<StatsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(StandardResponse<StatsResponse>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(StandardResponse<StatsResponse>), StatusCodes.Status500InternalServerError)]
    public ActionResult<StandardResponse<StatsResponse>> GetStats(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression) || expression.Length < 3 || expression.Length > 255)
        {
            return BadRequest(StandardResponse<StatsResponse>.Fail("INVALID_PARAMETERS", "Expression must be between 3 and 255 characters."));
        }

        try
        {
            var statsResult = _diceService.GetStatistics(expression);

            // Map from StatsResult to StatsResponse
            var response = new StatsResponse
            {
                Expression = statsResult.Expression,
                Minimum = statsResult.Minimum,
                Maximum = statsResult.Maximum,
                Mean = statsResult.Mean,
                StandardDeviation = statsResult.StandardDeviation,
                Mode = statsResult.Mode,
                Median = statsResult.Median
            };

            return Ok(StandardResponse<StatsResponse>.Ok(response));
        }
        catch (InvalidExpressionException ex)
        {
            return BadRequest(StandardResponse<StatsResponse>.Fail("INVALID_EXPRESSION", ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(StandardResponse<StatsResponse>.Fail("INVALID_PARAMETERS", ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, StandardResponse<StatsResponse>.Fail("INTERNAL_ERROR", ex.Message));
        }
    }
}
