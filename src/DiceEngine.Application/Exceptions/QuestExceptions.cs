namespace DiceEngine.Application.Exceptions;

/// <summary>
/// Base exception for quest-related errors.
/// </summary>
public class QuestException : Exception
{
    public QuestException(string message) : base(message)
    {
    }

    public QuestException(string message, Exception innerException) : base(message, innerException)
    {
    }
}

/// <summary>
/// Thrown when a quest is not found.
/// </summary>
public class QuestNotFoundException : QuestException
{
    public Guid QuestId { get; }

    public QuestNotFoundException(Guid questId)
        : base($"Quest with ID '{questId}' was not found.")
    {
        QuestId = questId;
    }
}

/// <summary>
/// Thrown when quest progress is not found.
/// </summary>
public class QuestProgressNotFoundException : QuestException
{
    public Guid QuestProgressId { get; }

    public QuestProgressNotFoundException(Guid questProgressId)
        : base($"Quest progress with ID '{questProgressId}' was not found.")
    {
        QuestProgressId = questProgressId;
    }
}

/// <summary>
/// Thrown when attempting to accept a quest that's already active.
/// </summary>
public class QuestAlreadyActiveException : QuestException
{
    public Guid PlayerId { get; }
    public Guid QuestId { get; }

    public QuestAlreadyActiveException(Guid playerId, Guid questId)
        : base($"Quest '{questId}' is already active for player '{playerId}'.")
    {
        PlayerId = playerId;
        QuestId = questId;
    }
}

/// <summary>
/// Thrown when quest prerequisites are not met.
/// </summary>
public class PrerequisiteNotMetException : QuestException
{
    public Guid QuestId { get; }
    public List<string> UnmetPrerequisites { get; }

    public PrerequisiteNotMetException(Guid questId, List<string> unmetPrerequisites)
        : base($"Quest '{questId}' prerequisites not met: {string.Join(", ", unmetPrerequisites)}")
    {
        QuestId = questId;
        UnmetPrerequisites = unmetPrerequisites;
    }
}

/// <summary>
/// Thrown when attempting to complete a stage with incomplete objectives.
/// </summary>
public class StageNotCompleteException : QuestException
{
    public int StageNumber { get; }
    public int IncompleteObjectivesCount { get; }

    public StageNotCompleteException(int stageNumber, int incompleteObjectivesCount)
        : base($"Cannot complete stage {stageNumber} - {incompleteObjectivesCount} objective(s) still incomplete.")
    {
        StageNumber = stageNumber;
        IncompleteObjectivesCount = incompleteObjectivesCount;
    }
}

/// <summary>
/// Thrown when a quest failure condition is triggered.
/// </summary>
public class QuestFailureException : QuestException
{
    public Guid QuestId { get; }
    public string FailureReason { get; }

    public QuestFailureException(Guid questId, string failureReason)
        : base($"Quest '{questId}' failed: {failureReason}")
    {
        QuestId = questId;
        FailureReason = failureReason;
    }
}

/// <summary>
/// Thrown when attempting operations on an inactive quest.
/// </summary>
public class QuestNotActiveException : QuestException
{
    public Guid QuestProgressId { get; }
    public string Status { get; }

    public QuestNotActiveException(Guid questProgressId, string status)
        : base($"Quest progress '{questProgressId}' is not active (current status: {status}).")
    {
        QuestProgressId = questProgressId;
        Status = status;
    }
}

/// <summary>
/// Thrown when maximum concurrent active quests limit is reached.
/// </summary>
public class MaxActiveQuestsExceededException : QuestException
{
    public int MaxAllowed { get; }
    public int CurrentCount { get; }

    public MaxActiveQuestsExceededException(int maxAllowed, int currentCount)
        : base($"Cannot accept quest: maximum {maxAllowed} concurrent active quests reached (current: {currentCount}).")
    {
        MaxAllowed = maxAllowed;
        CurrentCount = currentCount;
    }
}

/// <summary>
/// Thrown when an objective is not found.
/// </summary>
public class ObjectiveNotFoundException : QuestException
{
    public Guid ObjectiveId { get; }

    public ObjectiveNotFoundException(Guid objectiveId)
        : base($"Objective with ID '{objectiveId}' was not found.")
    {
        ObjectiveId = objectiveId;
    }
}

/// <summary>
/// Thrown when attempting to update progress for a completed objective.
/// </summary>
public class ObjectiveAlreadyCompleteException : QuestException
{
    public Guid ObjectiveId { get; }

    public ObjectiveAlreadyCompleteException(Guid objectiveId)
        : base($"Objective '{objectiveId}' is already complete.")
    {
        ObjectiveId = objectiveId;
    }
}
