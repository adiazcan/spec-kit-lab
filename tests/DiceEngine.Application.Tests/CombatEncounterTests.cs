using DiceEngine.Application.Tests.Fixtures;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Tests for CombatEncounter entity (T025-T026)
/// </summary>
public class CombatEncounterTests : IClassFixture<CombatFixture>
{
    private readonly CombatFixture _fixture;

    public CombatEncounterTests(CombatFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void CombatEncounter_Create_ValidInput_ReturnsSuccess()
    {
        // Arrange
        var character = _fixture.CreateTestCharacterCombatant("Hero", maxHealth: 30);
        var enemy = _fixture.CreateTestEnemyCombatant("Goblin", maxHealth: 20);
        var combatants = new List<Combatant> { character, enemy };

        // Act
        var encounter = CombatEncounter.Create(_fixture.TestAdventureId, combatants);

        // Assert
        Assert.NotNull(encounter);
        Assert.Equal(_fixture.TestAdventureId, encounter.AdventureId);
        Assert.Equal(CombatStatus.NotStarted, encounter.Status);
        Assert.Equal(2, encounter.Combatants.Count);
        Assert.Equal(1, encounter.CurrentRound);
        Assert.Equal(0, encounter.CurrentTurnIndex);
        Assert.NotEqual(Guid.Empty, encounter.Id);
        Assert.True(encounter.StartedAt > DateTime.MinValue);
    }

    [Fact]
    public void CombatEncounter_Create_EmptyCombatants_ThrowsException()
    {
        // Arrange
        var emptyCombatants = new List<Combatant>();

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            CombatEncounter.Create(_fixture.TestAdventureId, emptyCombatants));

        Assert.Contains("at least one combatant", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CombatEncounter_Create_OnlyCharacters_ThrowsException()
    {
        // Arrange
        var character1 = _fixture.CreateTestCharacterCombatant("Hero 1");
        var character2 = _fixture.CreateTestCharacterCombatant("Hero 2");
        var combatants = new List<Combatant> { character1, character2 };

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            CombatEncounter.Create(_fixture.TestAdventureId, combatants));

        Assert.Contains("at least one character and one enemy", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CombatEncounter_Create_OnlyEnemies_ThrowsException()
    {
        // Arrange
        var enemy1 = _fixture.CreateTestEnemyCombatant("Goblin 1");
        var enemy2 = _fixture.CreateTestEnemyCombatant("Goblin 2");
        var combatants = new List<Combatant> { enemy1, enemy2 };

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            CombatEncounter.Create(_fixture.TestAdventureId, combatants));

        Assert.Contains("at least one character and one enemy", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CombatEncounter_StartCombat_SetsInitiativeOrder()
    {
        // Arrange
        var character = _fixture.CreateTestCharacterCombatant(initiativeRoll: 18);
        var enemy = _fixture.CreateTestEnemyCombatant(initiativeRoll: 12);
        var combatants = new List<Combatant> { character, enemy };
        var encounter = CombatEncounter.Create(_fixture.TestAdventureId, combatants);

        // Act
        var initiativeOrder = new List<Guid> { character.Id, enemy.Id }; // Sorted by initiative
        encounter.StartCombat(initiativeOrder);

        // Assert
        Assert.Equal(CombatStatus.Active, encounter.Status);
        Assert.Equal(2, encounter.InitiativeOrder.Count);
        Assert.Equal(character.Id, encounter.InitiativeOrder[0]); // Higher initiative goes first
        Assert.Equal(enemy.Id, encounter.InitiativeOrder[1]);
        Assert.Equal(character.Id, encounter.CurrentActiveCombatantId);
    }

    [Fact]
    public void CombatEncounter_AdvanceToNextTurn_UpdatesTurnIndex()
    {
        // Arrange
        var character = _fixture.CreateTestCharacterCombatant(initiativeRoll: 18);
        var enemy = _fixture.CreateTestEnemyCombatant(initiativeRoll: 12);
        var combatants = new List<Combatant> { character, enemy };
        var encounter = CombatEncounter.Create(_fixture.TestAdventureId, combatants);
        var initiativeOrder = new List<Guid> { character.Id, enemy.Id };
        encounter.StartCombat(initiativeOrder);

        // Act
        encounter.AdvanceToNextTurn();

        // Assert
        Assert.Equal(1, encounter.CurrentTurnIndex); // Moved from 0 to 1
        Assert.Equal(enemy.Id, encounter.CurrentActiveCombatantId); // Now enemy's turn
    }

    [Fact]
    public void CombatEncounter_AdvanceToNextTurn_WrapsToNextRound()
    {
        // Arrange
        var character = _fixture.CreateTestCharacterCombatant(initiativeRoll: 18);
        var enemy = _fixture.CreateTestEnemyCombatant(initiativeRoll: 12);
        var combatants = new List<Combatant> { character, enemy };
        var encounter = CombatEncounter.Create(_fixture.TestAdventureId, combatants);
        var initiativeOrder = new List<Guid> { character.Id, enemy.Id };
        encounter.StartCombat(initiativeOrder);

        // Act - advance through all turns
        encounter.AdvanceToNextTurn(); // Character -> Enemy (turn 1)
        encounter.AdvanceToNextTurn(); // Enemy -> Character (round 2, turn 0)

        // Assert
        Assert.Equal(2, encounter.CurrentRound); // Round incremented
        Assert.Equal(0, encounter.CurrentTurnIndex); // Back to first in order
        Assert.Equal(character.Id, encounter.CurrentActiveCombatantId);
    }

    [Fact]
    public void CombatEncounter_EndCombat_SetsWinnerAndStatus()
    {
        // Arrange
        var encounter = _fixture.CreateTestCombatEncounter();

        // Act
        encounter.EndCombat(CombatSide.Player);

        // Assert
        Assert.Equal(CombatStatus.Completed, encounter.Status);
        Assert.Equal(CombatSide.Player, encounter.Winner);
        Assert.NotNull(encounter.EndedAt);
        Assert.True(encounter.EndedAt > encounter.StartedAt);
    }

    [Fact]
    public void CombatEncounter_CheckCombatEnd_ReturnsNullWhenBothSidesActive()
    {
        // Arrange
        var character = _fixture.CreateTestCharacterCombatant(maxHealth: 30);
        var enemy = _fixture.CreateTestEnemyCombatant(maxHealth: 20);
        var combatants = new List<Combatant> { character, enemy };
        var encounter = CombatEncounter.Create(_fixture.TestAdventureId, combatants);

        // Act
        var outcome = encounter.CheckCombatEnd();

        // Assert
        Assert.Null(outcome); // Combat should continue
    }
}
