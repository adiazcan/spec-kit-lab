namespace DiceEngine.Application.Exceptions;

/// <summary>
/// Exception thrown when a combatant attempts to act outside their turn
/// HTTP Status: 409 Conflict
/// </summary>
public class NotYourTurnException : Exception
{
    public Guid CombatEncounterId { get; }
    public Guid ActingCombatantId { get; }
    public Guid CurrentTurnCombatantId { get; }

    public NotYourTurnException(
        Guid combatEncounterId,
        Guid actingCombatantId,
        Guid currentTurnCombatantId)
        : base($"It is not your turn. Current turn belongs to combatant {currentTurnCombatantId}")
    {
        CombatEncounterId = combatEncounterId;
        ActingCombatantId = actingCombatantId;
        CurrentTurnCombatantId = currentTurnCombatantId;
    }
}

/// <summary>
/// Exception thrown when an invalid target is selected for an action
/// HTTP Status: 422 Unprocessable Entity
/// </summary>
public class InvalidTargetException : Exception
{
    public Guid CombatEncounterId { get; }
    public Guid TargetCombatantId { get; }
    public string Reason { get; }

    public InvalidTargetException(
        Guid combatEncounterId,
        Guid targetCombatantId,
        string reason = "Target is invalid for this action")
        : base($"Invalid target {targetCombatantId}: {reason}")
    {
        CombatEncounterId = combatEncounterId;
        TargetCombatantId = targetCombatantId;
        Reason = reason;
    }
}

/// <summary>
/// Exception thrown when an action is attempted on a combat that has ended
/// HTTP Status: 409 Conflict
/// </summary>
public class CombatEndedException : Exception
{
    public Guid CombatEncounterId { get; }
    public string Status { get; }
    public string? Winner { get; }

    public CombatEndedException(
        Guid combatEncounterId,
        string status,
        string? winner = null)
        : base($"Combat {combatEncounterId} has ended with status {status}" +
            (winner != null ? $" (Winner: {winner})" : ""))
    {
        CombatEncounterId = combatEncounterId;
        Status = status;
        Winner = winner;
    }
}

/// <summary>
/// Exception thrown when a combatant cannot act because their turn hasn't come yet
/// HTTP Status: 409 Conflict
/// </summary>
public class InvalidActionException : Exception
{
    public Guid CombatEncounterId { get; }
    public string Action { get; }
    public string Reason { get; }

    public InvalidActionException(
        Guid combatEncounterId,
        string action,
        string reason)
        : base($"Invalid action {action}: {reason}")
    {
        CombatEncounterId = combatEncounterId;
        Action = action;
        Reason = reason;
    }
}
