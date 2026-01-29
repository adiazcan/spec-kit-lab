using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Failure condition - condition that causes stage or quest to fail.
/// </summary>
public class FailureCondition
{
    public Guid FailureConditionId { get; set; }
    public Guid StageId { get; set; }

    public FailureConditionType ConditionType { get; set; }
    public string? Metadata { get; set; }

    // Navigation
    public QuestStage Stage { get; set; } = null!;
}
