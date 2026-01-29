using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Resolves attack rolls in combat using D&D 5e rules
/// Handles d20 rolls, modifiers, AC comparison, and critical hits
/// </summary>
public class AttackResolver : IAttackResolver
{
    private readonly IDiceService _diceService;

    public AttackResolver(IDiceService diceService)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
    }

    /// <summary>
    /// Resolve an attack roll following D&D 5e rules:
    /// 1. Roll d20 (1-20)
    /// 2. Add attack modifier (STR or DEX, proficiency, magic bonuses)
    /// 3. Compare total to target AC
    /// 4. Natural 20 always hits, Natural 1 always misses
    /// 5. Damage dice doubled on critical hit
    /// </summary>
    public (int roll, int total, bool isHit, bool isCritical) ResolveAttack(
        Combatant attacker,
        Combatant target,
        int attackModifier = 0)
    {
        if (target.Status != CombatantStatus.Active)
            throw new InvalidOperationException($"Cannot attack defeated or fled combatant {target.DisplayName}");

        // Roll the d20
        var rollResult = _diceService.Roll("1d20");
        var d20Roll = rollResult.FinalTotal;
        var isNatural20 = d20Roll == 20;
        var isNatural1 = d20Roll == 1;

        // Calculate total: roll + modifiers
        var attackTotal = d20Roll + attackModifier;

        // Determine hit/miss
        // Critical hit (natural 20) always hits
        // Critical miss (natural 1) always misses
        bool isHit = isNatural20 || (attackTotal >= target.ArmorClass && !isNatural1);
        bool isCritical = isNatural20;

        return (d20Roll, attackTotal, isHit, isCritical);
    }
}
