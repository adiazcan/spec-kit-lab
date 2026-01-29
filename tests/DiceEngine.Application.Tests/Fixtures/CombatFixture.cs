using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Tests.Fixtures;

/// <summary>
/// Provides test data and helper methods for combat testing
/// </summary>
public class CombatFixture : IDisposable
{
    public Guid TestAdventureId { get; } = Guid.Parse("550e8400-e29b-41d4-a716-446655440001");
    public Guid TestCharacterId1 { get; } = Guid.Parse("550e8400-e29b-41d4-a716-446655440002");
    public Guid TestCharacterId2 { get; } = Guid.Parse("550e8400-e29b-41d4-a716-446655440003");
    public Guid TestEnemyId1 { get; } = Guid.Parse("e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b");
    public Guid TestEnemyId2 { get; } = Guid.Parse("e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8c");

    /// <summary>
    /// Create a test character combatant with default values
    /// </summary>
    public Combatant CreateTestCharacterCombatant(
        string name = "Theron the Brave",
        Guid? characterId = null,
        int initiativeRoll = 15,
        int dexModifier = 3,
        int armorClass = 16,
        int maxHealth = 30)
    {
        return Combatant.CreateFromCharacter(
            TestAdventureId,
            name,
            characterId ?? TestCharacterId1,
            dexModifier,
            armorClass,
            maxHealth,
            initiativeRoll);
    }

    /// <summary>
    /// Create a test enemy combatant with default values
    /// </summary>
    public Combatant CreateTestEnemyCombatant(
        string name = "Goblin Fighter",
        Guid? enemyId = null,
        int initiativeRoll = 12,
        int dexModifier = 2,
        int armorClass = 14,
        int maxHealth = 20,
        AIState aiState = AIState.Aggressive)
    {
        // Create Enemy entity first
        // Note: dexModifier is a computed value from dexBase using (dexBase - 10) / 2
        // So to get a specific modifier, we need: dexBase = 10 + (modifier * 2)
        int dexBase = 10 + (dexModifier * 2);

        var enemy = Enemy.Create(
            name,
            strBase: 10,
            dexBase: dexBase,
            intBase: 8,
            conBase: 12,
            chaBase: 8,
            maxHealth: maxHealth,
            armorClass: armorClass,
            weaponInfo: "Rusty Sword|1d6+2",
            description: $"Test {name}");

        return Combatant.CreateFromEnemy(enemy, initiativeRoll);
    }

    /// <summary>
    /// Create a test combat encounter with one character and one enemy
    /// </summary>
    public CombatEncounter CreateTestCombatEncounter(
        Combatant? character = null,
        Combatant? enemy = null)
    {
        var charCombatant = character ?? CreateTestCharacterCombatant();
        var enemyCombatant = enemy ?? CreateTestEnemyCombatant();

        var combatants = new List<Combatant> { charCombatant, enemyCombatant };
        return CombatEncounter.Create(TestAdventureId, combatants);
    }

    public void Dispose()
    {
        // No disposable resources yet; placeholder for future teardown logic.
    }
}
