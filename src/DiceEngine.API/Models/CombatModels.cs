namespace DiceEngine.API.Models;

/// <summary>
/// Request to initiate a new combat encounter
/// </summary>
public class InitiateCombatRequest
{
    /// <summary>
    /// Adventure ID for this combat encounter
    /// </summary>
    public Guid AdventureId { get; set; }

    /// <summary>
    /// List of player character IDs participating in combat
    /// </summary>
    public List<Guid> CharacterIds { get; set; } = new();

    /// <summary>
    /// List of enemy IDs participating in combat
    /// </summary>
    public List<Guid> EnemyIds { get; set; } = new();
}

/// <summary>
/// Request to resolve a player attack action
/// </summary>
public class ResolveTurnRequest
{
    /// <summary>
    /// Combatant ID performing the attack
    /// </summary>
    public Guid AttackingCombatantId { get; set; }

    /// <summary>
    /// Target combatant ID
    /// </summary>
    public Guid TargetCombatantId { get; set; }
}

/// <summary>
/// Represents a combatant in combat
/// </summary>
public class CombatantDto
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int CurrentHealth { get; set; }
    public int MaxHealth { get; set; }
    public int ArmorClass { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int InitiativeScore { get; set; }
}

/// <summary>
/// Response containing current combat state
/// </summary>
public class CombatStateResponse
{
    public Guid Id { get; set; }
    public Guid AdventureId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CurrentRound { get; set; }
    public int CurrentTurnIndex { get; set; }
    public List<CombatantDto> Combatants { get; set; } = new();
    public List<Guid> TurnOrder { get; set; } = new();
    public string? Winner { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}

/// <summary>
/// Represents the result of an attack action
/// </summary>
public class AttackActionResponse
{
    public Guid Id { get; set; }
    public Guid AttackerId { get; set; }
    public string AttackerName { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public string TargetName { get; set; } = string.Empty;
    public int AttackRoll { get; set; }
    public int AttackTotal { get; set; }
    public int TargetAC { get; set; }
    public bool IsHit { get; set; }
    public bool IsCriticalHit { get; set; }
    public string WeaponName { get; set; } = string.Empty;
    public string DamageExpression { get; set; } = string.Empty;
    public int TotalDamage { get; set; }
    public int TargetHealthAfter { get; set; }
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Response containing combat history/actions for a combat encounter
/// </summary>
public class CombatHistoryResponse
{
    public Guid CombatId { get; set; }
    public List<AttackActionResponse> Actions { get; set; } = new();
    public int TotalActions { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (TotalActions + PageSize - 1) / PageSize;
}
