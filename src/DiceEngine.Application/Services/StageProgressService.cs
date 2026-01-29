using DiceEngine.Application.Exceptions;
using DiceEngine.Application.Models;
using DiceEngine.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for stage progress operations.
/// </summary>
public class StageProgressService : IStageProgressService
{
    private readonly IQuestRepository _repository;
    private readonly IRewardService? _rewardService;
    private readonly IConditionEvaluator? _conditionEvaluator;

    public StageProgressService(
        IQuestRepository repository,
        IRewardService? rewardService = null,
        IConditionEvaluator? conditionEvaluator = null)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _rewardService = rewardService;
        _conditionEvaluator = conditionEvaluator;
    }

    public async Task<ObjectiveProgressDto> UpdateObjectiveProgressAsync(
        Guid playerId,
        Guid questId,
        int stageNumber,
        Guid objectiveId,
        int progressAmount,
        CancellationToken cancellationToken = default)
    {
        if (progressAmount < 1)
        {
            throw new ArgumentException("Progress amount must be at least 1.", nameof(progressAmount));
        }

        var questProgress = await _repository.GetQuestProgressAsync(playerId, questId, cancellationToken)
            ?? throw new QuestProgressNotFoundException(Guid.Empty);

        if (questProgress.Status != QuestProgressStatus.Active)
        {
            throw new QuestNotActiveException(questProgress.QuestProgressId, questProgress.Status.ToString());
        }

        if (questProgress.CurrentStageNumber != stageNumber)
        {
            throw new InvalidOperationException($"Cannot update stage {stageNumber} - current stage is {questProgress.CurrentStageNumber}.");
        }

        var currentStageProgress = questProgress.StageProgress
            .FirstOrDefault(sp => sp.StageNumber == stageNumber)
            ?? throw new InvalidOperationException($"Stage progress for stage {stageNumber} not found.");

        var objectiveProgress = currentStageProgress.ObjectiveProgress
            .FirstOrDefault(op => op.ObjectiveId == objectiveId)
            ?? throw new ObjectiveNotFoundException(objectiveId);

        if (objectiveProgress.IsCompleted)
        {
            throw new ObjectiveAlreadyCompleteException(objectiveId);
        }

        // Update progress
        objectiveProgress.IncrementProgress(progressAmount);
        questProgress.LastModified = DateTime.UtcNow;

        try
        {
            await _repository.UpdateQuestProgressAsync(questProgress, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException("Quest progress was modified by another request. Please retry.");
        }

        return new ObjectiveProgressDto
        {
            ObjectiveId = objectiveProgress.ObjectiveId,
            Description = objectiveProgress.Objective.Description,
            ConditionType = objectiveProgress.Objective.ConditionType.ToString(),
            CurrentProgress = objectiveProgress.CurrentProgress,
            TargetAmount = objectiveProgress.TargetAmount,
            IsCompleted = objectiveProgress.IsCompleted,
            ProgressPercentage = Math.Round((double)objectiveProgress.CurrentProgress / objectiveProgress.TargetAmount * 100, 1)
        };
    }

    public async Task<StageCompletionResultDto> CompleteStageAsync(
        Guid playerId,
        Guid questId,
        int stageNumber,
        CancellationToken cancellationToken = default)
    {
        var questProgress = await _repository.GetQuestProgressAsync(playerId, questId, cancellationToken)
            ?? throw new QuestProgressNotFoundException(Guid.Empty);

        if (questProgress.Status != QuestProgressStatus.Active)
        {
            throw new QuestNotActiveException(questProgress.QuestProgressId, questProgress.Status.ToString());
        }

        if (questProgress.CurrentStageNumber != stageNumber)
        {
            throw new InvalidOperationException($"Cannot complete stage {stageNumber} - current stage is {questProgress.CurrentStageNumber}.");
        }

        var currentStageProgress = questProgress.StageProgress
            .FirstOrDefault(sp => sp.StageNumber == stageNumber)
            ?? throw new InvalidOperationException($"Stage progress for stage {stageNumber} not found.");

        // Check failure conditions first
        var currentStage = questProgress.Quest.Stages.FirstOrDefault(s => s.StageNumber == stageNumber);
        if (currentStage != null && currentStage.FailureConditions.Any() && _conditionEvaluator != null)
        {
            var (isTriggered, failureReason) = await _conditionEvaluator.EvaluateFailureConditionsAsync(
                currentStage.FailureConditions,
                questProgress,
                cancellationToken);

            if (isTriggered)
            {
                questProgress.MarkFailed();
                await _repository.UpdateQuestProgressAsync(questProgress, cancellationToken);
                throw new QuestFailureException(questId, failureReason ?? "Failure condition triggered");
            }
        }

        // Check if all objectives are complete
        var incompleteObjectivesCount = currentStageProgress.ObjectiveProgress.Count(op => !op.IsCompleted);
        if (incompleteObjectivesCount > 0)
        {
            throw new StageNotCompleteException(stageNumber, incompleteObjectivesCount);
        }

        // Mark stage complete
        currentStageProgress.IsCompleted = true;
        currentStageProgress.CompletedAt = DateTime.UtcNow;

        // Collect stage rewards
        var stageRewards = new List<RewardDto>();
        if (currentStage != null && currentStage.StageRewards.Any())
        {
            stageRewards = currentStage.StageRewards.Select(r => new RewardDto
            {
                RewardId = r.RewardId,
                Type = r.Type.ToString(),
                Amount = r.Amount,
                ItemId = r.ItemId,
                Description = $"{r.Amount} {r.Type}"
            }).ToList();
        }

        // Check if this is the final stage
        var isFinalStage = stageNumber >= questProgress.Quest.Stages.Count;

        if (isFinalStage)
        {
            // Quest complete - grant quest rewards
            questProgress.MarkCompleted();

            if (questProgress.Quest.Rewards.Any())
            {
                var questRewards = questProgress.Quest.Rewards.Select(r => new RewardDto
                {
                    RewardId = r.RewardId,
                    Type = r.Type.ToString(),
                    Amount = r.Amount,
                    ItemId = r.ItemId,
                    Description = $"{r.Amount} {r.Type}"
                }).ToList();

                stageRewards.AddRange(questRewards);

                // Grant rewards if service is available
                if (_rewardService != null)
                {
                    try
                    {
                        await _rewardService.GrantRewardsAsync(playerId, stageRewards, cancellationToken);
                    }
                    catch
                    {
                        // Log error but don't fail quest completion
                        // Rewards can be manually granted by administrators if needed
                    }
                }
            }
        }
        else
        {
            // Progress to next stage
            questProgress.ProgressToNextStage();

            // Grant stage rewards if any
            if (stageRewards.Any() && _rewardService != null)
            {
                try
                {
                    await _rewardService.GrantRewardsAsync(playerId, stageRewards, cancellationToken);
                }
                catch
                {
                    // Log error but don't fail stage completion
                }
            }
        }

        try
        {
            await _repository.UpdateQuestProgressAsync(questProgress, cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException("Quest progress was modified by another request. Please retry.");
        }

        var message = isFinalStage
            ? $"Quest '{questProgress.Quest.Name}' completed!"
            : $"Stage {stageNumber}/{questProgress.Quest.Stages.Count} completed! Advancing to Stage {questProgress.CurrentStageNumber}...";

        return new StageCompletionResultDto
        {
            QuestProgressId = questProgress.QuestProgressId,
            CurrentStageNumber = questProgress.CurrentStageNumber,
            QuestStatus = questProgress.Status.ToString(),
            StageRewards = stageRewards,
            Message = message
        };
    }

    public async Task<bool> IsStageCompleteAsync(
        Guid questProgressId,
        int stageNumber,
        CancellationToken cancellationToken = default)
    {
        // This method would need direct access to QuestProgress by ID
        // For now, this is a simplified implementation
        throw new NotImplementedException("IsStageCompleteAsync will be implemented when needed.");
    }

    public async Task<(bool IsTriggered, string? FailureReason)> CheckFailureConditionsAsync(
        Guid questProgressId,
        int stageNumber,
        CancellationToken cancellationToken = default)
    {
        // This method will be used to check failure conditions without completing stage
        // For now, return no failure conditions
        // Full implementation would load quest progress and evaluate conditions
        return await Task.FromResult((false, null as string));
    }
}
