using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for dice rolling, validation, and statistical analysis.
/// </summary>
public interface IDiceService
{
    /// <summary>
    /// Rolls dice according to the provided expression.
    /// </summary>
    /// <param name="expression">Dice notation expression (e.g., "2d6+3", "1d20a")</param>
    /// <returns>Roll result with individual dice values and total</returns>
    RollResult Roll(string expression);

    /// <summary>
    /// Validates a dice expression without performing a roll.
    /// </summary>
    /// <param name="expression">Dice notation expression to validate</param>
    /// <returns>Parsed dice expression object</returns>
    DiceExpression ValidateExpression(string expression);

    /// <summary>
    /// Calculates theoretical statistics for a dice expression.
    /// </summary>
    /// <param name="expression">Dice notation expression to analyze</param>
    /// <returns>Statistical analysis including min, max, mean, standard deviation, mode, and median</returns>
    StatsResult GetStatistics(string expression);
}
