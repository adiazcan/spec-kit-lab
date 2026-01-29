using DiceEngine.Application.Services;
using DiceEngine.Application.Models;
using Moq;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Tests for DamageCalculator service (T033)
/// </summary>
public class DamageCalculatorTests
{
    private readonly Mock<IDiceService> _diceServiceMock;
    private readonly DamageCalculator _calculator;

    public DamageCalculatorTests()
    {
        _diceServiceMock = new Mock<IDiceService>();
        _calculator = new DamageCalculator(_diceServiceMock.Object);
    }

    [Fact]
    public void DamageCalculator_CalculateDamage_UsesWeaponDice()
    {
        // Arrange - Standard longsword damage 1d8+3
        var rollResult = new RollResult
        {
            Expression = "1d8+3",
            IndividualRolls = new List<int> { 6 },
            FinalTotal = 9, // 6 + 3
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d8"] = new[] { 6 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d8"] = 6
            },
            TotalModifier = 3
        };
        _diceServiceMock.Setup(s => s.Roll("1d8+3")).Returns(rollResult);

        // Act
        var damage = _calculator.CalculateDamage("1d8+3", damageModifier: 0, isCriticalHit: false);

        // Assert
        Assert.Equal(9, damage);
        _diceServiceMock.Verify(s => s.Roll("1d8+3"), Times.Once);
    }

    [Fact]
    public void DamageCalculator_CriticalHit_DoublesDamageDice()
    {
        // Arrange - Critical hit: 1d8 becomes 2d8
        var normalRoll = new RollResult
        {
            Expression = "2d8+3",
            IndividualRolls = new List<int> { 7, 5 },
            FinalTotal = 15, // 7 + 5 + 3
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["2d8"] = new[] { 7, 5 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["2d8"] = 12
            },
            TotalModifier = 3
        };
        _diceServiceMock.Setup(s => s.Roll("2d8+3")).Returns(normalRoll);

        // Act - Critical hit with 1d8 weapon
        var damage = _calculator.CalculateDamage("1d8+3", damageModifier: 0, isCriticalHit: true);

        // Assert
        Assert.Equal(15, damage);
        _diceServiceMock.Verify(s => s.Roll("2d8+3"), Times.Once); // Dice doubled
    }

    [Fact]
    public void DamageCalculator_CalculateDamage_WithAdditionalModifier()
    {
        // Arrange
        var rollResult = new RollResult
        {
            Expression = "1d6+5", // 1d6+2 (base) +3 (additional modifier)
            IndividualRolls = new List<int> { 4 },
            FinalTotal = 9, // 4 + 5
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d6"] = new[] { 4 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d6"] = 4
            },
            TotalModifier = 5
        };
        _diceServiceMock.Setup(s => s.Roll("1d6+5")).Returns(rollResult);

        // Act
        var damage = _calculator.CalculateDamage("1d6+2", damageModifier: 3, isCriticalHit: false);

        // Assert
        Assert.Equal(9, damage);
        _diceServiceMock.Verify(s => s.Roll("1d6+5"), Times.Once);
    }

    [Fact]
    public void DamageCalculator_ParseDamageExpression_Simple()
    {
        // Act
        var (numDice, diceSize, modifier) = _calculator.ParseDamageExpression("1d8");

        // Assert
        Assert.Equal(1, numDice);
        Assert.Equal(8, diceSize);
        Assert.Equal(0, modifier);
    }

    [Fact]
    public void DamageCalculator_ParseDamageExpression_WithPositiveModifier()
    {
        // Act
        var (numDice, diceSize, modifier) = _calculator.ParseDamageExpression("2d6+3");

        // Assert
        Assert.Equal(2, numDice);
        Assert.Equal(6, diceSize);
        Assert.Equal(3, modifier);
    }

    [Fact]
    public void DamageCalculator_ParseDamageExpression_WithNegativeModifier()
    {
        // Act
        var (numDice, diceSize, modifier) = _calculator.ParseDamageExpression("1d4-1");

        // Assert
        Assert.Equal(1, numDice);
        Assert.Equal(4, diceSize);
        Assert.Equal(-1, modifier);
    }

    [Fact]
    public void DamageCalculator_ParseDamageExpression_MultipleDice()
    {
        // Act
        var (numDice, diceSize, modifier) = _calculator.ParseDamageExpression("3d10+5");

        // Assert
        Assert.Equal(3, numDice);
        Assert.Equal(10, diceSize);
        Assert.Equal(5, modifier);
    }

    [Fact]
    public void DamageCalculator_ParseDamageExpression_InvalidFormat_ThrowsException()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            _calculator.ParseDamageExpression("invalid"));

        Assert.Contains("invalid", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DamageCalculator_ParseDamageExpression_EmptyString_ThrowsException()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            _calculator.ParseDamageExpression(""));

        Assert.Contains("empty", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DamageCalculator_CalculateDamage_MinimumDamageIsOne()
    {
        // Arrange - Mock very low damage roll
        var rollResult = new RollResult
        {
            Expression = "1d4-3",
            IndividualRolls = new List<int> { 1 },
            FinalTotal = -2, // 1 - 3 = -2
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d4"] = new[] { 1 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d4"] = 1
            },
            TotalModifier = -3
        };
        _diceServiceMock.Setup(s => s.Roll("1d4-3")).Returns(rollResult);

        // Act
        var damage = _calculator.CalculateDamage("1d4-3", damageModifier: 0, isCriticalHit: false);

        // Assert
        Assert.Equal(1, damage); // Minimum damage is 1
    }

    [Fact]
    public void DamageCalculator_GreatswordDamage_CalculatesCorrectly()
    {
        // Arrange - Greatsword: 2d6+4
        var rollResult = new RollResult
        {
            Expression = "2d6+4",
            IndividualRolls = new List<int> { 5, 3 },
            FinalTotal = 12, // 5 + 3 + 4
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["2d6"] = new[] { 5, 3 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["2d6"] = 8
            },
            TotalModifier = 4
        };
        _diceServiceMock.Setup(s => s.Roll("2d6+4")).Returns(rollResult);

        // Act
        var damage = _calculator.CalculateDamage("2d6+4", damageModifier: 0, isCriticalHit: false);

        // Assert
        Assert.Equal(12, damage);
    }

    [Fact]
    public void DamageCalculator_CriticalGreatsword_DoublesDice()
    {
        // Arrange - Critical Greatsword: 2d6 becomes 4d6
        var rollResult = new RollResult
        {
            Expression = "4d6+4",
            IndividualRolls = new List<int> { 6, 5, 4, 3 },
            FinalTotal = 22, // 6 + 5 + 4 + 3 + 4
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["4d6"] = new[] { 6, 5, 4, 3 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["4d6"] = 18
            },
            TotalModifier = 4
        };
        _diceServiceMock.Setup(s => s.Roll("4d6+4")).Returns(rollResult);

        // Act
        var damage = _calculator.CalculateDamage("2d6+4", damageModifier: 0, isCriticalHit: true);

        // Assert
        Assert.Equal(22, damage);
        _diceServiceMock.Verify(s => s.Roll("4d6+4"), Times.Once); // 2d6 doubled to 4d6
    }
}
