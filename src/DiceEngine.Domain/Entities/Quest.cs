using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Quest aggregate root - represents a multi-stage quest definition.
/// </summary>
public class Quest
{
    public Guid QuestId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public QuestDifficulty Difficulty { get; set; }

    // Relationships
    public ICollection<QuestStage> Stages { get; set; } = new List<QuestStage>();
    public ICollection<QuestReward> Rewards { get; set; } = new List<QuestReward>();
    public ICollection<QuestDependency> Dependencies { get; set; } = new List<QuestDependency>();

    // Reverse navigation for dependencies
    public ICollection<QuestDependency> DependentQuests { get; set; } = new List<QuestDependency>();

    // Metadata
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public int MaxConcurrentPlayers { get; set; } = int.MaxValue;
}
