using DiceEngine.Domain.Entities;

namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Immutable value object representing the result of an attack action
/// Stored for combat history and audit trail
/// </summary>
public record AttackAction
{
    // Identity
    public Guid Id { get; init; }
    public Guid CombatEncounterId { get; init; }
    
    // Participants
    public Guid AttackerId { get; init; }
    public Guid TargetId { get; init; }
    
    // Attack Roll
    public int AttackRoll { get; init; }      // d20 result: 1-20
    public int AttackModifier { get; init; }
    public int AttackTotal { get; init; }     // Roll + Modifier
    public int TargetAC { get; init; }
    public bool IsHit { get; init; }
    public bool IsCriticalHit { get; init; }
    
    // Damage
    public string WeaponName { get; init; } = string.Empty;
    public string DamageExpression { get; init; } = string.Empty;  // e.g., "1d8+3"
    public int DamageRoll { get; init; }           // Dice roll result
    public int DamageModifier { get; init; }
    public int TotalDamage { get; init; }          // 0 if miss
    
    // Result
    public int TargetHealthAfter { get; init; }
    
    // Audit
    public DateTime Timestamp { get; init; }

    /// <summary>
    /// Factory method to create an attack action record
    /// </summary>
    public static AttackAction Record(
        Guid encounterId,
        Guid attackerId,
        Guid targetId,
        int attackRoll,
        int attackModifier,
        int targetAC,
        string weaponName,
        string damageExpression,
        int damageRoll,
        int damageModifier,
        int targetHealthAfter)
    {
        var attackTotal = attackRoll + attackModifier;
        var isHit = attackTotal >= targetAC;
        var totalDamage = isHit ? damageRoll + damageModifier : 0;
        var isCritical = attackRoll == 20;

        return new AttackAction
        {
            Id = Guid.NewGuid(),
            CombatEncounterId = encounterId,
            AttackerId = attackerId,
            TargetId = targetId,
            AttackRoll = attackRoll,
            AttackModifier = attackModifier,
            AttackTotal = attackTotal,
            TargetAC = targetAC,
            IsHit = isHit,
            IsCriticalHit = isCritical,
            WeaponName = weaponName,
            DamageExpression = damageExpression,
            DamageRoll = damageRoll,
            DamageModifier = damageModifier,
            TotalDamage = totalDamage,
            TargetHealthAfter = targetHealthAfter,
            Timestamp = DateTime.UtcNow
        };
    }
}
