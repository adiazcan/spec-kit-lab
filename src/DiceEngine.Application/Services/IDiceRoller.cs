using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Interface for performing cryptographically secure dice rolls based on parsed dice expressions.
/// Handles standard rolls, advantage (roll twice, take higher), and disadvantage (roll twice, take lower).
/// </summary>
public interface IDiceRoller
{
    /// <summary>
    /// Performs a dice roll based on the parsed expression using cryptographically secure randomization.
    /// Automatically handles advantage/disadvantage flags if present in the expression.
    /// </summary>
    /// <param name="expression">Parsed dice expression containing dice rolls, modifiers, and flags</param>
    /// <returns>Roll result with individual dice values, subtotals, and final total</returns>
    RollResult Roll(DiceExpression expression);

    /// <summary>
    /// Performs a dice roll with advantage (roll twice, take the higher result).
    /// </summary>
    /// <param name="expression">Parsed dice expression</param>
    /// <returns>Roll result with both rolls and the higher total selected</returns>
    RollResult RollAdvantage(DiceExpression expression);

    /// <summary>
    /// Performs a dice roll with disadvantage (roll twice, take the lower result).
    /// </summary>
    /// <param name="expression">Parsed dice expression</param>
    /// <returns>Roll result with both rolls and the lower total selected</returns>
    RollResult RollDisadvantage(DiceExpression expression);
}
