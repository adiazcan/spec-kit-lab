using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Quest objective - single task/condition within a stage.
/// </summary>
public class QuestObjective
{
    public Guid ObjectiveId { get; set; }
    public Guid StageId { get; set; }

    public int ObjectiveNumber { get; set; }
    public string Description { get; set; } = string.Empty;

    // Condition definition
    public ObjectiveConditionType ConditionType { get; set; }
    public int TargetAmount { get; set; }
    public string? Metadata { get; set; }

    // Navigation
    public QuestStage Stage { get; set; } = null!;
}
