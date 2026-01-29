namespace DiceEngine.Application.Models;

/// <summary>
/// Summary information about a quest (list view).
/// </summary>
public class QuestSummaryDto
{
    public Guid QuestId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int StageCount { get; set; }
    public bool IsLocked { get; set; }
    public string? LockReason { get; set; }
}
