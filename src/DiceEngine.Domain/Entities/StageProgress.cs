namespace DiceEngine.Domain.Entities;

/// <summary>
/// Stage progress - tracks completion status for a stage.
/// </summary>
public class StageProgress
{
    public Guid StageProgressId { get; set; }
    public Guid QuestProgressId { get; set; }
    public Guid StageId { get; set; }

    public int StageNumber { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Objective-level progress
    public ICollection<ObjectiveProgress> ObjectiveProgress { get; set; } = new List<ObjectiveProgress>();

    // Navigation
    public QuestProgress QuestProgress { get; set; } = null!;
    public QuestStage Stage { get; set; } = null!;
}
