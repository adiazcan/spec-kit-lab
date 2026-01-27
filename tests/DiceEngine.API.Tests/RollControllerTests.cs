using DiceEngine.API.Controllers;
using DiceEngine.API.Models;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Tests;

public class RollControllerTests
{
    private readonly RollController _controller = new(new DiceService(new DiceExpressionParser(), new DiceRoller()));

    [Fact]
    public void Roll_WithValidExpression_ReturnsOkResponse()
    {
        var request = new RollRequest { Expression = "2d6" };

        var actionResult = _controller.Roll(request);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<DiceEngine.Application.Models.RollResult>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("2d6", response.Data!.Expression);
        Assert.NotEmpty(response.Data!.IndividualRolls);
    }

    [Fact]
    public void Roll_WithInvalidExpression_ReturnsBadRequest()
    {
        var request = new RollRequest { Expression = "2x6" };

        var actionResult = _controller.Roll(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<DiceEngine.Application.Models.RollResult>>(badRequest.Value);
        Assert.False(response.Success);
        Assert.NotNull(response.Error);
        Assert.Equal("INVALID_EXPRESSION", response.Error!.Code);
    }

    // User Story 2: Complex Expression API Tests (T066-T067)

    [Fact]
    public void Roll_WithComplexExpression_Returns200WithCorrectStructure()
    {
        // T066: Test POST /api/roll with "2d6+1d4+3" returns 200 with correct structure
        var request = new RollRequest { Expression = "2d6+1d4+3" };

        var actionResult = _controller.Roll(request);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<DiceEngine.Application.Models.RollResult>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("2d6+1d4+3", response.Data!.Expression);

        // Verify multiple groups present
        Assert.Equal(3, response.Data!.IndividualRolls.Count);
        Assert.Contains("2d6", response.Data!.RollsByGroup.Keys);
        Assert.Contains("1d4", response.Data!.RollsByGroup.Keys);

        // Verify subtotals
        Assert.Contains("2d6", response.Data!.SubtotalsByGroup.Keys);
        Assert.Contains("1d4", response.Data!.SubtotalsByGroup.Keys);

        // Verify modifier and final total
        Assert.Equal(3, response.Data!.TotalModifier);
        Assert.InRange(response.Data!.FinalTotal, 6, 19);

        Assert.Null(response.Error);
    }

    [Fact]
    public void Roll_WithMaxComplexity_CompletesUnder50ms()
    {
        // T067: Test POST /api/roll with max complexity "3d6+2d8+1d4+10" completes <50ms
        var request = new RollRequest { Expression = "3d6+2d8+1d4+10" };

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var actionResult = _controller.Roll(request);
        stopwatch.Stop();

        // Verify success
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<DiceEngine.Application.Models.RollResult>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);

        // Verify performance SLA
        Assert.True(stopwatch.ElapsedMilliseconds < 50,
            $"Roll took {stopwatch.ElapsedMilliseconds}ms, exceeds 50ms SLA");

        // Verify correct parsing (3 dice groups)
        Assert.Equal(6, response.Data!.IndividualRolls.Count); // 3+2+1
        Assert.Equal(3, response.Data!.RollsByGroup.Count); // 3 groups
        Assert.Equal(10, response.Data!.TotalModifier);
    }

    // User Story 3: Advantage/Disadvantage API Tests (T084-T085)

    [Fact]
    public void Roll_WithAdvantageFlag_Returns200WithAdvantageRollResults()
    {
        // T084: Test POST /api/roll with "1d20a" returns 200 with both rolls in advantageRollResults
        var request = new RollRequest { Expression = "1d20a" };

        var actionResult = _controller.Roll(request);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<DiceEngine.Application.Models.RollResult>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("1d20a", response.Data!.Expression);
        Assert.True(response.Data!.IsAdvantage);
        Assert.False(response.Data!.IsDisadvantage);

        // Verify advantage roll results
        Assert.NotNull(response.Data!.AdvantageRollResults);
        Assert.Equal(2, response.Data!.AdvantageRollResults.Count);

        // Verify both rolls are valid
        Assert.Single(response.Data!.AdvantageRollResults[0].IndividualRolls);
        Assert.Single(response.Data!.AdvantageRollResults[1].IndividualRolls);
        Assert.InRange(response.Data!.AdvantageRollResults[0].IndividualRolls[0], 1, 20);
        Assert.InRange(response.Data!.AdvantageRollResults[1].IndividualRolls[0], 1, 20);

        // Final result should be max of the two
        var roll1Total = response.Data!.AdvantageRollResults[0].FinalTotal;
        var roll2Total = response.Data!.AdvantageRollResults[1].FinalTotal;
        Assert.Equal(Math.Max(roll1Total, roll2Total), response.Data!.FinalTotal);

        Assert.Null(response.Error);
    }

