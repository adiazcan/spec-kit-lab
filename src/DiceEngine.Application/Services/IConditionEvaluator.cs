using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for evaluating quest success and failure conditions.
/// </summary>
public interface IConditionEvaluator
{
    /// <summary>
    /// Evaluates failure conditions for a stage.
    /// </summary>
    Task<(bool IsTriggered, string? FailureReason)> EvaluateFailureConditionsAsync(
        IEnumerable<FailureCondition> conditions,
        QuestProgress questProgress,
        CancellationToken cancellationToken = default);
}
