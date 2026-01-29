using System.Text.RegularExpressions;

namespace DiceEngine.Application.Services;

/// <summary>
/// Calculates damage from weapon attacks
/// Parses damage expressions like "1d8+3" and rolls dice
/// Handles critical hits with doubled damage dice
/// </summary>
public class DamageCalculator : IDamageCalculator
{
    private readonly IDiceService _diceService;

    public DamageCalculator(IDiceService diceService)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
    }

    /// <summary>
    /// Calculate total damage from an attack
    /// Supports critical hits by doubling the number of damage dice
    /// </summary>
    /// <param name="damageExpression">Damage expression like "1d8+3"</param>
    /// <param name="damageModifier">Additional damage modifier</param>
    /// <param name="isCriticalHit">Whether attack was critical (doubles damage dice)</param>
    /// <returns>Total damage dealt (can be 0 if attack missed)</returns>
    public int CalculateDamage(
        string damageExpression,
        int damageModifier = 0,
        bool isCriticalHit = false)
    {
        if (string.IsNullOrWhiteSpace(damageExpression))
            throw new ArgumentException("Damage expression cannot be empty", nameof(damageExpression));

        // Parse the expression
        var (numDice, diceSize, baseMod) = ParseDamageExpression(damageExpression);

        // On critical hit, double the number of dice
        int dicesToRoll = isCriticalHit ? numDice * 2 : numDice;
        
        // Build a dice expression for rolling
        string diceExpr = $"{dicesToRoll}d{diceSize}";
        if (baseMod + damageModifier != 0)
        {
            diceExpr += baseMod + damageModifier > 0 ? "+" : "";
            diceExpr += (baseMod + damageModifier).ToString();
        }

        // Roll using DiceService
        var result = _diceService.Roll(diceExpr);
        int totalDamage = result.FinalTotal;

        // Minimum of 1 damage on a hit
        return Math.Max(1, totalDamage);
    }

    /// <summary>
    /// Parse a damage expression into components
    /// Supports formats like: "1d8", "2d6+3", "1d12-1"
    /// </summary>
    /// <returns>Tuple of (numDice, diceSize, modifier)</returns>
    public (int numDice, int diceSize, int modifier) ParseDamageExpression(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression))
            throw new ArgumentException("Expression cannot be null or empty", nameof(expression));

        // Pattern: XdY[+/-Z]
        // Where X = number of dice, Y = die size, Z = optional modifier
        var pattern = @"^(\d+)d(\d+)([\+\-]\d+)?$";
        var match = Regex.Match(expression.Trim(), pattern, RegexOptions.IgnoreCase);

        if (!match.Success)
            throw new ArgumentException(
                $"Invalid damage expression '{expression}'. Expected format like '1d8+3' or '2d6'",
                nameof(expression));

        int numDice = int.Parse(match.Groups[1].Value);
        int diceSize = int.Parse(match.Groups[2].Value);
        int modifier = 0;

        if (!string.IsNullOrEmpty(match.Groups[3].Value))
        {
            modifier = int.Parse(match.Groups[3].Value);
        }

        // Validate reasonable ranges
        if (numDice <= 0 || numDice > 10)
            throw new ArgumentException("Number of dice must be between 1 and 10", nameof(expression));

        if (diceSize <= 0 || diceSize > 100)
            throw new ArgumentException("Dice size must be between 1 and 100", nameof(expression));

        if (modifier < -20 || modifier > 20)
            throw new ArgumentException("Damage modifier must be between -20 and 20", nameof(expression));

        return (numDice, diceSize, modifier);
    }
}
