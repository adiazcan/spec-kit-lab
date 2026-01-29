namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Immutable value object representing an initiative entry for a combatant
/// Used for initiative roll calculations and ordering
/// </summary>
public record InitiativeEntry
{
    public Guid CombatantId { get; init; }
    public int InitiativeRoll { get; init; }  // d20 result: 1-20
    public int DexModifier { get; init; }
    public int InitiativeScore { get; init; } // Roll + modifier
    public Guid TiebreakerKey { get; init; }

    public InitiativeEntry(Guid combatantId, int roll, int dexMod, Guid tiebreaker)
    {
        CombatantId = combatantId;
        InitiativeRoll = roll;
        DexModifier = dexMod;
        InitiativeScore = roll + dexMod;
        TiebreakerKey = tiebreaker;
    }

    /// <summary>
    /// Comparer for sorting initiative (high to low, with DEX tiebreaker, then GUID)
    /// Returns negative if a comes before b in combat order
    /// </summary>
    public static int Compare(InitiativeEntry a, InitiativeEntry b)
    {
        // Higher score goes first (descending)
        var scoreCompare = b.InitiativeScore.CompareTo(a.InitiativeScore);
        if (scoreCompare != 0)
            return scoreCompare;

        // Tied scores: higher DEX modifier goes first
        var dexCompare = b.DexModifier.CompareTo(a.DexModifier);
        if (dexCompare != 0)
            return dexCompare;

        // Still tied: use GUID for deterministic ordering
        return a.TiebreakerKey.CompareTo(b.TiebreakerKey);
    }
}
