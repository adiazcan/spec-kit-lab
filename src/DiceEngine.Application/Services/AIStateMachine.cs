using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Implements AI decision-making for enemies in turn-based combat
/// Selects targets and actions based on enemy state: Aggressive, Defensive, or Flee
/// </summary>
public class AIStateMachine : IAIStateMachine
{
    private readonly IDiceService _diceService;

    public AIStateMachine(IDiceService diceService)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
    }

    /// <summary>
    /// Select an AI action based on current state
    /// </summary>
    public AIAction SelectAction(
        Combatant enemyCombatant,
        IEnumerable<Combatant> allCombatants)
    {
        var targets = allCombatants
            .Where(c => c.CombatantType == CombatantType.Character && c.Status == CombatantStatus.Active)
            .ToList();

        if (!targets.Any())
        {
            return new AIAction { Type = AIAction.ActionType.Defend, Description = "No valid targets" };
        }

        // Update AI state based on current health
        UpdateAIState(enemyCombatant);

        // Select action based on AI state
        return enemyCombatant.AIState switch
        {
            AIState.Aggressive => new AIAction
            {
                Type = AIAction.ActionType.Attack,
                TargetCombatantId = SelectAggressiveTarget(targets),
                Description = "Aggressive attack on highest threat"
            },
            AIState.Defensive => new AIAction
            {
                Type = AIAction.ActionType.Attack,
                TargetCombatantId = SelectDefensiveTarget(targets),
                Description = "Cautious attack on weakest target"
            },
            AIState.Flee => new AIAction
            {
                Type = AIAction.ActionType.Flee,
                Description = "Attempting to flee combat"
            },
            _ => new AIAction { Type = AIAction.ActionType.Defend, Description = "Default defensive action" }
        };
    }

    /// <summary>
    /// Update AI state based on enemy's health percentage
    /// Health thresholds: 50%=Aggressive, 25-50%=Defensive, <25%=Flee
    /// </summary>
    private void UpdateAIState(Combatant enemy)
    {
        if (enemy.EnemyId == null || enemy.EnemyId == Guid.Empty)
            return; // Not an enemy combatant

        var healthPercent = enemy.CurrentHealth * 100.0 / enemy.MaxHealth;

        if (healthPercent <= 25)
        {
            enemy.UpdateAIState(AIState.Flee);
        }
        else if (healthPercent < 50)
        {
            enemy.UpdateAIState(AIState.Defensive);
        }
        else
        {
            enemy.UpdateAIState(AIState.Aggressive);
        }
    }

    /// <summary>
    /// Aggressive state: Attack the strongest/healthiest target (highest threat)
    /// Strategy: Neutralize the most dangerous opponent first
    /// </summary>
    private Guid SelectAggressiveTarget(List<Combatant> targets)
    {
        return targets
            .OrderByDescending(t => t.MaxHealth)      // Strongest (by max health)
            .ThenByDescending(t => t.CurrentHealth)   // Then healthiest (by current health)
            .First()
            .Id;
    }

    /// <summary>
    /// Defensive state: Attack the weakest target (lowest current health)
    /// Strategy: Secure a victory kill to even the odds
    /// </summary>
    private Guid SelectDefensiveTarget(List<Combatant> targets)
    {
        return targets
            .OrderBy(t => t.CurrentHealth)     // Weakest target
            .First()
            .Id;
    }
}
