using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for managing and resolving combat encounters
/// </summary>
public interface ICombatService
{
    /// <summary>
    /// Initiate a new combat encounter between characters and enemies
    /// </summary>
    Task<Result<CombatEncounter>> StartCombatAsync(
        Guid adventureId,
        IEnumerable<Guid> characterIds,
        IEnumerable<Guid> enemyIds);

    /// <summary>
    /// Get the current state of a combat encounter
    /// </summary>
    Task<Result<CombatEncounter>> GetCombatStatusAsync(Guid combatId);

    /// <summary>
    /// Resolve a player character's attack action
    /// </summary>
    Task<Result<(AttackAction action, CombatEncounter encounter)>> ResolveAttackAsync(
        Guid combatId,
        Guid attackingCombatantId,
        Guid targetCombatantId);

    /// <summary>
    /// Resolve an enemy AI turn (automatic action selection and execution)
    /// </summary>
    Task<Result<(AttackAction? action, CombatEncounter encounter)>> ResolveEnemyTurnAsync(
        Guid combatId);

    /// <summary>
    /// Check if combat should end and get outcome
    /// </summary>
    Task<CombatOutcome?> CheckCombatEndAsync(Guid combatId);
}

/// <summary>
/// Service for calculating initiative order for combatants
/// </summary>
public interface IInitiativeCalculator
{
    /// <summary>
    /// Calculate initiative scores for multiple combatants
    /// Returns sorted list by initiative order (highest first)
    /// </summary>
    List<Guid> CalculateInitiativeOrder(IEnumerable<Combatant> combatants);

    /// <summary>
    /// Roll a single d20 for initiative
    /// </summary>
    int RollInitiative();
}

/// <summary>
/// Service for resolving attack rolls and determining hits/misses
/// </summary>
public interface IAttackResolver
{
    /// <summary>
    /// Resolve an attack roll: d20 + modifiers vs AC
    /// Returns true if attack hits
    /// </summary>
    (int roll, int total, bool isHit, bool isCritical) ResolveAttack(
        Combatant attacker,
        Combatant target,
        int attackModifier = 0);
}

/// <summary>
/// Service for calculating damage dealt by attacks
/// </summary>
public interface IDamageCalculator
{
    /// <summary>
    /// Calculate damage from an attack with weapon dice and modifiers
    /// Handles critical hits (doubled damage dice)
    /// </summary>
    int CalculateDamage(
        string damageExpression,
        int damageModifier = 0,
        bool isCriticalHit = false);

    /// <summary>
    /// Parse a damage expression like "1d8+3" and return components
    /// </summary>
    (int numDice, int diceSize, int modifier) ParseDamageExpression(string expression);
}

/// <summary>
/// Service for AI decision-making and action selection
/// </summary>
public interface IAIStateMachine
{
    /// <summary>
    /// Select the best action for an enemy combatant based on current state
    /// </summary>
    AIAction SelectAction(
        Combatant enemyCombatant,
        IEnumerable<Combatant> allCombatants);
}

/// <summary>
/// Represents an AI action decision
/// </summary>
public record AIAction
{
    public enum ActionType
    {
        Attack,
        Defend,
        Flee
    }

    public ActionType Type { get; init; }
    public Guid? TargetCombatantId { get; init; }
    public string Description { get; init; } = string.Empty;
}
