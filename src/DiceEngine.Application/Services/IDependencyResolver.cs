namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for resolving quest dependencies.
/// </summary>
public interface IDependencyResolver
{
    /// <summary>
    /// Checks if all prerequisites for a quest are met by a player.
    /// </summary>
    Task<(bool AllMet, List<string> UnmetReasons)> CheckPrerequisitesAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets dependency information for a quest.
    /// </summary>
    Task<QuestDependencyInfoDto> GetDependencyInfoAsync(
        Guid questId,
        Guid? playerId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates the dependency graph for circular dependencies.
    /// Typically called on application startup.
    /// </summary>
    Task<bool> ValidateDependencyGraphAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Loads and caches the dependency graph in memory.
    /// </summary>
    Task LoadDependencyGraphAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// DTO for quest dependency information.
/// </summary>
public class QuestDependencyInfoDto
{
    public Guid QuestId { get; set; }
    public List<PrerequisiteDto> Prerequisites { get; set; } = new();
    public bool? AllPrerequisitesMet { get; set; }
}

/// <summary>
/// DTO for a single prerequisite.
/// </summary>
public class PrerequisiteDto
{
    public Guid PrerequisiteQuestId { get; set; }
    public string QuestName { get; set; } = string.Empty;
    public string DependencyType { get; set; } = string.Empty;
    public string? PlayerStatus { get; set; }
}
