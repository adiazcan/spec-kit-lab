using DiceEngine.Domain.Entities;
using Xunit;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Unit tests for Enemy entity and AI behavior (T077-T080)
/// Testing Phase 5: Intelligent Enemy AI Behavior (US3)
/// </summary>
public class EnemyTests
{
    /// <summary>
    /// T077: Verify Enemy can be created with valid input
    /// </summary>
    [Fact]
    public void Enemy_Create_ValidInput_ReturnsSuccess()
    {
        // Arrange
        var name = "Goblin Warrior";
        var str = 10;
        var dex = 14;  // DEX modifier = +2
        var intel = 8;
        var con = 13;  // CON modifier = +1
        var cha = 9;
        var maxHealth = 22;
        var armorClass = 15;
        var weaponInfo = "Scimitar|1d6+2";

        // Act
        var result = Enemy.Create(
            name: name,
            strBase: str,
            dexBase: dex,
            intBase: intel,
            conBase: con,
            chaBase: cha,
            maxHealth: maxHealth,
            armorClass: armorClass,
            weaponInfo: weaponInfo);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(name, result.Name);
        Assert.Equal(maxHealth, result.MaxHealth);
        Assert.Equal(maxHealth, result.CurrentHealth);
        Assert.Equal(armorClass, result.ArmorClass);
        Assert.Equal(AIState.Aggressive, result.CurrentAIState); // Default state
    }

    /// <summary>
    /// T078: Verify AI state transitions to Aggressive when health > 50%
    /// </summary>
    [Fact]
    public void Enemy_EvaluateAIState_HighHealth_Aggressive()
    {
        // Arrange
        var enemy = Enemy.Create(
            name: "Goblin",
            strBase: 10,
            dexBase: 14,
            intBase: 8,
            conBase: 13,
            chaBase: 9,
            maxHealth: 100,
            armorClass: 15,
            weaponInfo: "Sword|1d6+2");

        // Start with aggressive (default)
        Assert.Equal(AIState.Aggressive, enemy.CurrentAIState);

        // Verify it remains aggressive with full or high health (>50%)
        // Act
        enemy.EvaluateAIState();

        // Assert
        Assert.Equal(AIState.Aggressive, enemy.CurrentAIState);
    }

    /// <summary>
    /// T079: Verify AI state transitions to Defensive when health 25-50%
    /// </summary>
    [Fact]
    public void Enemy_EvaluateAIState_MidHealth_Defensive()
    {
        // Arrange
        var enemy = Enemy.Create(
            name: "Goblin",
            strBase: 10,
            dexBase: 14,
            intBase: 8,
            conBase: 13,
            chaBase: 9,
            maxHealth: 100,
            armorClass: 15,
            weaponInfo: "Sword|1d6+2");

        // Act
        // Simulate health at 40% (40/100)
        enemy.TakeDamage(60); // Take 60 damage, leaving 40 HP
        enemy.EvaluateAIState();

        // Assert
        Assert.Equal(AIState.Defensive, enemy.CurrentAIState);
    }

    /// <summary>
    /// T080: Verify AI state transitions to Flee when health < 25%
    /// </summary>
    [Fact]
    public void Enemy_EvaluateAIState_LowHealth_Flee()
    {
        // Arrange
        var enemy = Enemy.Create(
            name: "Goblin",
            strBase: 10,
            dexBase: 14,
            intBase: 8,
            conBase: 13,
            chaBase: 9,
            maxHealth: 100,
            armorClass: 15,
            weaponInfo: "Sword|1d6+2",
            fleeThreshold: 0.25);

        // Act
        // Simulate health at 20% (20/100)
        enemy.TakeDamage(80); // Take 80 damage, leaving 20 HP
        enemy.EvaluateAIState();

        // Assert
        Assert.Equal(AIState.Flee, enemy.CurrentAIState);
    }
}
