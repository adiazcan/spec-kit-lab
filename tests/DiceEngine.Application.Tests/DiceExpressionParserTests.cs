using DiceEngine.Application.Exceptions;
using DiceEngine.Application.Services;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Tests;

public class DiceExpressionParserTests
{
    private readonly DiceExpressionParser _parser = new();

    [Theory]
    [InlineData("2d6", 2, 6, 0)]
    [InlineData("1d20+5", 1, 20, 5)]
    [InlineData("3d8-2", 3, 8, -2)]
    public void Parse_ValidNotation_ReturnsDiceExpression(string input, int expectedDice, int expectedSides, int expectedModifier)
    {
        var expression = _parser.Parse(input);

        var roll = Assert.Single(expression.DiceRolls);
        Assert.Equal(expectedDice, roll.NumberOfDice);
        Assert.Equal(expectedSides, roll.SidesPerDie);
        Assert.Equal(expectedModifier, roll.Modifier);
        Assert.Equal(input, expression.OriginalExpression);
        Assert.False(expression.HasAdvantage);
        Assert.False(expression.HasDisadvantage);
        Assert.Equal(expectedModifier, expression.TotalModifier);
    }

    [Theory]
    [InlineData("2x6")]
    [InlineData("d20")]
    public void Parse_InvalidNotation_ThrowsInvalidExpression(string input)
    {
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse(input));
    }

    [Fact]
    public void Parse_ZeroDice_ThrowsValidationException()
    {
        Assert.Throws<ValidationException>(() => _parser.Parse("0d6"));
    }

    // User Story 2: Complex Expression Parsing Tests (T059-T063)

    [Fact]
    public void Parse_ComplexExpression_2d6Plus1d4Plus3_ReturnsMultipleDiceGroups()
    {
        // T059: Parse "2d6+1d4+3" with multiple dice groups
        var expression = _parser.Parse("2d6+1d4+3");

        Assert.Equal("2d6+1d4+3", expression.OriginalExpression);
        Assert.Equal(2, expression.DiceRolls.Count);

        var firstRoll = expression.DiceRolls[0];
        Assert.Equal(2, firstRoll.NumberOfDice);
        Assert.Equal(6, firstRoll.SidesPerDie);
        Assert.Equal(0, firstRoll.Modifier);

        var secondRoll = expression.DiceRolls[1];
        Assert.Equal(1, secondRoll.NumberOfDice);
        Assert.Equal(4, secondRoll.SidesPerDie);
        Assert.Equal(0, secondRoll.Modifier);

        Assert.Single(expression.Modifiers);
        Assert.Equal(3, expression.Modifiers[0]);
        Assert.Equal(3, expression.TotalModifier);
    }

    [Fact]
    public void Parse_ComplexExpression_1d8Plus2d6Plus5_ReturnsMultipleDiceGroups()
    {
        // T060: Parse "1d8+2d6+5" with multiple dice groups
        var expression = _parser.Parse("1d8+2d6+5");

        Assert.Equal("1d8+2d6+5", expression.OriginalExpression);
        Assert.Equal(2, expression.DiceRolls.Count);

        var firstRoll = expression.DiceRolls[0];
        Assert.Equal(1, firstRoll.NumberOfDice);
        Assert.Equal(8, firstRoll.SidesPerDie);

        var secondRoll = expression.DiceRolls[1];
        Assert.Equal(2, secondRoll.NumberOfDice);
        Assert.Equal(6, secondRoll.SidesPerDie);

        Assert.Single(expression.Modifiers);
        Assert.Equal(5, expression.Modifiers[0]);
    }

    [Fact]
    public void Parse_ComplexExpression_1d10Plus1d6Minus2_HandlesNegativeModifier()
    {
        // T061: Parse "1d10+1d6-2" with left-to-right evaluation
        var expression = _parser.Parse("1d10+1d6-2");

        Assert.Equal("1d10+1d6-2", expression.OriginalExpression);
        Assert.Equal(2, expression.DiceRolls.Count);

        var firstRoll = expression.DiceRolls[0];
        Assert.Equal(1, firstRoll.NumberOfDice);
        Assert.Equal(10, firstRoll.SidesPerDie);

        var secondRoll = expression.DiceRolls[1];
        Assert.Equal(1, secondRoll.NumberOfDice);
        Assert.Equal(6, secondRoll.SidesPerDie);

        Assert.Single(expression.Modifiers);
        Assert.Equal(-2, expression.Modifiers[0]);
        Assert.Equal(-2, expression.TotalModifier);
    }

    [Fact]
    public void Parse_InvalidComplexExpression_DoubleOperator_ThrowsInvalidExpressionException()
    {
        // T062: Reject "2d6++1d4" (double operator)
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("2d6++1d4"));
    }

    [Fact]
    public void Parse_InvalidComplexExpression_TrailingOperator_ThrowsInvalidExpressionException()
    {
        // T063: Reject "d6+" (trailing operator)
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("d6+"));
    }

    // User Story 3: Advantage/Disadvantage Tests (T077-T079)

    [Fact]
    public void Parse_ExpressionWithAdvantageFlag_SetsHasAdvantageTrue()
    {
        // T077: Parse "1d20a" and verify advantage flag is set
        var expression = _parser.Parse("1d20a");

        Assert.Equal("1d20a", expression.OriginalExpression);
        Assert.True(expression.HasAdvantage);
        Assert.False(expression.HasDisadvantage);

        var roll = Assert.Single(expression.DiceRolls);
        Assert.Equal(1, roll.NumberOfDice);
        Assert.Equal(20, roll.SidesPerDie);
    }

    [Fact]
    public void Parse_ExpressionWithDisadvantageFlag_SetsHasDisadvantageTrue()
    {
        // T078: Parse "1d20d" and verify disadvantage flag is set
        var expression = _parser.Parse("1d20d");

        Assert.Equal("1d20d", expression.OriginalExpression);
        Assert.False(expression.HasAdvantage);
        Assert.True(expression.HasDisadvantage);

        var roll = Assert.Single(expression.DiceRolls);
        Assert.Equal(1, roll.NumberOfDice);
        Assert.Equal(20, roll.SidesPerDie);
    }

    [Fact]
    public void Parse_ExpressionWithBothAdvantageAndDisadvantageFlags_ThrowsInvalidExpressionException()
    {
        // T079: Reject "1d20ad" (conflicting flags)
        Assert.Throws<InvalidExpressionException>(() => _parser.Parse("1d20ad"));
    }
}
