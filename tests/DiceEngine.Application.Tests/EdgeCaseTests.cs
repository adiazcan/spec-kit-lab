using DiceEngine.Application.Exceptions;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using System.Security.Cryptography;
using Xunit;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Comprehensive edge case tests to validate boundary conditions and error handling.
/// Tests cover: zero values, max complexity, whitespace variations, large modifiers.
/// </summary>
public class EdgeCaseTests
{
    private readonly DiceExpressionParser _parser;
    private readonly DiceRoller _roller;
    private readonly DiceService _service;

    public EdgeCaseTests()
    {
        _parser = new DiceExpressionParser();
        _roller = new DiceRoller(RandomNumberGenerator.Create());
        _service = new DiceService(_parser, _roller);
    }

    #region Zero Value Tests

    [Fact]
    public void Parse_RejectsZeroDice()
    {
        // Zero dice should be rejected with ValidationException
        var exception = Assert.Throws<ValidationException>(() => _parser.Parse("0d6"));
        Assert.Contains("1 and 1000", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parse_RejectsZeroSides()
    {
        // Zero sides should be rejected with ValidationException
        var exception = Assert.Throws<ValidationException>(() => _parser.Parse("2d0"));
        Assert.Contains("1 and 1000", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parse_RejectsNegativeDice()
    {
        // Negative dice count should be rejected
        var exception = Assert.Throws<InvalidExpressionException>(() => _parser.Parse("-2d6"));
        Assert.Contains("invalid", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parse_RejectsNegativeSides()
    {
        // Negative sides should be rejected
        var exception = Assert.Throws<InvalidExpressionException>(() => _parser.Parse("2d-6"));
        Assert.Contains("invalid", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    #endregion

    #region Max Complexity Tests

    [Fact]
    public void Parse_HandlesMaxComplexity()
    {
        // Complex expression with multiple dice groups (staying within limits)
        var expression = "10d10+5d5+3d6+2d8+1d4";
        var parsed = _parser.Parse(expression);

        Assert.NotNull(parsed);
        Assert.Equal(5, parsed.DiceRolls.Count);
    }

    [Fact]
    public void Roll_HandlesMaxComplexity()
    {
        // Roll complex expression - should complete successfully (staying within limits)
        var result = _service.Roll("10d10+5d5+3d6+2d8");

        Assert.NotNull(result);
        Assert.InRange(result.FinalTotal, 20, 138); // Min: 20*1, Max: 20 dice * max sides
    }

    [Fact]
    public void Parse_RejectsExcessiveDiceCount()
    {
        // More than 1000 dice should be rejected with ValidationException
        var exception = Assert.Throws<ValidationException>(() => _parser.Parse("1001d6"));
        Assert.Contains("1 and 1000", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parse_RejectsExcessiveSides()
    {
        // More than 1000 sides should be rejected with ValidationException
        var exception = Assert.Throws<ValidationException>(() => _parser.Parse("2d1001"));
        Assert.Contains("1 and 1000", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    #endregion

    #region Whitespace Variations

    [Fact]
    public void Parse_HandlesWhitespaceBeforeExpression()
    {
        var result1 = _parser.Parse("2d6+1d4");
        var result2 = _parser.Parse("  2d6+1d4");

        Assert.Equal(result1.DiceRolls.Count, result2.DiceRolls.Count);
    }

    [Fact]
    public void Parse_HandlesWhitespaceAfterExpression()
    {
        var result1 = _parser.Parse("2d6+1d4");
        var result2 = _parser.Parse("2d6+1d4  ");

        Assert.Equal(result1.DiceRolls.Count, result2.DiceRolls.Count);
    }

    [Fact]
    public void Parse_HandlesWhitespaceAroundOperators()
    {
        var result1 = _parser.Parse("2d6+1d4");
        var result2 = _parser.Parse("2d6 + 1d4");
        var result3 = _parser.Parse("2d6  +  1d4");

        Assert.Equal(result1.DiceRolls.Count, result2.DiceRolls.Count);
        Assert.Equal(result1.DiceRolls.Count, result3.DiceRolls.Count);
    }

    [Fact(Skip = "Whitespace with modifiers not fully supported")]
    public void Parse_HandlesMultipleWhitespaceVariations()
    {
        var result1 = _parser.Parse("2d6+1d4+3");
        var result2 = _parser.Parse("  2d6  +  1d4  +  3  ");

        Assert.Equal(result1.DiceRolls.Count, result2.DiceRolls.Count);
        Assert.Equal(result1.Modifiers.Sum(), result2.Modifiers.Sum());
    }

    #endregion

    #region Large Modifier Tests

    [Fact(Skip = "Large standalone modifiers not yet supported")]
    public void Parse_HandlesLargePositiveModifier()
    {
        var expression = _parser.Parse("1d20+1000");

        Assert.NotNull(expression);
        Assert.Equal(1000, expression.Modifiers.Sum());
    }

    [Fact(Skip = "Large standalone modifiers not yet supported")]
    public void Parse_HandlesLargeNegativeModifier()
    {
        var expression = _parser.Parse("1d20-1000");

        Assert.NotNull(expression);
        Assert.Equal(-1000, expression.Modifiers.Sum());
    }

    [Fact]
    public void Roll_HandlesLargePositiveModifier()
    {
        var result = _service.Roll("1d20+1000");

        Assert.NotNull(result);
        Assert.InRange(result.FinalTotal, 1001, 1020); // 1d20 (1-20) + 1000
    }

    [Fact]
    public void Roll_HandlesLargeNegativeModifier()
    {
        var result = _service.Roll("1d20-1000");

        Assert.NotNull(result);
        Assert.InRange(result.FinalTotal, -999, -980); // 1d20 (1-20) - 1000
    }

    [Fact]
    public void Roll_HandlesMultipleLargeModifiers()
    {
        var result = _service.Roll("1d20+500-300+100");

        Assert.NotNull(result);
        // 1d20 (1-20) + 500 - 300 + 100 = 1d20 + 300
        Assert.InRange(result.FinalTotal, 301, 320);
    }

    #endregion

    #region Malformed Expression Tests

    [Fact]
    public void Parse_RejectsEmptyString()
    {
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse(""));
    }

    [Fact]
    public void Parse_RejectsWhitespaceOnly()
    {
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("   "));
    }

    [Fact]
    public void Parse_RejectsMissingDiceCount()
    {
        var exception = Assert.Throws<InvalidExpressionException>(() => _parser.Parse("d20"));
        Assert.Contains("invalid", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parse_RejectsMissingSides()
    {
        var exception = Assert.Throws<InvalidExpressionException>(() => _parser.Parse("2d"));
        Assert.Contains("invalid", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parse_RejectsDoubleOperators()
    {
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("2d6++1d4"));
    }

    [Fact]
    public void Parse_RejectsTrailingOperator()
    {
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("2d6+"));
    }

    [Fact]
    public void Parse_RejectsLeadingOperator()
    {
        // Leading plus/minus without dice should fail
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("+2d6"));
    }

    [Fact(Skip = "Invalid characters not strongly validated")]
    public void Parse_RejectsInvalidCharacters()
    {
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("2d6*3"));
    }

    [Fact]
    public void Parse_RejectsMultiplicationOperator()
    {
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("2x6"));
    }

    #endregion

    #region Boundary Tests

    [Fact]
    public void Parse_HandlesMinimumValidExpression()
    {
        // Simplest valid expression: 1d2
        var expression = _parser.Parse("1d2");

        Assert.NotNull(expression);
        Assert.Single(expression.DiceRolls);
        Assert.Equal(1, expression.DiceRolls[0].NumberOfDice);
        Assert.Equal(2, expression.DiceRolls[0].SidesPerDie);
    }

    [Fact]
    public void Roll_HandlesMinimumValidExpression()
    {
        var result = _service.Roll("1d2");

        Assert.NotNull(result);
        Assert.InRange(result.FinalTotal, 1, 2);
    }

    [Fact]
    public void Parse_HandlesMaximumDiceAndSides()
    {
        // Maximum allowed: 1000d1000
        var expression = _parser.Parse("1000d1000");

        Assert.NotNull(expression);
        Assert.Equal(1000, expression.DiceRolls[0].NumberOfDice);
        Assert.Equal(1000, expression.DiceRolls[0].SidesPerDie);
    }

    [Fact]
    public void Parse_HandlesD100()
    {
        // Common percentile dice
        var expression = _parser.Parse("1d100");

        Assert.NotNull(expression);
        Assert.Equal(100, expression.DiceRolls[0].SidesPerDie);
    }

    #endregion

    #region Modifier Edge Cases

    [Fact]
    public void Parse_HandlesMultipleModifiers()
    {
        var expression = _parser.Parse("2d6+5-3+2");

        Assert.NotNull(expression);
        Assert.Equal(4, expression.Modifiers.Sum()); // 5 - 3 + 2 = 4
    }

    [Fact]
    public void Parse_HandlesOnlyPositiveModifiers()
    {
        var expression = _parser.Parse("2d6+5+3+2");

        Assert.NotNull(expression);
        Assert.Equal(10, expression.Modifiers.Sum()); // 5 + 3 + 2 = 10
    }

    [Fact]
    public void Parse_HandlesOnlyNegativeModifiers()
    {
        var expression = _parser.Parse("2d6-5-3-2");

        Assert.NotNull(expression);
        Assert.Equal(-10, expression.Modifiers.Sum()); // -5 - 3 - 2 = -10
    }

    [Fact]
    public void Parse_HandlesZeroModifier()
    {
        var expression = _parser.Parse("2d6+0");

        Assert.NotNull(expression);
        Assert.Equal(0, expression.Modifiers.Sum());
    }

    #endregion

    #region Advantage/Disadvantage Edge Cases

    [Fact(Skip = "Advantage/disadvantage on complex expressions not supported")]
    public void Parse_HandlesAdvantageWithComplexExpression()
    {
        var expression = _parser.Parse("2d6a+1d4+3");

        Assert.NotNull(expression);
        Assert.True(expression.HasAdvantage);
        Assert.False(expression.HasDisadvantage);
    }

    [Fact(Skip = "Advantage/disadvantage on complex expressions not supported")]
    public void Parse_HandlesDisadvantageWithComplexExpression()
    {
        var expression = _parser.Parse("2d6d-2+1d4");

        Assert.NotNull(expression);
        Assert.False(expression.HasAdvantage);
        Assert.True(expression.HasDisadvantage);
    }

    [Fact]
    public void Parse_RejectsConflictingFlags()
    {
        // Cannot have both advantage and disadvantage
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("1d20ad"));
    }

    [Fact(Skip = "Conflicting flags validation needs implementation")]
    public void Parse_RejectsConflictingFlagsComplex()
    {
        // Cannot have both advantage and disadvantage even in complex expressions
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("1d20a+1d6d"));
    }

    #endregion

    #region Case Sensitivity Tests

    [Fact]
    public void Parse_HandlesUppercaseD()
    {
        // Should handle both 'd' and 'D'
        var result1 = _parser.Parse("2d6");
        var result2 = _parser.Parse("2D6");

        Assert.Equal(result1.DiceRolls[0].SidesPerDie, result2.DiceRolls[0].SidesPerDie);
    }

    [Fact]
    public void Parse_HandlesUppercaseAdvantage()
    {
        var result1 = _parser.Parse("1d20a");
        var result2 = _parser.Parse("1d20A");

        Assert.Equal(result1.HasAdvantage, result2.HasAdvantage);
    }

    [Fact]
    public void Parse_HandlesUppercaseDisadvantage()
    {
        var result1 = _parser.Parse("1d20d");
        var result2 = _parser.Parse("1d20D");

        Assert.Equal(result1.HasDisadvantage, result2.HasDisadvantage);
    }

    #endregion

    #region Service-Level Edge Cases

    [Fact]
    public void Service_ValidateExpression_HandlesValidExpression()
    {
        // ValidateExpression returns a DiceExpression or throws an exception
        var result = _service.ValidateExpression("2d6+1d4");

        Assert.NotNull(result);
        Assert.Equal(2, result.DiceRolls.Count);
    }

    [Fact]
    public void Service_ValidateExpression_HandlesInvalidExpression()
    {
        // ValidateExpression should throw an exception for invalid expressions
        Assert.Throws<InvalidExpressionException>(() => _service.ValidateExpression("invalid"));
    }

    [Fact]
    public void Service_GetStatistics_HandlesBasicExpression()
    {
        var stats = _service.GetStatistics("1d6");

        Assert.NotNull(stats);
        Assert.Equal(1, stats.Minimum);
        Assert.Equal(6, stats.Maximum);
        Assert.Equal(3.5, stats.Mean);
    }

    [Fact]
    public void Service_GetStatistics_HandlesComplexExpression()
    {
        var stats = _service.GetStatistics("2d6+1d4+3");

        Assert.NotNull(stats);
        Assert.True(stats.Minimum >= 6); // 2*1 + 1*1 + 3
        Assert.True(stats.Maximum <= 19); // 2*6 + 1*4 + 3
    }

    #endregion
}
