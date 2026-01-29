namespace DiceEngine.Domain.Entities;

/// <summary>
/// Objective progress - tracks progress toward a single objective.
/// </summary>
public class ObjectiveProgress
{
    public Guid ObjectiveProgressId { get; set; }
    public Guid StageProgressId { get; set; }
    public Guid ObjectiveId { get; set; }

    public int CurrentProgress { get; set; }
    public int TargetAmount { get; set; }
    public bool IsCompleted { get; set; }

    // Navigation
    public StageProgress StageProgress { get; set; } = null!;
    public QuestObjective Objective { get; set; } = null!;

    /// <summary>
    /// Increments progress toward objective completion.
    /// </summary>
    public void IncrementProgress(int amount = 1)
    {
        CurrentProgress = Math.Min(CurrentProgress + amount, TargetAmount);
        IsCompleted = (CurrentProgress >= TargetAmount);
    }
}
