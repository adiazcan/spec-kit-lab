using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for quest management operations.
/// </summary>
public interface IQuestService
{
    /// <summary>
    /// Lists available quests for an adventure.
    /// </summary>
    Task<(IEnumerable<QuestSummaryDto> Quests, int TotalCount)> ListQuestsAsync(
        Guid adventureId,
        Guid? playerId = null,
        string? difficulty = null,
        int skip = 0,
        int limit = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Accepts a quest for a player, creating initial progress.
    /// </summary>
    Task<QuestProgressDto> AcceptQuestAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Abandons a quest, marking it as abandoned.
    /// </summary>
    Task AbandonQuestAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets current progress for a specific quest.
    /// </summary>
    Task<QuestProgressDto?> GetQuestProgressAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists all active quests for a player.
    /// </summary>
    Task<IEnumerable<QuestProgressDto>> ListActiveQuestsAsync(
        Guid playerId,
        CancellationToken cancellationToken = default);
}
