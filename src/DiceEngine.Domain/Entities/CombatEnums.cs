namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents the current state of a combat encounter
/// </summary>
public enum CombatStatus
{
    NotStarted = 0,
    Active = 1,
    Completed = 2
}

/// <summary>
/// Identifies which side won the combat
/// </summary>
public enum CombatSide
{
    Player = 0,
    Enemy = 1,
    Draw = 2
}

/// <summary>
/// Identifies whether a combatant is a player character or enemy NPC
/// </summary>
public enum CombatantType
{
    Character = 0,
    Enemy = 1
}

/// <summary>
/// Represents the current status of a combatant in combat
/// </summary>
public enum CombatantStatus
{
    Active = 0,
    Defeated = 1,
    Fled = 2
}

/// <summary>
/// Represents the AI state of an enemy combatant
/// </summary>
public enum AIState
{
    Aggressive = 0,  // Health > 50%
    Defensive = 1,   // Health 25-50%
    Flee = 2         // Health < 25%
}
