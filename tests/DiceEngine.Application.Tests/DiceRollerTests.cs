using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Tests;

public class DiceRollerTests
{
    private readonly DiceRoller _roller = new();

    [Fact]
    public void Roll_Basic2d6_ProducesTwoRollsWithinRange()
    {
        var expression = new DiceExpression("2d6", new[] { new DiceRoll(2, 6) });

        var result = _roller.Roll(expression);

        Assert.Equal("2d6", result.Expression);
        Assert.Equal(2, result.IndividualRolls.Count);
        Assert.All(result.IndividualRolls, roll => Assert.InRange(roll, 1, 6));
        Assert.True(result.FinalTotal >= 2 && result.FinalTotal <= 12);
        var groupRolls = Assert.Contains("2d6", result.RollsByGroup);
        Assert.Equal(2, groupRolls.Length);
        Assert.Equal(result.IndividualRolls, groupRolls);
        Assert.Equal(result.SubtotalsByGroup["2d6"], groupRolls.Sum());
        Assert.Equal(0, result.TotalModifier);
        Assert.False(result.IsAdvantage);
        Assert.False(result.IsDisadvantage);
    }

    [Fact]
    public void Roll_AppliesModifierToTotal()
    {
        var expression = new DiceExpression("1d4+3", new[] { new DiceRoll(1, 4, 3) });

        var result = _roller.Roll(expression);

        Assert.Single(result.IndividualRolls);
        Assert.InRange(result.IndividualRolls[0], 1, 4);
        Assert.Equal(3, result.TotalModifier);
        Assert.Equal(result.SubtotalsByGroup["1d4"] + 3, result.FinalTotal);
    }

    // User Story 2: Complex Expression Tests (T064)

    [Fact]
    public void Roll_MultipleGroups_ProducesCorrectSubtotalsAndFinalTotal()
    {
        // T064: Roll multiple groups and sum correctly
        var diceRolls = new[]
        {
            new DiceRoll(2, 6),  // 2d6
            new DiceRoll(1, 4)   // 1d4
        };
        var modifiers = new[] { 3 };  // +3
        var expression = new DiceExpression("2d6+1d4+3", diceRolls, modifiers);

        var result = _roller.Roll(expression);

        // Should have 3 individual rolls total (2 from 2d6, 1 from 1d4)
        Assert.Equal(3, result.IndividualRolls.Count);

        // Check rolls by group
        var group1Rolls = Assert.Contains("2d6", result.RollsByGroup);
        Assert.Equal(2, group1Rolls.Length);
        Assert.All(group1Rolls, roll => Assert.InRange(roll, 1, 6));

        var group2Rolls = Assert.Contains("1d4", result.RollsByGroup);
        Assert.Single(group2Rolls);
        Assert.All(group2Rolls, roll => Assert.InRange(roll, 1, 4));

        // Check subtotals
        var subtotal1 = Assert.Contains("2d6", result.SubtotalsByGroup);
        Assert.Equal(group1Rolls.Sum(), subtotal1);

        var subtotal2 = Assert.Contains("1d4", result.SubtotalsByGroup);
        Assert.Equal(group2Rolls.Sum(), subtotal2);

        // Check final total
        Assert.Equal(3, result.TotalModifier);
        Assert.Equal(subtotal1 + subtotal2 + 3, result.FinalTotal);

        // Verify bounds
        Assert.InRange(result.FinalTotal, 6, 19); // min: 2+1+3=6, max: 12+4+3=19
    }

    // User Story 3: Advantage/Disadvantage Tests (T080-T082)

