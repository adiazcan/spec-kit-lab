namespace DiceEngine.Domain.Entities;

/// <summary>
/// Quest stage - individual milestone within a quest.
/// </summary>
public class QuestStage
{
    public Guid StageId { get; set; }
    public Guid QuestId { get; set; }

    public int StageNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Requirements for success
    public ICollection<QuestObjective> Objectives { get; set; } = new List<QuestObjective>();

    // What causes stage to fail
    public ICollection<FailureCondition> FailureConditions { get; set; } = new List<FailureCondition>();

    // Partial rewards for completing this stage (optional)
    public ICollection<QuestReward> StageRewards { get; set; } = new List<QuestReward>();

    // Navigation
    public Quest Quest { get; set; } = null!;
}
