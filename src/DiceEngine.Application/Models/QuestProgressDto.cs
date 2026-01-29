namespace DiceEngine.Application.Models;

/// <summary>
/// Complete quest progress information for a player.
/// </summary>
public class QuestProgressDto
{
    public Guid QuestProgressId { get; set; }
    public Guid QuestId { get; set; }
    public Guid PlayerId { get; set; }
    public string QuestName { get; set; } = string.Empty;
    public string QuestDescription { get; set; } = string.Empty;
    public int CurrentStageNumber { get; set; }
    public int TotalStages { get; set; }
    public double ProgressPercentage { get; set; }
    public string Status { get; set; } = string.Empty;
    public StageProgressDto? CurrentStage { get; set; }
    public DateTime AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public DateTime? AbandonedAt { get; set; }
}
