using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

/// <summary>
/// Calculates initiative order for combat participants
/// Follows D&D 5e rules: d20 + DEX modifier, with tie-breaking
/// </summary>
public class InitiativeCalculator : IInitiativeCalculator
{
    private readonly IDiceService _diceService;

    public InitiativeCalculator(IDiceService diceService)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
    }

    /// <summary>
    /// Determine turn order from combatants with pre-set initiative scores
    /// Rules:
    /// 1. Sort by initiative score (high to low) - d20 + DEX modifier
    /// 2. Tie-break by DEX modifier (high to low)
    /// 3. Still tied: use GUID for deterministic ordering
    /// 
    /// This method assumes combatants already have their InitiativeRoll and InitiativeScore
    /// set by CombatService.StartCombatAsync() which calls RollInitiative() separately for each
    /// </summary>
    public List<Guid> CalculateInitiativeOrder(IEnumerable<Combatant> combatants)
    {
        var combatantList = combatants.ToList();

        // Create initiative entries from existing combatant initiative scores
        var initiatives = combatantList.Select(c => new InitiativeEntry(
            combatantId: c.Id,
            roll: c.InitiativeRoll,
            dexMod: c.DexterityModifier,
            tiebreaker: c.TiebreakerKey
        )).ToList();

        // Sort by initiative rules: highest score first, then DEX modifier, then GUID tiebreaker
        var sorted = initiatives.OrderBy(i => i, new InitiativeComparer()).ToList();

        // Return ordered list of combatant IDs
        return sorted.Select(i => i.CombatantId).ToList();
    }

    /// <summary>
    /// Roll a single d20 for initiative
    /// </summary>
    public int RollInitiative()
    {
        var result = _diceService.Roll("1d20");
        return result.FinalTotal;
    }

    /// <summary>
    /// Comparer for sorting initiative entries using D&D 5e rules
    /// </summary>
    private class InitiativeComparer : IComparer<InitiativeEntry>
    {
        public int Compare(InitiativeEntry? a, InitiativeEntry? b)
        {
            if (a == null || b == null)
                return 0;

            // Higher initiative score goes first (descending)
            var scoreCompare = b.InitiativeScore.CompareTo(a.InitiativeScore);
            if (scoreCompare != 0)
                return scoreCompare;

            // Tied scores: higher DEX modifier goes first
            var dexCompare = b.DexModifier.CompareTo(a.DexModifier);
            if (dexCompare != 0)
                return dexCompare;

            // Still tied: use GUID tiebreaker for deterministic ordering
            return a.TiebreakerKey.CompareTo(b.TiebreakerKey);
        }
    }
}
