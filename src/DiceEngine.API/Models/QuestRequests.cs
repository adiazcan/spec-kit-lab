using System.ComponentModel.DataAnnotations;

namespace DiceEngine.API.Models;

/// <summary>
/// Request to accept a quest.
/// </summary>
public class AcceptQuestRequest
{
    [Required]
    public Guid PlayerId { get; set; }
}

/// <summary>
/// Request to abandon a quest.
/// </summary>
public class AbandonQuestRequest
{
    [Required]
    public Guid PlayerId { get; set; }
}

/// <summary>
/// Request to update objective progress.
/// </summary>
public class UpdateObjectiveProgressRequest
{
    [Required]
    public Guid PlayerId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Progress amount must be at least 1.")]
    public int ProgressAmount { get; set; }
}

/// <summary>
/// Request to complete a stage.
/// </summary>
public class CompleteStageRequest
{
    [Required]
    public Guid PlayerId { get; set; }
}
