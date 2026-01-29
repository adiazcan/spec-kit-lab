using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for quest data access using EF Core.
/// </summary>
public class QuestRepository : IQuestRepository
{
    private readonly DiceEngineDbContext _context;

    public QuestRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Quest?> GetQuestByIdAsync(Guid questId, CancellationToken cancellationToken = default)
    {
        return await _context.Quests
            .Include(q => q.Stages.OrderBy(s => s.StageNumber))
                .ThenInclude(s => s.Objectives.OrderBy(o => o.ObjectiveNumber))
            .Include(q => q.Stages)
                .ThenInclude(s => s.StageRewards)
            .Include(q => q.Rewards)
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.QuestId == questId, cancellationToken);
    }

    public async Task<(IEnumerable<Quest> Quests, int TotalCount)> GetQuestsByAdventureAsync(
        Guid adventureId,
        string? difficulty = null,
        int skip = 0,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Quests
            .Include(q => q.Stages)
            .AsNoTracking();

        // Apply difficulty filter
        if (!string.IsNullOrEmpty(difficulty) && Enum.TryParse<QuestDifficulty>(difficulty, out var difficultyEnum))
        {
            query = query.Where(q => q.Difficulty == difficultyEnum);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var quests = await query
            .OrderBy(q => q.Difficulty)
            .ThenBy(q => q.Name)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return (quests, totalCount);
    }

    public async Task<QuestProgress?> GetQuestProgressAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuestProgresses
            .Include(qp => qp.Quest)
                .ThenInclude(q => q.Stages.OrderBy(s => s.StageNumber))
                    .ThenInclude(s => s.Objectives.OrderBy(o => o.ObjectiveNumber))
            .Include(qp => qp.StageProgress)
                .ThenInclude(sp => sp.ObjectiveProgress)
                    .ThenInclude(op => op.Objective)
            .FirstOrDefaultAsync(
                qp => qp.PlayerId == playerId && qp.QuestId == questId,
                cancellationToken);
    }

    public async Task<IEnumerable<QuestProgress>> GetActiveQuestProgressAsync(
        Guid playerId,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuestProgresses
            .Where(qp => qp.PlayerId == playerId && qp.Status == QuestProgressStatus.Active)
            .Include(qp => qp.Quest)
                .ThenInclude(q => q.Stages.OrderBy(s => s.StageNumber))
                    .ThenInclude(s => s.Objectives.OrderBy(o => o.ObjectiveNumber))
            .Include(qp => qp.StageProgress)
                .ThenInclude(sp => sp.ObjectiveProgress)
                    .ThenInclude(op => op.Objective)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<QuestProgress> CreateQuestProgressAsync(
        QuestProgress questProgress,
        CancellationToken cancellationToken = default)
    {
        await _context.QuestProgresses.AddAsync(questProgress, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return questProgress;
    }

    public async Task UpdateQuestProgressAsync(
        QuestProgress questProgress,
        CancellationToken cancellationToken = default)
    {
        _context.QuestProgresses.Update(questProgress);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<QuestDependency>> GetAllDependenciesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<QuestDependency>()
            .Include(d => d.PrerequisiteQuest)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<QuestDependency>> GetQuestDependenciesAsync(
        Guid questId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<QuestDependency>()
            .Where(d => d.DependentQuestId == questId)
            .Include(d => d.PrerequisiteQuest)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountActiveQuestsAsync(
        Guid playerId,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuestProgresses
            .CountAsync(qp => qp.PlayerId == playerId && qp.Status == QuestProgressStatus.Active,
                cancellationToken);
    }
}
