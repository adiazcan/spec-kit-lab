namespace DiceEngine.Application.Models;

/// <summary>
/// Result information when completing a stage.
/// </summary>
public class StageCompletionResultDto
{
    public Guid QuestProgressId { get; set; }
    public int CurrentStageNumber { get; set; }
    public string QuestStatus { get; set; } = string.Empty;
    public List<RewardDto> StageRewards { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