    [Fact]
    public void Roll_WithAdvantage_RollsTwiceAndSelectsHigher()
    {
        // T080: Advantage roll should return 2 rolls and select the higher one
        var expression = new DiceExpression("1d20a", new[] { new DiceRoll(1, 20) }, hasAdvantage: true);

        var result = _roller.Roll(expression);

        Assert.True(result.IsAdvantage);
        Assert.False(result.IsDisadvantage);
        Assert.NotNull(result.AdvantageRollResults);
        Assert.Equal(2, result.AdvantageRollResults.Count);

        // Both advantage rolls should have exactly 1 roll each
        Assert.Single(result.AdvantageRollResults[0].IndividualRolls);
        Assert.Single(result.AdvantageRollResults[1].IndividualRolls);

        // All rolls should be in valid range
        Assert.InRange(result.AdvantageRollResults[0].IndividualRolls[0], 1, 20);
        Assert.InRange(result.AdvantageRollResults[1].IndividualRolls[0], 1, 20);

        // Final result should be the higher of the two advantage rolls
        var roll1Total = result.AdvantageRollResults[0].FinalTotal;
        var roll2Total = result.AdvantageRollResults[1].FinalTotal;
        var expectedTotal = Math.Max(roll1Total, roll2Total);
        Assert.Equal(expectedTotal, result.FinalTotal);
    }

    [Fact]
    public void Roll_WithDisadvantage_RollsTwiceAndSelectsLower()
    {
        // T081: Disadvantage roll should return 2 rolls and select the lower one
        var expression = new DiceExpression("1d20d", new[] { new DiceRoll(1, 20) }, hasDisadvantage: true);

        var result = _roller.Roll(expression);

        Assert.False(result.IsAdvantage);
        Assert.True(result.IsDisadvantage);
        Assert.NotNull(result.AdvantageRollResults);
        Assert.Equal(2, result.AdvantageRollResults.Count);

        // Both disadvantage rolls should have exactly 1 roll each
        Assert.Single(result.AdvantageRollResults[0].IndividualRolls);
        Assert.Single(result.AdvantageRollResults[1].IndividualRolls);

        // All rolls should be in valid range
        Assert.InRange(result.AdvantageRollResults[0].IndividualRolls[0], 1, 20);
        Assert.InRange(result.AdvantageRollResults[1].IndividualRolls[0], 1, 20);

        // Final result should be the lower of the two disadvantage rolls
        var roll1Total = result.AdvantageRollResults[0].FinalTotal;
        var roll2Total = result.AdvantageRollResults[1].FinalTotal;
        var expectedTotal = Math.Min(roll1Total, roll2Total);
        Assert.Equal(expectedTotal, result.FinalTotal);
    }

    [Fact]
    public void Roll_AdvantageWithModifier_AppliesModifierAfterSelection()
    {
        // T082: "2d6+3" with advantage - advantage applies to 2d6, then +3 modifier
        var expression = new DiceExpression("2d6+3a", new[] { new DiceRoll(2, 6, 3) }, hasAdvantage: true);

        var result = _roller.Roll(expression);

        Assert.True(result.IsAdvantage);
        Assert.Equal(3, result.TotalModifier);
        Assert.NotNull(result.AdvantageRollResults);
        Assert.Equal(2, result.AdvantageRollResults.Count);

        // Each advantage roll should have 2 dice
        Assert.Equal(2, result.AdvantageRollResults[0].IndividualRolls.Count);
        Assert.Equal(2, result.AdvantageRollResults[1].IndividualRolls.Count);

        // Final result should be max of the two rolls (including modifier)
        var roll1Total = result.AdvantageRollResults[0].FinalTotal;
        var roll2Total = result.AdvantageRollResults[1].FinalTotal;
        var expectedTotal = Math.Max(roll1Total, roll2Total);
        Assert.Equal(expectedTotal, result.FinalTotal);

        // Verify both rolls include the modifier
        Assert.Equal(3, result.AdvantageRollResults[0].TotalModifier);
        Assert.Equal(3, result.AdvantageRollResults[1].TotalModifier);

        // Verify bounds: min = 2+3=5, max = 12+3=15
        Assert.InRange(result.FinalTotal, 5, 15);
    }
}
