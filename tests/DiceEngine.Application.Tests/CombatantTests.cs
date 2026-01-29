using DiceEngine.Application.Tests.Fixtures;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Tests for Combatant entity (T027-T029)
/// </summary>
public class CombatantTests : IClassFixture<CombatFixture>
{
    private readonly CombatFixture _fixture;

    public CombatantTests(CombatFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void Combatant_CreateFromCharacter_ValidInput_ReturnsSuccess()
    {
        // Arrange & Act
        var combatant = Combatant.CreateFromCharacter(
            _fixture.TestAdventureId,
            "Theron the Brave",
            _fixture.TestCharacterId1,
            dexModifier: 3,
            armorClass: 16,
            maxHealth: 30,
            initiativeRoll: 15);

        // Assert
        Assert.NotNull(combatant);
        Assert.NotEqual(Guid.Empty, combatant.Id);
        Assert.Equal("Theron the Brave", combatant.DisplayName);
        Assert.Equal(_fixture.TestCharacterId1, combatant.CharacterId);
        Assert.Null(combatant.EnemyId);
        Assert.Equal(CombatantType.Character, combatant.CombatantType);
        Assert.Equal(30, combatant.CurrentHealth);
        Assert.Equal(30, combatant.MaxHealth);
        Assert.Equal(16, combatant.ArmorClass);
        Assert.Equal(CombatantStatus.Active, combatant.Status);
        Assert.Equal(3, combatant.DexterityModifier);
        Assert.Equal(15, combatant.InitiativeRoll);
        Assert.Equal(18, combatant.InitiativeScore); // 15 + 3
        Assert.Null(combatant.AIState); // Characters have no AI
        Assert.True(combatant.IsActive);
    }

    [Fact]
    public void Combatant_CreateFromCharacter_InvalidName_ThrowsException()
    {
        // Act & Assert - Empty name
        var exception1 = Assert.Throws<ArgumentException>(() =>
            Combatant.CreateFromCharacter(
                _fixture.TestAdventureId,
                "",
                _fixture.TestCharacterId1,
                3, 16, 30, 15));
        Assert.Contains("name", exception1.Message, StringComparison.OrdinalIgnoreCase);

        // Act & Assert - Name too long
        var longName = new string('A', 101);
        var exception2 = Assert.Throws<ArgumentException>(() =>
            Combatant.CreateFromCharacter(
                _fixture.TestAdventureId,
                longName,
                _fixture.TestCharacterId1,
                3, 16, 30, 15));
        Assert.Contains("name", exception2.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Combatant_CreateFromCharacter_InvalidInitiativeRoll_ThrowsException()
    {
        // Act & Assert - Roll too low
        var exception1 = Assert.Throws<ArgumentException>(() =>
            Combatant.CreateFromCharacter(
                _fixture.TestAdventureId,
                "Hero",
                _fixture.TestCharacterId1,
                3, 16, 30, 0)); // Roll must be 1-20
        Assert.Contains("initiative", exception1.Message, StringComparison.OrdinalIgnoreCase);

        // Act & Assert - Roll too high
        var exception2 = Assert.Throws<ArgumentException>(() =>
            Combatant.CreateFromCharacter(
                _fixture.TestAdventureId,
                "Hero",
                _fixture.TestCharacterId1,
                3, 16, 30, 21)); // Roll must be 1-20
        Assert.Contains("initiative", exception2.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Combatant_CreateFromCharacter_InvalidArmorClass_ThrowsException()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            Combatant.CreateFromCharacter(
                _fixture.TestAdventureId,
                "Hero",
                _fixture.TestCharacterId1,
                3, 9, 30, 15)); // AC must be at least 10
        Assert.Contains("armor class", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Combatant_CreateFromCharacter_InvalidHealth_ThrowsException()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            Combatant.CreateFromCharacter(
                _fixture.TestAdventureId,
                "Hero",
                _fixture.TestCharacterId1,
                3, 16, 0, 15)); // MaxHealth must be positive
        Assert.Contains("health", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Combatant_TakeDamage_ReducesHealth()
    {
        // Arrange
        var combatant = _fixture.CreateTestCharacterCombatant(maxHealth: 30);
        var initialHealth = combatant.CurrentHealth;

        // Act
        combatant.TakeDamage(10);

        // Assert
        Assert.Equal(initialHealth - 10, combatant.CurrentHealth);
        Assert.Equal(20, combatant.CurrentHealth);
        Assert.Equal(CombatantStatus.Active, combatant.Status); // Still active
        Assert.True(combatant.IsActive);
    }

    [Fact]
    public void Combatant_TakeDamage_MultipleTimes_ReducesHealthCorrectly()
    {
        // Arrange
        var combatant = _fixture.CreateTestCharacterCombatant(maxHealth: 30);

        // Act
        combatant.TakeDamage(5);
        combatant.TakeDamage(8);
        combatant.TakeDamage(7);

        // Assert
        Assert.Equal(10, combatant.CurrentHealth); // 30 - 5 - 8 - 7 = 10
        Assert.Equal(CombatantStatus.Active, combatant.Status);
    }

    [Fact]
    public void Combatant_TakeDamage_NegativeDamage_ThrowsException()
    {
        // Arrange
        var combatant = _fixture.CreateTestCharacterCombatant(maxHealth: 30);

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            combatant.TakeDamage(-5));
        Assert.Contains("negative", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Combatant_TakeDamage_HealthReachesZero_MarksDefeated()
    {
        // Arrange
        var combatant = _fixture.CreateTestCharacterCombatant(maxHealth: 30);
        combatant.TakeDamage(20); // Reduce to 10 HP

        // Act - deal fatal damage
        combatant.TakeDamage(10);

        // Assert
        Assert.Equal(0, combatant.CurrentHealth);
        Assert.Equal(CombatantStatus.Defeated, combatant.Status);
        Assert.False(combatant.IsActive); // No longer active
    }

    [Fact]
    public void Combatant_TakeDamage_OverkillDamage_ClampsToZero()
    {
        // Arrange
        var combatant = _fixture.CreateTestCharacterCombatant(maxHealth: 30);

        // Act - deal massive damage
        combatant.TakeDamage(100);

        // Assert
        Assert.Equal(0, combatant.CurrentHealth); // Clamped to 0, not negative
        Assert.Equal(CombatantStatus.Defeated, combatant.Status);
        Assert.False(combatant.IsActive);
    }

    [Fact]
    public void Combatant_MarkFled_SetsStatusToFled()
    {
        // Arrange
        var combatant = _fixture.CreateTestEnemyCombatant();

        // Act
        combatant.MarkFled();

        // Assert
        Assert.Equal(CombatantStatus.Fled, combatant.Status);
        Assert.False(combatant.IsActive); // Fled combatants are not active
    }

    [Fact]
    public void Combatant_HealthPercentage_CalculatedCorrectly()
    {
        // Arrange
        var combatant = _fixture.CreateTestCharacterCombatant(maxHealth: 100);

        // Act & Assert - Full health
        Assert.Equal(100.0, combatant.HealthPercentage);

        // Take damage - 75% health
        combatant.TakeDamage(25);
        Assert.Equal(75.0, combatant.HealthPercentage);

        // Take more damage - 30% health
        combatant.TakeDamage(45);
        Assert.Equal(30.0, combatant.HealthPercentage);

        // Take fatal damage - 0% health
        combatant.TakeDamage(30);
        Assert.Equal(0.0, combatant.HealthPercentage);
    }

    [Fact]
    public void Combatant_CreateFromEnemy_ValidInput_ReturnsSuccess()
    {
        // Arrange & Act
        var combatant = _fixture.CreateTestEnemyCombatant(
            name: "Goblin Fighter",
            enemyId: _fixture.TestEnemyId1,
            initiativeRoll: 12,
            dexModifier: 2,
            armorClass: 14,
            maxHealth: 20,
            aiState: AIState.Aggressive);

        // Assert
        Assert.NotNull(combatant);
        Assert.Equal("Goblin Fighter", combatant.DisplayName);
        Assert.Null(combatant.CharacterId);
        Assert.Equal(_fixture.TestEnemyId1, combatant.EnemyId);
        Assert.Equal(CombatantType.Enemy, combatant.CombatantType);
        Assert.Equal(20, combatant.CurrentHealth);
        Assert.Equal(20, combatant.MaxHealth);
        Assert.Equal(14, combatant.ArmorClass);
        Assert.Equal(AIState.Aggressive, combatant.AIState); // Enemies have AI
        Assert.Equal(14, combatant.InitiativeScore); // 12 + 2
    }
}
