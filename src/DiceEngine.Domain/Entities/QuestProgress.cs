using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Quest progress - tracks player's progression through a quest.
/// </summary>
public class QuestProgress
{
    public Guid QuestProgressId { get; set; }

    // Foreign keys
    public Guid PlayerId { get; set; }
    public Guid QuestId { get; set; }

    // Progress state
    public int CurrentStageNumber { get; set; }
    public QuestProgressStatus Status { get; set; }

    // Stage progress tracking
    public ICollection<StageProgress> StageProgress { get; set; } = new List<StageProgress>();

    // Timeline
    public DateTime AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public DateTime? AbandonedAt { get; set; }
    public DateTime LastModified { get; set; }

    // Optimistic locking
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigation
    public Quest Quest { get; set; } = null!;

    /// <summary>
    /// Progresses to the next stage.
    /// </summary>
    public void ProgressToNextStage()
    {
        if (Quest.Stages.Count == 0)
            throw new InvalidOperationException("Quest has no stages.");

        if (CurrentStageNumber >= Quest.Stages.Count)
            throw new InvalidOperationException("Already on final stage.");

        CurrentStageNumber++;
        LastModified = DateTime.UtcNow;
    }

    /// <summary>
    /// Marks the quest as completed.
    /// </summary>
    public void MarkCompleted()
    {
        Status = QuestProgressStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        LastModified = DateTime.UtcNow;
    }

    /// <summary>
    /// Marks the quest as failed.
    /// </summary>
    public void MarkFailed()
    {
        Status = QuestProgressStatus.Failed;
        FailedAt = DateTime.UtcNow;
        LastModified = DateTime.UtcNow;
    }

    /// <summary>
    /// Marks the quest as abandoned.
    /// </summary>
    public void MarkAbandoned()
    {
        Status = QuestProgressStatus.Abandoned;
        AbandonedAt = DateTime.UtcNow;
        LastModified = DateTime.UtcNow;
    }
}
