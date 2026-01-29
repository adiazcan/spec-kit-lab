using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for stage progress operations.
/// </summary>
public interface IStageProgressService
{
    /// <summary>
    /// Updates progress for a specific objective.
    /// </summary>
    Task<ObjectiveProgressDto> UpdateObjectiveProgressAsync(
        Guid playerId,
        Guid questId,
        int stageNumber,
        Guid objectiveId,
        int progressAmount,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Attempts to complete the current stage and advance to the next.
    /// </summary>
    Task<StageCompletionResultDto> CompleteStageAsync(
        Guid playerId,
        Guid questId,
        int stageNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a stage is complete (all objectives met).
    /// </summary>
    Task<bool> IsStageCompleteAsync(
        Guid questProgressId,
        int stageNumber,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if any failure conditions have been triggered.
    /// </summary>
    Task<(bool IsTriggered, string? FailureReason)> CheckFailureConditionsAsync(
        Guid questProgressId,
        int stageNumber,
        CancellationToken cancellationToken = default);
}
