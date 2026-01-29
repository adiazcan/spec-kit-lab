using DiceEngine.Application.Exceptions;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;
using Microsoft.Extensions.Options;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for quest management operations.
/// </summary>
public class QuestService : IQuestService
{
    private readonly IQuestRepository _repository;
    private readonly IDependencyResolver _dependencyResolver;
    private readonly QuestOptions _options;

    public QuestService(
        IQuestRepository repository,
        IDependencyResolver dependencyResolver,
        IOptions<QuestOptions> options)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _dependencyResolver = dependencyResolver ?? throw new ArgumentNullException(nameof(dependencyResolver));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<(IEnumerable<QuestSummaryDto> Quests, int TotalCount)> ListQuestsAsync(
        Guid adventureId,
        Guid? playerId = null,
        string? difficulty = null,
        int skip = 0,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var (quests, totalCount) = await _repository.GetQuestsByAdventureAsync(
            adventureId,
            difficulty,
            skip,
            limit,
            cancellationToken);

        var questSummaries = new List<QuestSummaryDto>();

        foreach (var quest in quests)
        {
            var summary = new QuestSummaryDto
            {
                QuestId = quest.QuestId,
                Name = quest.Name,
                Description = quest.Description,
                Difficulty = quest.Difficulty.ToString(),
                StageCount = quest.Stages.Count,
                IsLocked = false,
                LockReason = null
            };

            // Check if locked due to prerequisites
            if (playerId.HasValue && _options.EnableDependencyValidation)
            {
                var (allMet, unmetReasons) = await _dependencyResolver.CheckPrerequisitesAsync(
                    playerId.Value,
                    quest.QuestId,
                    cancellationToken);

                if (!allMet)
                {
                    summary.IsLocked = true;
                    summary.LockReason = string.Join("; ", unmetReasons);
                }
            }

            questSummaries.Add(summary);
        }

        return (questSummaries, totalCount);
    }