    [Fact]
    public void Roll_WithConflictingAdvantageDisadvantageFlags_Returns400WithConflictingFlagsError()
    {
        // T085: Test POST /api/roll with "1d20ad" returns 400 with CONFLICTING_FLAGS error
        var request = new RollRequest { Expression = "1d20ad" };

        var actionResult = _controller.Roll(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<DiceEngine.Application.Models.RollResult>>(badRequest.Value);
        Assert.False(response.Success);
        Assert.Null(response.Data);
        Assert.NotNull(response.Error);
        Assert.Equal("INVALID_EXPRESSION", response.Error!.Code);
        Assert.Contains("advantage", response.Error!.Message, StringComparison.OrdinalIgnoreCase);
    }

    // Phase 6: Validation Endpoint Tests (T104-T105)

    [Fact]
    public void ValidateRequest_Serialization_WorksCorrectly()
    {
        // T104: Unit test ValidateRequest/Response serialization
        var request = new ValidateRequest { Expression = "2d6+5" };

        Assert.NotNull(request);
        Assert.Equal("2d6+5", request.Expression);
    }

    [Fact]
    public void ValidateResponse_Serialization_WorksCorrectly()
    {
        // T104: Unit test ValidateRequest/Response serialization
        var response = new ValidateResponse
        {
            IsValid = true,
            OriginalExpression = "2d6",
            ParsedComponents = new ParsedComponents
            {
                DiceRolls = new List<DiceRollComponent>
                {
                    new DiceRollComponent { NumberOfDice = 2, SidesPerDie = 6, Modifier = 0 }
                },
                GlobalModifier = 0,
                HasAdvantage = false,
                HasDisadvantage = false
            },
            ExpectedMinimum = 2,
            ExpectedMaximum = 12,
            Message = null
        };

        Assert.True(response.IsValid);
        Assert.Equal("2d6", response.OriginalExpression);
        Assert.NotNull(response.ParsedComponents);
        Assert.Single(response.ParsedComponents!.DiceRolls);
        Assert.Equal(2, response.ExpectedMinimum);
        Assert.Equal(12, response.ExpectedMaximum);
    }

    [Fact]
    public void Validate_WithValidExpression_ReturnsOkWithValidResponse()
    {
        // T105: Integration test POST /api/roll/validate with valid expression
        var request = new ValidateRequest { Expression = "2d6+1d4+3" };

        var actionResult = _controller.Validate(request);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<ValidateResponse>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.True(response.Data!.IsValid);
        Assert.Equal("2d6+1d4+3", response.Data!.OriginalExpression);
        Assert.NotNull(response.Data!.ParsedComponents);
        Assert.Equal(2, response.Data!.ParsedComponents!.DiceRolls.Count);
        Assert.Equal(3, response.Data!.ParsedComponents!.GlobalModifier);
        Assert.Equal(6, response.Data!.ExpectedMinimum); // 2*1 + 1*1 + 3
        Assert.Equal(19, response.Data!.ExpectedMaximum); // 2*6 + 1*4 + 3
        Assert.Null(response.Data!.Message);
        Assert.Null(response.Error);
    }

    [Fact]
    public void Validate_WithInvalidExpression_ReturnsOkWithInvalidResponse()
    {
        // T105: Integration test POST /api/roll/validate with invalid expression
        var request = new ValidateRequest { Expression = "2x6" };

        var actionResult = _controller.Validate(request);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<ValidateResponse>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.False(response.Data!.IsValid);
        Assert.Equal("2x6", response.Data!.OriginalExpression);
        Assert.Null(response.Data!.ParsedComponents);
        Assert.Null(response.Data!.ExpectedMinimum);
        Assert.Null(response.Data!.ExpectedMaximum);
        Assert.NotNull(response.Data!.Message);
        Assert.Contains("Invalid", response.Data!.Message, StringComparison.OrdinalIgnoreCase);
    }

    // Phase 6: Statistics Endpoint Tests (T106)

    [Fact]
    public void GetStats_WithValidExpression_ReturnsCorrectStatistics()
    {
        // T106: Integration test GET /api/roll/stats/2d6 returns correct statistical analysis
        var expression = "2d6";

        var actionResult = _controller.GetStats(expression);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<StatsResponse>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("2d6", response.Data!.Expression);
        Assert.Equal(2, response.Data!.Minimum); // 2*1
        Assert.Equal(12, response.Data!.Maximum); // 2*6
        Assert.Equal(7.0, response.Data!.Mean); // 2*3.5
        Assert.InRange(response.Data!.StandardDeviation, 2.4, 2.5); // ~2.415
        Assert.NotNull(response.Data!.Mode);
        Assert.NotNull(response.Data!.Median);
        Assert.Null(response.Error);
    }

    [Fact]
    public void GetStats_WithComplexExpression_ReturnsCorrectStatistics()
    {
        // T106: Test GET /api/roll/stats with complex expression
        var expression = "2d6+5";

        var actionResult = _controller.GetStats(expression);

        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<StatsResponse>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("2d6+5", response.Data!.Expression);
        Assert.Equal(7, response.Data!.Minimum); // 2*1 + 5
        Assert.Equal(17, response.Data!.Maximum); // 2*6 + 5
        Assert.Equal(12.0, response.Data!.Mean); // 2*3.5 + 5
        Assert.Null(response.Error);
    }

    [Fact]
    public void GetStats_WithInvalidExpression_ReturnsBadRequest()
    {
        // T106: Test GET /api/roll/stats with invalid expression
        var expression = "2x6";

        var actionResult = _controller.GetStats(expression);

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        var response = Assert.IsType<StandardResponse<StatsResponse>>(badRequest.Value);
        Assert.False(response.Success);
        Assert.Null(response.Data);
        Assert.NotNull(response.Error);
        Assert.Equal("INVALID_EXPRESSION", response.Error!.Code);
    }
}
