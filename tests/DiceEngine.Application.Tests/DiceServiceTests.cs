using DiceEngine.Application.Services;

namespace DiceEngine.Application.Tests;

public class DiceServiceTests
{
    [Fact]
    public void Roll_ReturnsResultWithIndividualRolls()
    {
        var service = new DiceService(new DiceExpressionParser(), new DiceRoller());

        var result = service.Roll("2d6");

        Assert.NotNull(result);
        Assert.Equal("2d6", result.Expression);
        Assert.True(result.IndividualRolls.Count > 0);
        Assert.Equal(result.SubtotalsByGroup["2d6"], result.IndividualRolls.Sum());
    }

    // User Story 2: Complex Expression Tests (T065)

    [Fact]
    public void Roll_ComplexExpression_ReturnsMultipleRollGroups()
    {
        // T065: Test DiceService.Roll("2d6+1d4+3") returns RollResult with multiple roll groups
        var service = new DiceService(new DiceExpressionParser(), new DiceRoller());

        var result = service.Roll("2d6+1d4+3");

        Assert.NotNull(result);
        Assert.Equal("2d6+1d4+3", result.Expression);
        Assert.Equal(3, result.IndividualRolls.Count); // 2 from 2d6, 1 from 1d4

        // Verify groups are present
        Assert.Contains("2d6", result.RollsByGroup.Keys);
        Assert.Contains("1d4", result.RollsByGroup.Keys);

        // Verify subtotals
        Assert.Contains("2d6", result.SubtotalsByGroup.Keys);
        Assert.Contains("1d4", result.SubtotalsByGroup.Keys);

        // Verify modifier applied
        Assert.Equal(3, result.TotalModifier);

        // Verify final total is sum of all components
        var expectedTotal = result.SubtotalsByGroup["2d6"] + result.SubtotalsByGroup["1d4"] + 3;
        Assert.Equal(expectedTotal, result.FinalTotal);

        // Verify bounds
        Assert.InRange(result.FinalTotal, 6, 19); // min: 2+1+3=6, max: 12+4+3=19
    }

    // User Story 3: Advantage/Disadvantage Tests (T083)

    [Fact]
    public void Roll_WithAdvantageFlag_ReturnsRollResultWithAdvantageRollResults()
    {
        // T083: Test DiceService.Roll("1d20a") returns RollResult with advantageRollResults array
        var service = new DiceService(new DiceExpressionParser(), new DiceRoller());

        var result = service.Roll("1d20a");

        Assert.NotNull(result);
        Assert.Equal("1d20a", result.Expression);
        Assert.True(result.IsAdvantage);
        Assert.False(result.IsDisadvantage);

        // Verify advantage roll results are populated
        Assert.NotNull(result.AdvantageRollResults);
        Assert.Equal(2, result.AdvantageRollResults.Count);

        // Both rolls should have valid results
        Assert.Single(result.AdvantageRollResults[0].IndividualRolls);
        Assert.Single(result.AdvantageRollResults[1].IndividualRolls);
        Assert.InRange(result.AdvantageRollResults[0].IndividualRolls[0], 1, 20);
        Assert.InRange(result.AdvantageRollResults[1].IndividualRolls[0], 1, 20);

        // Final result should be the higher of the two
        var roll1Total = result.AdvantageRollResults[0].FinalTotal;
        var roll2Total = result.AdvantageRollResults[1].FinalTotal;
        Assert.Equal(Math.Max(roll1Total, roll2Total), result.FinalTotal);
    }
}
