namespace DiceEngine.Application.Models;

/// <summary>
/// Stage progress information.
/// </summary>
public class StageProgressDto
{
    public int StageNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ObjectiveProgressDto> Objectives { get; set; } = new();
}
