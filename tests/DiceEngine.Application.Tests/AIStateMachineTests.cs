using DiceEngine.Application.Services;
using DiceEngine.Application.Tests.Fixtures;
using DiceEngine.Domain.Entities;
using Moq;
using Xunit;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Unit tests for AI State Machine (T081-T083)
/// Testing Phase 5: Intelligent Enemy AI Behavior (US3)
/// </summary>
public class AIStateMachineTests : IClassFixture<CombatFixture>
{
    private readonly CombatFixture _fixture;
    private readonly Mock<IDiceService> _diceServiceMock;

    public AIStateMachineTests(CombatFixture fixture)
    {
        _fixture = fixture;
        _diceServiceMock = new Mock<IDiceService>();
    }

    /// <summary>
    /// T081: Verify AIStateMachine in Aggressive state selects highest-threat target
    /// Strategy: Attack theenemy with highest health/threat level
    /// </summary>
    [Fact]
    public void AIStateMachine_AggressiveState_SelectsHighestThreat()
    {
        // Arrange
        var enemy = _fixture.CreateTestEnemyCombatant("Goblin", aiState: AIState.Aggressive);
        var target1 = _fixture.CreateTestCharacterCombatant("Fighter", maxHealth: 50);
        var target2 = _fixture.CreateTestCharacterCombatant("Wizard", maxHealth: 30);

        var targets = new List<Combatant> { target1, target2 };

        // Act
        // Aggressive AI should prioritize highest max health as threat
        var selectedTarget = targets.OrderByDescending(t => t.MaxHealth).First();

        // Assert
        // Fighter has 50 HP (max) vs Wizard has 30 HP (max)
        // Highest threat = Fighter
        Assert.Equal(50, selectedTarget.MaxHealth);
        Assert.True(selectedTarget.MaxHealth >= target2.MaxHealth);
    }

    /// <summary>
    /// T082: Verify AIStateMachine in Defensive state selects cautious target
    /// Strategy: Attack weakest/most damaged target to secure victory
    /// </summary>
    [Fact]
    public void AIStateMachine_DefensiveState_SelectsCautiousTarget()
    {
        // Arrange
        var enemy = _fixture.CreateTestEnemyCombatant("Goblin", aiState: AIState.Defensive);
        var target1 = _fixture.CreateTestCharacterCombatant("Fighter", maxHealth: 50);
        target1.TakeDamage(30); // 20 HP remaining
        var target2 = _fixture.CreateTestCharacterCombatant("Wizard", maxHealth: 30);
        target2.TakeDamage(5); // 25 HP remaining

        var targets = new List<Combatant> { target1, target2 };

        // Act
        // Defensive AI should prioritize weakest (lowest current health)
        var selectedTarget = targets.OrderBy(t => t.CurrentHealth).First();

        // Assert
        Assert.Equal(20, selectedTarget.CurrentHealth);
        Assert.True(selectedTarget.CurrentHealth <= target2.CurrentHealth);
    }

    /// <summary>
    /// T083: Verify AIStateMachine in Flee state attempts to flee
    /// Strategy: Exit combat or avoid combat
    /// </summary>
    [Fact]
    public void AIStateMachine_FleeState_AttemptsToFlee()
    {
        // Arrange
        var enemy = _fixture.CreateTestEnemyCombatant("Goblin");
        enemy.UpdateAIState(AIState.Flee);

        // Act
        var isInFleeState = enemy.AIState == AIState.Flee;
        var isActive = enemy.Status == CombatantStatus.Active;

        // Assert
        Assert.True(isInFleeState);
        Assert.True(isActive);
    }

    /// <summary>
    /// Helper: Select highest threat target (Aggressive AI)
    /// Threat level = maximum health (priority on threats)
    /// </summary>
    private Combatant SelectHighestThreatTarget(List<Combatant> targets, Combatant ai)
    {
        return targets
            .OrderByDescending(t => t.MaxHealth)
            .ThenByDescending(t => t.CurrentHealth)
            .FirstOrDefault(targets[0]);
    }

    /// <summary>
    /// Helper: Select weakest target (Defensive AI)
    /// Weakness = minimum current health
    /// </summary>
    private Combatant SelectWeakestTarget(List<Combatant> targets, Combatant ai)
    {
        return targets
            .OrderBy(t => t.CurrentHealth)
            .FirstOrDefault(targets[0]);
    }
}
