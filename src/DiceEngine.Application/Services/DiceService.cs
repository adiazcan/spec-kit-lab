using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Core dice service that orchestrates dice expression parsing, rolling, and statistical analysis.
/// </summary>
public class DiceService : IDiceService
{
    private readonly IDiceExpressionParser _parser;
    private readonly IDiceRoller _roller;

    public DiceService(IDiceExpressionParser parser, IDiceRoller roller)
    {
        _parser = parser;
        _roller = roller;
    }

    /// <summary>
    /// Rolls dice according to the provided expression.
    /// </summary>
    /// <param name="expression">Dice notation expression (e.g., "2d6+3", "1d20a")</param>
    /// <returns>Roll result with individual dice values and total</returns>
    /// <exception cref="Exceptions.InvalidExpressionException">Thrown when expression format is invalid</exception>
    /// <exception cref="Exceptions.ValidationException">Thrown when dice/sides counts are out of valid range</exception>
    public RollResult Roll(string expression)
    {
        var parsed = _parser.Parse(expression);
        return _roller.Roll(parsed);
    }

    /// <summary>
    /// Validates a dice expression without performing a roll.
    /// </summary>
    /// <param name="expression">Dice notation expression to validate</param>
    /// <returns>Parsed dice expression object</returns>
    /// <exception cref="Exceptions.InvalidExpressionException">Thrown when expression format is invalid</exception>
    /// <exception cref="Exceptions.ValidationException">Thrown when dice/sides counts are out of valid range</exception>
    public DiceExpression ValidateExpression(string expression)
    {
        return _parser.Parse(expression);
    }

    /// <summary>
    /// Calculates theoretical statistics for a dice expression.
    /// </summary>
    /// <param name="expression">Dice notation expression to analyze</param>
    /// <returns>Statistical analysis including min, max, mean, standard deviation, mode, and median</returns>
    /// <exception cref="Exceptions.InvalidExpressionException">Thrown when expression format is invalid</exception>
    /// <exception cref="Exceptions.ValidationException">Thrown when dice/sides counts are out of valid range</exception>
    public StatsResult GetStatistics(string expression)
    {
        var parsed = _parser.Parse(expression);

        // Calculate minimum and maximum possible rolls
        int minimum = parsed.DiceRolls.Sum(r => r.NumberOfDice) + parsed.TotalModifier;
        int maximum = parsed.DiceRolls.Sum(r => r.NumberOfDice * r.SidesPerDie) + parsed.TotalModifier;

        // Calculate mean (expected value)
        double mean = parsed.DiceRolls.Sum(r => r.NumberOfDice * (r.SidesPerDie + 1) / 2.0) + parsed.TotalModifier;

        // Calculate variance and standard deviation
        double variance = parsed.DiceRolls.Sum(r =>
            r.NumberOfDice * (Math.Pow(r.SidesPerDie, 2) - 1) / 12.0);
        double standardDeviation = Math.Sqrt(variance);

        // Calculate median (expected value is typically the median for symmetric distributions)
        int median = (int)Math.Round(mean);

        // For mode, in symmetric dice distributions, it's usually near the mean
        int mode = (int)Math.Round(mean);

        return new StatsResult
        {
            Expression = expression,
            Minimum = minimum,
            Maximum = maximum,
            Mean = Math.Round(mean, 2),
            StandardDeviation = Math.Round(standardDeviation, 3),
            Mode = mode,
            Median = median
        };
    }
}
