namespace DiceEngine.Application.Models;

/// <summary>
/// Objective progress information.
/// </summary>
public class ObjectiveProgressDto
{
    public Guid ObjectiveId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ConditionType { get; set; } = string.Empty;
    public int CurrentProgress { get; set; }
    public int TargetAmount { get; set; }
    public bool IsCompleted { get; set; }
    public double ProgressPercentage { get; set; }
}