    public async Task<QuestProgressDto> AcceptQuestAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default)
    {
        // Load quest definition
        var quest = await _repository.GetQuestByIdAsync(questId, cancellationToken)
            ?? throw new QuestNotFoundException(questId);

        // Check if quest already active
        var existingProgress = await _repository.GetQuestProgressAsync(playerId, questId, cancellationToken);
        if (existingProgress != null && existingProgress.Status == QuestProgressStatus.Active)
        {
            throw new QuestAlreadyActiveException(playerId, questId);
        }

        // Check max concurrent active quests
        var activeQuestCount = await _repository.CountActiveQuestsAsync(playerId, cancellationToken);
        if (activeQuestCount >= _options.MaxConcurrentActiveQuests)
        {
            throw new MaxActiveQuestsExceededException(_options.MaxConcurrentActiveQuests, activeQuestCount);
        }

        // Check prerequisites
        if (_options.EnableDependencyValidation)
        {
            var (allMet, unmetReasons) = await _dependencyResolver.CheckPrerequisitesAsync(
                playerId,
                questId,
                cancellationToken);

            if (!allMet)
            {
                throw new PrerequisiteNotMetException(questId, unmetReasons);
            }
        }

        // Resume abandoned quest or create new progress
        QuestProgress questProgress;
        if (existingProgress != null && existingProgress.Status == QuestProgressStatus.Abandoned)
        {
            // Resume from where player left off
            existingProgress.Status = QuestProgressStatus.Active;
            existingProgress.AbandonedAt = null;
            existingProgress.LastModified = DateTime.UtcNow;
            await _repository.UpdateQuestProgressAsync(existingProgress, cancellationToken);
            questProgress = existingProgress;
        }
        else
        {
            // Create new quest progress
            questProgress = new QuestProgress
            {
                QuestProgressId = Guid.NewGuid(),
                PlayerId = playerId,
                QuestId = questId,
                Quest = quest,
                CurrentStageNumber = 1,
                Status = QuestProgressStatus.Active,
                AcceptedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow
            };

            // Initialize stage progress
            foreach (var stage in quest.Stages.OrderBy(s => s.StageNumber))
            {
                var stageProgress = new StageProgress
                {
                    StageProgressId = Guid.NewGuid(),
                    QuestProgressId = questProgress.QuestProgressId,
                    StageId = stage.StageId,
                    StageNumber = stage.StageNumber,
                    IsCompleted = false,
                    Stage = stage
                };

                // Initialize objective progress
                foreach (var objective in stage.Objectives.OrderBy(o => o.ObjectiveNumber))
                {
                    stageProgress.ObjectiveProgress.Add(new ObjectiveProgress
                    {
                        ObjectiveProgressId = Guid.NewGuid(),
                        StageProgressId = stageProgress.StageProgressId,
                        ObjectiveId = objective.ObjectiveId,
                        Objective = objective,
                        CurrentProgress = 0,
                        TargetAmount = objective.TargetAmount,
                        IsCompleted = false
                    });
                }

                questProgress.StageProgress.Add(stageProgress);
            }

            await _repository.CreateQuestProgressAsync(questProgress, cancellationToken);
        }

        return MapToQuestProgressDto(questProgress);
    }

    public async Task AbandonQuestAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default)
    {
        var questProgress = await _repository.GetQuestProgressAsync(playerId, questId, cancellationToken)
            ?? throw new QuestProgressNotFoundException(Guid.Empty);

        if (questProgress.Status != QuestProgressStatus.Active)
        {
            throw new QuestNotActiveException(questProgress.QuestProgressId, questProgress.Status.ToString());
        }

        questProgress.MarkAbandoned();
        await _repository.UpdateQuestProgressAsync(questProgress, cancellationToken);
    }

    public async Task<QuestProgressDto?> GetQuestProgressAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default)
    {
        var questProgress = await _repository.GetQuestProgressAsync(playerId, questId, cancellationToken);
        return questProgress != null ? MapToQuestProgressDto(questProgress) : null;
    }

    public async Task<IEnumerable<QuestProgressDto>> ListActiveQuestsAsync(
        Guid playerId,
        CancellationToken cancellationToken = default)
    {
        var activeQuests = await _repository.GetActiveQuestProgressAsync(playerId, cancellationToken);
        return activeQuests.Select(MapToQuestProgressDto);
    }

    private static QuestProgressDto MapToQuestProgressDto(QuestProgress progress)
    {
        var currentStage = progress.StageProgress.FirstOrDefault(sp => sp.StageNumber == progress.CurrentStageNumber);
        var totalStages = progress.Quest.Stages.Count;
        var progressPercentage = totalStages > 0 ? ((double)progress.CurrentStageNumber / totalStages) * 100 : 0;

        return new QuestProgressDto
        {
            QuestProgressId = progress.QuestProgressId,
            QuestId = progress.QuestId,
            PlayerId = progress.PlayerId,
            QuestName = progress.Quest.Name,
            QuestDescription = progress.Quest.Description,
            CurrentStageNumber = progress.CurrentStageNumber,
            TotalStages = totalStages,
            ProgressPercentage = Math.Round(progressPercentage, 1),
            Status = progress.Status.ToString(),
            CurrentStage = currentStage != null ? MapToStageProgressDto(currentStage) : null,
            AcceptedAt = progress.AcceptedAt,
            CompletedAt = progress.CompletedAt,
            FailedAt = progress.FailedAt,
            AbandonedAt = progress.AbandonedAt
        };
    }

    private static StageProgressDto MapToStageProgressDto(StageProgress stageProgress)
    {
        return new StageProgressDto
        {
            StageNumber = stageProgress.StageNumber,
            Title = stageProgress.Stage.Title,
            Description = stageProgress.Stage.Description,
            IsCompleted = stageProgress.IsCompleted,
            CompletedAt = stageProgress.CompletedAt,
            Objectives = stageProgress.ObjectiveProgress.Select(MapToObjectiveProgressDto).ToList()
        };
    }

    private static ObjectiveProgressDto MapToObjectiveProgressDto(ObjectiveProgress objectiveProgress)
    {
        var progressPercentage = objectiveProgress.TargetAmount > 0
            ? ((double)objectiveProgress.CurrentProgress / objectiveProgress.TargetAmount) * 100
            : 0;

        return new ObjectiveProgressDto
        {
            ObjectiveId = objectiveProgress.ObjectiveId,
            Description = objectiveProgress.Objective.Description,
            ConditionType = objectiveProgress.Objective.ConditionType.ToString(),
            CurrentProgress = objectiveProgress.CurrentProgress,
            TargetAmount = objectiveProgress.TargetAmount,
            IsCompleted = objectiveProgress.IsCompleted,
            ProgressPercentage = Math.Round(progressPercentage, 1)
        };
    }
}
