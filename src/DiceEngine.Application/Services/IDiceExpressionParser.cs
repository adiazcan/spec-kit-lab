using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Interface for parsing dice notation expressions into structured DiceExpression objects.
/// Supports standard notation (2d6), complex expressions (2d6+1d4+3), and advantage/disadvantage flags (1d20a).
/// </summary>
public interface IDiceExpressionParser
{
    /// <summary>
    /// Parses a dice notation expression string into a structured DiceExpression object.
    /// </summary>
    /// <param name="expression">Dice notation expression (e.g., "2d6+3", "1d20a", "2d6+1d4+5")</param>
    /// <returns>Parsed dice expression with dice rolls, modifiers, and flags</returns>
    /// <exception cref="Exceptions.InvalidExpressionException">Thrown when expression format is invalid</exception>
    /// <exception cref="Exceptions.ValidationException">Thrown when dice/sides counts are out of valid range (1-1000)</exception>
    DiceExpression Parse(string expression);
}
