using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Quest dependency - prerequisite relationship between quests.
/// </summary>
public class QuestDependency
{
    public Guid DependencyId { get; set; }

    public Guid DependentQuestId { get; set; }
    public Guid PrerequisiteQuestId { get; set; }

    public DependencyType Type { get; set; }

    // Navigation
    public Quest DependentQuest { get; set; } = null!;
    public Quest PrerequisiteQuest { get; set; } = null!;
}
