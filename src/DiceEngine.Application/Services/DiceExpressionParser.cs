using System.Text.RegularExpressions;
using DiceEngine.Application.Exceptions;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

public class DiceExpressionParser : IDiceExpressionParser
{
    // T044: Basic notation pattern (e.g., "2d6", "1d20+5")
    // T087: Extended to capture advantage/disadvantage flags ('a' or 'd' at end)
    private static readonly Regex BasicNotationRegex = new("^(?<count>\\d+)d(?<sides>\\d+)(?<modifier>[+-]\\d+)?(?<flag>[ad])?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // T068: Complex expression pattern - matches individual components
    // Matches: dice groups (NdS) or standalone modifiers (+/-N without following 'd')
    private static readonly Regex ComponentRegex = new("(\\d+d\\d+)|([+-]\\d+(?!d))", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // T087: Pattern to extract advantage/disadvantage flag from end of expression
    private static readonly Regex FlagRegex = new("([ad])$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Validation patterns
    private static readonly Regex InvalidPatternsRegex = new("(\\+\\+|--|-\\+|\\+-|d[+-]|[+-]d|[+-]$|^[+-])", RegexOptions.Compiled);

    public DiceExpression Parse(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression))
        {
            throw new InvalidExpressionException("Expression cannot be empty.");
        }

        var trimmed = expression.Trim();

        // T088: Check for conflicting flags (both 'a' and 'd')
        var lowerExpression = trimmed.ToLowerInvariant();
        if (lowerExpression.Contains('a') && lowerExpression.Contains('d'))
        {
            // Check if both are at the end (e.g., "1d20ad")
            if (lowerExpression.EndsWith("ad") || lowerExpression.EndsWith("da"))
            {
                throw new InvalidExpressionException("Cannot specify both advantage and disadvantage.");
            }
        }

        // T062, T063: Check for invalid patterns (double operators, trailing operators, etc.)
        // But exclude the flag characters from this check
        var exprWithoutFlag = FlagRegex.Replace(trimmed, "");
        if (InvalidPatternsRegex.IsMatch(exprWithoutFlag))
        {
            throw new InvalidExpressionException("Expression is invalid. Expected format: NdS±M (e.g., 2d6, 1d20+5).");
        }

        // Try basic pattern first (for backward compatibility and simple cases)
        var basicMatch = BasicNotationRegex.Match(trimmed);
        if (basicMatch.Success)
        {
            return ParseBasicExpression(trimmed, basicMatch);
        }

        // T069: Try complex expression pattern
        return ParseComplexExpression(trimmed);
    }

    private DiceExpression ParseBasicExpression(string expression, Match match)
    {
        var diceCount = int.Parse(match.Groups["count"].Value);
        var sides = int.Parse(match.Groups["sides"].Value);
        var modifier = 0;
        if (match.Groups["modifier"].Success)
        {
            modifier = int.Parse(match.Groups["modifier"].Value);
        }

        // T087: Extract advantage/disadvantage flag
        var hasAdvantage = false;
        var hasDisadvantage = false;
        if (match.Groups["flag"].Success)
        {
            var flag = match.Groups["flag"].Value.ToLowerInvariant();
            hasAdvantage = flag == "a";
            hasDisadvantage = flag == "d";
        }

        try
        {
            var diceRoll = new DiceRoll(diceCount, sides, modifier);
            return new DiceExpression(expression, new[] { diceRoll }, hasAdvantage: hasAdvantage, hasDisadvantage: hasDisadvantage);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ValidationException(ex.Message);
        }
        catch (ArgumentException ex)
        {
            throw new ValidationException(ex.Message);
        }
    }

    private DiceExpression ParseComplexExpression(string expression)
    {
        // T087: Extract and remove flag from expression before parsing components
        var flagMatch = FlagRegex.Match(expression);
        var hasAdvantage = false;
        var hasDisadvantage = false;
        var exprWithoutFlag = expression;

        if (flagMatch.Success)
        {
            var flag = flagMatch.Groups[1].Value.ToLowerInvariant();
            hasAdvantage = flag == "a";
            hasDisadvantage = flag == "d";
            exprWithoutFlag = FlagRegex.Replace(expression, "");
        }

        // T069: Extract sequential components from complex expression
        var matches = ComponentRegex.Matches(exprWithoutFlag);

        if (matches.Count == 0)
        {
            throw new InvalidExpressionException("Expression is invalid. Expected format: NdS±M (e.g., 2d6, 1d20+5).");
        }

        var diceRolls = new List<DiceRoll>();
        var modifiers = new List<int>();

        foreach (Match match in matches)
        {
            var matchValue = match.Value;

            // Check if it's a dice group (contains 'd')
            if (matchValue.Contains('d', StringComparison.OrdinalIgnoreCase))
            {
                // Parse dice group (e.g., "2d6")
                var parts = matchValue.Split('d', StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length != 2)
                {
                    throw new InvalidExpressionException($"Invalid dice notation: {matchValue}");
                }

                if (!int.TryParse(parts[0], out var diceCount) || !int.TryParse(parts[1], out var sides))
                {
                    throw new InvalidExpressionException($"Invalid dice notation: {matchValue}");
                }

                try
                {
                    diceRolls.Add(new DiceRoll(diceCount, sides, 0));
                }
                catch (ArgumentOutOfRangeException ex)
                {
                    throw new ValidationException(ex.Message);
                }
                catch (ArgumentException ex)
                {
                    throw new ValidationException(ex.Message);
                }
            }
            else
            {
                // Parse modifier (e.g., "+3", "-2")
                if (int.TryParse(matchValue, out var modifier))
                {
                    modifiers.Add(modifier);
                }
            }
        }

        if (diceRolls.Count == 0)
        {
            throw new InvalidExpressionException("Expression must contain at least one dice group.");
        }

        try
        {
            return new DiceExpression(expression, diceRolls, modifiers, hasAdvantage, hasDisadvantage);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ValidationException(ex.Message);
        }
        catch (ArgumentException ex)
        {
            throw new ValidationException(ex.Message);
        }
    }
}
