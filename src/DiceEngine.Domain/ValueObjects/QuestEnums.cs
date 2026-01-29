namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Quest difficulty levels.
/// </summary>
public enum QuestDifficulty
{
    Easy = 1,
    Medium = 2,
    Hard = 3,
    Legendary = 4
}

/// <summary>
/// Quest progress status.
/// </summary>
public enum QuestProgressStatus
{
    Active = 1,
    Completed = 2,
    Failed = 3,
    Abandoned = 4
}

/// <summary>
/// Types of conditions that define objective completion.
/// </summary>
public enum ObjectiveConditionType
{
    KillCount = 1,           // TargetAmount = number of enemies
    ItemCollected = 2,       // TargetAmount = count; Metadata = item IDs
    LocationVisit = 3,       // TargetAmount = 1; Metadata = location ID
    NpcInteraction = 4,      // TargetAmount = 1; Metadata = npc ID
    DamageDealt = 5,         // TargetAmount = total damage
    TimeElapsed = 6,         // TargetAmount = seconds
    Custom = 99              // For future extensibility
}

/// <summary>
/// Types of conditions that cause stage or quest failure.
/// </summary>
public enum FailureConditionType
{
    PlayerDeath = 1,           // Player dies before stage completion
    TimeExpired = 2,           // Max time elapsed (Metadata = seconds)
    WrongChoiceMade = 3,       // Player chose wrong dialogue/action
    NpcKilled = 4,             // Protected NPC was killed
    ItemLost = 5,              // Required item dropped/sold
    AreaExited = 6,            // Left designated quest area
    Custom = 99
}

/// <summary>
/// Types of rewards granted upon quest completion.
/// </summary>
public enum RewardType
{
    Experience = 1,      // Amount = XP points
    Item = 2,           // Amount = count; ItemId = which item
    Currency = 3,       // Amount = gold/credits
    Achievement = 4     // Amount = unused; ItemId = achievement ID
}

/// <summary>
/// Dependency relationship types between quests.
/// </summary>
public enum DependencyType
{
    MustComplete = 1,     // Prerequisite must be status = Completed
    MustNotFail = 2       // Prerequisite must not be status = Failed
}
