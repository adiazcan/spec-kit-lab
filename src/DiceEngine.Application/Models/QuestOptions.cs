namespace DiceEngine.Application.Models;

/// <summary>
/// Configuration options for the quest system.
/// </summary>
public class QuestOptions
{
    /// <summary>
    /// Maximum number of concurrent active quests per player.
    /// Default: 10
    /// </summary>
    public int MaxConcurrentActiveQuests { get; set; } = 10;

    /// <summary>
    /// Maximum number of stages allowed in a single quest.
    /// Default: 20
    /// </summary>
    public int MaxQuestStages { get; set; } = 20;

    /// <summary>
    /// Whether to validate quest dependencies before acceptance.
    /// Default: true
    /// </summary>
    public bool EnableDependencyValidation { get; set; } = true;

    /// <summary>
    /// Whether to cache dependency graph in memory for faster validation.
    /// Default: true
    /// </summary>
    public bool CacheDependencyGraphInMemory { get; set; } = true;
}
