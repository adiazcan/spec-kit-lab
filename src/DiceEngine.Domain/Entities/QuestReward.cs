using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Quest reward - benefits granted upon completion.
/// </summary>
public class QuestReward
{
    public Guid RewardId { get; set; }
    public Guid? QuestId { get; set; }
    public Guid? StageId { get; set; }

    public RewardType Type { get; set; }
    public int Amount { get; set; }
    public string? ItemId { get; set; }

    // Navigation
    public Quest? Quest { get; set; }
    public QuestStage? Stage { get; set; }
}
