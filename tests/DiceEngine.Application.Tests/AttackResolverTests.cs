using DiceEngine.Application.Services;
using DiceEngine.Application.Models;
using DiceEngine.Application.Tests.Fixtures;
using DiceEngine.Domain.Entities;
using Moq;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Tests for AttackResolver service (T030-T032)
/// </summary>
public class AttackResolverTests : IClassFixture<CombatFixture>
{
    private readonly CombatFixture _fixture;
    private readonly Mock<IDiceService> _diceServiceMock;
    private readonly AttackResolver _resolver;

    public AttackResolverTests(CombatFixture fixture)
    {
        _fixture = fixture;
        _diceServiceMock = new Mock<IDiceService>();
        _resolver = new AttackResolver(_diceServiceMock.Object);
    }

    [Fact]
    public void AttackResolver_AttackRoll_HitsWhenMeetsAC()
    {
        // Arrange
        var attacker = _fixture.CreateTestCharacterCombatant();
        var target = _fixture.CreateTestEnemyCombatant(armorClass: 15);

        // Mock dice service to return specific d20 roll
        var rollResult = new RollResult
        {
            Expression = "1d20",
            IndividualRolls = new List<int> { 12 },
            FinalTotal = 12,
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d20"] = new[] { 12 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d20"] = 12
            }
        };
        _diceServiceMock.Setup(s => s.Roll("1d20")).Returns(rollResult);

        int attackModifier = 5; // +5 STR modifier + proficiency

        // Act
        var (roll, total, isHit, isCritical) = _resolver.ResolveAttack(attacker, target, attackModifier);

        // Assert
        Assert.Equal(12, roll); // d20 roll
        Assert.Equal(17, total); // 12 + 5
        Assert.True(isHit); // 17 >= 15 (AC)
        Assert.False(isCritical); // Not a natural 20
    }

    [Fact]
    public void AttackResolver_AttackRoll_MissesWhenBelowAC()
    {
        // Arrange
        var attacker = _fixture.CreateTestCharacterCombatant();
        var target = _fixture.CreateTestEnemyCombatant(armorClass: 18);

        // Mock dice service to return low d20 roll
        var rollResult = new RollResult
        {
            Expression = "1d20",
            IndividualRolls = new List<int> { 8 },
            FinalTotal = 8,
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d20"] = new[] { 8 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d20"] = 8
            }
        };
        _diceServiceMock.Setup(s => s.Roll("1d20")).Returns(rollResult);

        int attackModifier = 3; // +3 modifier

        // Act
        var (roll, total, isHit, isCritical) = _resolver.ResolveAttack(attacker, target, attackModifier);

        // Assert
        Assert.Equal(8, roll);
        Assert.Equal(11, total); // 8 + 3
        Assert.False(isHit); // 11 < 18 (AC)
        Assert.False(isCritical);
    }

    [Fact]
    public void AttackResolver_CriticalHit_Natural20_AlwaysHits()
    {
        // Arrange
        var attacker = _fixture.CreateTestCharacterCombatant();
        var target = _fixture.CreateTestEnemyCombatant(armorClass: 25); // Very high AC

        // Mock dice service to return natural 20
        var rollResult = new RollResult
        {
            Expression = "1d20",
            IndividualRolls = new List<int> { 20 },
            FinalTotal = 20,
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d20"] = new[] { 20 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d20"] = 20
            }
        };
        _diceServiceMock.Setup(s => s.Roll("1d20")).Returns(rollResult);

        int attackModifier = 0; // No modifier

        // Act
        var (roll, total, isHit, isCritical) = _resolver.ResolveAttack(attacker, target, attackModifier);

        // Assert
        Assert.Equal(20, roll);
        Assert.Equal(20, total);
        Assert.True(isHit); // Natural 20 hits regardless of AC
        Assert.True(isCritical); // Natural 20 is critical
    }

    [Fact]
    public void AttackResolver_CriticalMiss_Natural1_AlwaysMisses()
    {
        // Arrange
        var attacker = _fixture.CreateTestCharacterCombatant();
        var target = _fixture.CreateTestEnemyCombatant(armorClass: 10); // Very low AC

        // Mock dice service to return natural 1
        var rollResult = new RollResult
        {
            Expression = "1d20",
            IndividualRolls = new List<int> { 1 },
            FinalTotal = 1,
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d20"] = new[] { 1 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d20"] = 1
            }
        };
        _diceServiceMock.Setup(s => s.Roll("1d20")).Returns(rollResult);

        int attackModifier = 15; // Huge modifier

        // Act
        var (roll, total, isHit, isCritical) = _resolver.ResolveAttack(attacker, target, attackModifier);

        // Assert
        Assert.Equal(1, roll);
        Assert.Equal(16, total); // 1 + 15
        Assert.False(isHit); // Natural 1 always misses
        Assert.False(isCritical);
    }

    [Fact]
    public void AttackResolver_ExactlyMeetsAC_Hits()
    {
        // Arrange
        var attacker = _fixture.CreateTestCharacterCombatant();
        var target = _fixture.CreateTestEnemyCombatant(armorClass: 15);

        // Mock dice service to return roll that exactly meets AC
        var rollResult = new RollResult
        {
            Expression = "1d20",
            IndividualRolls = new List<int> { 12 },
            FinalTotal = 12,
            RollsByGroup = new Dictionary<string, int[]>
            {
                ["1d20"] = new[] { 12 }
            },
            SubtotalsByGroup = new Dictionary<string, int>
            {
                ["1d20"] = 12
            }
        };
        _diceServiceMock.Setup(s => s.Roll("1d20")).Returns(rollResult);

        int attackModifier = 3; // 12 + 3 = 15, exactly AC

        // Act
        var (roll, total, isHit, isCritical) = _resolver.ResolveAttack(attacker, target, attackModifier);

        // Assert
        Assert.Equal(15, total);
        Assert.True(isHit); // Meeting AC is a hit
    }

    [Fact]
    public void AttackResolver_TargetDefeated_ThrowsException()
    {
        // Arrange
        var attacker = _fixture.CreateTestCharacterCombatant();
        var target = _fixture.CreateTestEnemyCombatant();
        target.TakeDamage(target.CurrentHealth); // Defeat the target

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() =>
            _resolver.ResolveAttack(attacker, target, 5));

        Assert.Contains("defeated", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void AttackResolver_TargetFled_ThrowsException()
    {
        // Arrange
        var attacker = _fixture.CreateTestCharacterCombatant();
        var target = _fixture.CreateTestEnemyCombatant();
        target.MarkFled(); // Mark as fled

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() =>
            _resolver.ResolveAttack(attacker, target, 5));

        Assert.Contains("fled", exception.Message, StringComparison.OrdinalIgnoreCase);
    }
}
