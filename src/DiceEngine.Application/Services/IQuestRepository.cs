using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Repository interface for quest data access.
/// </summary>
public interface IQuestRepository
{
    /// <summary>
    /// Gets a quest by ID including its stages, objectives, and rewards.
    /// </summary>
    Task<Quest?> GetQuestByIdAsync(Guid questId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all quests for an adventure with optional filtering.
    /// </summary>
    Task<(IEnumerable<Quest> Quests, int TotalCount)> GetQuestsByAdventureAsync(
        Guid adventureId,
        string? difficulty = null,
        int skip = 0,
        int limit = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets quest progress for a specific player and quest.
    /// </summary>
    Task<QuestProgress?> GetQuestProgressAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all active quest progress for a player.
    /// </summary>
    Task<IEnumerable<QuestProgress>> GetActiveQuestProgressAsync(
        Guid playerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new quest progress record.
    /// </summary>
    Task<QuestProgress> CreateQuestProgressAsync(
        QuestProgress questProgress,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing quest progress record.
    /// </summary>
    Task UpdateQuestProgressAsync(
        QuestProgress questProgress,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all quest dependencies for the system.
    /// </summary>
    Task<IEnumerable<QuestDependency>> GetAllDependenciesAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets dependencies for a specific quest.
    /// </summary>
    Task<IEnumerable<QuestDependency>> GetQuestDependenciesAsync(
        Guid questId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Counts active quests for a player.
    /// </summary>
    Task<int> CountActiveQuestsAsync(
        Guid playerId,
        CancellationToken cancellationToken = default);
}
