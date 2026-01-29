# Phase 1 Design: Data Model

**Date**: January 29, 2026  
**Purpose**: Define domain entities, value objects, and relationships for the Multi-Stage Quest System

---

## Domain Model Overview

The Multi-Stage Quest System operates on a tiered model:

1. **Quest** (aggregate root): Master definition of a multi-stage quest
2. **QuestStage** (component): Individual stage/objective within quest
3. **QuestObjective** (component): Specific task within a stage
4. **QuestProgress** (aggregate root): Player's progression through quest
5. **QuestReward** (component): Benefits granted upon completion
6. **QuestDependency** (relationship): Prerequisites between quests

```
Quest (root aggregate)
├─ QuestId: Guid
├─ Name: string
├─ Description: string
├─ Difficulty: enum (Easy, Medium, Hard, Legendary)
├─ PrerequisiteQuests: QuestDependency[]
├─ Stages: QuestStage[]
│   ├─ StageId: Guid
│   ├─ StageNumber: int (order)
│   ├─ Objectives: QuestObjective[]
│   │   ├─ ObjectiveId: Guid
│   │   ├─ Description: string
│   │   ├─ ConditionType: enum
│   │   ├─ TargetAmount: int
│   │   └─ Metadata: JSON
│   └─ FailureConditions: FailureCondition[]
│       ├─ FailureId: Guid
│       └─ ConditionType: enum
└─ Rewards: QuestReward[]
    ├─ RewardId: Guid
    ├─ RewardType: enum (Experience, Item, Currency, Achievement)
    └─ Amount: int

QuestProgress (player aggregate)
├─ QuestProgressId: Guid
├─ PlayerId: Guid
├─ QuestId: Guid (FK to Quest)
├─ CurrentStage: int
├─ Status: enum (Active, Completed, Failed, Abandoned)
├─ ObjectiveProgress: ObjectiveProgress[]
├─ AcceptedAt: DateTime
├─ CompletedAt: DateTime?
├─ FailedAt: DateTime?
├─ AbandonedAt: DateTime?
└─ LastModified: DateTime
    └─ RowVersion: byte[] (optimistic locking)
```

---

## Entity Definitions

### 1. Quest (Root Aggregate)

**Purpose**: Master definition of a multi-stage quest. Immutable after creation.  
**Ownership**: Game designers create/maintain quests; players accept instances  
**Persistence**: EF Core with navigation to stages and dependencies

```csharp
public class Quest
{
    public Guid QuestId { get; set; }
    public string Name { get; set; }  // Required, max 255
    public string Description { get; set; }  // Required, max 2000
    public QuestDifficulty Difficulty { get; set; }  // Easy, Medium, Hard, Legendary

    // Relationships
    public ICollection<QuestStage> Stages { get; set; }  // Min 1, ordered by StageNumber
    public ICollection<QuestReward> Rewards { get; set; }
    public ICollection<QuestDependency> Dependencies { get; set; }  // Prerequisite quests

    // Metadata
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }  // Designer name or system user
    public int MaxConcurrentPlayers { get; set; } = int.MaxValue;  // Can increase if needed
}

public enum QuestDifficulty
{
    Easy = 1,
    Medium = 2,
    Hard = 3,
    Legendary = 4
}
```

**Constraints**:

- Name and Description non-nullable, length validated at API boundary
- Must have at least 1 stage (validated in constructor or repository method)
- CreatedAt immutable after insertion
- No soft deletes (quests are versioned via new entries, old ones deprecated)

---

### 2. QuestStage (Component Entity)

**Purpose**: Individual milestone/objective within a quest. Sequential execution.  
**Ownership**: Belongs to Quest aggregate; accessed through Quest

```csharp
public class QuestStage
{
    public Guid StageId { get; set; }
    public Guid QuestId { get; set; }  // FK to Quest

    public int StageNumber { get; set; }  // Order (1, 2, 3, ...). Unique within quest
    public string Title { get; set; }  // e.g., "Defeat the Bandits"
    public string Description { get; set; }  // Detailed instructions

    // Requirements for success
    public ICollection<QuestObjective> Objectives { get; set; }  // Min 1

    // What causes stage to fail
    public ICollection<FailureCondition> FailureConditions { get; set; }  // Can be 0 or more

    // Partial rewards for completing this stage (optional)
    public ICollection<QuestReward> StageRewards { get; set; }  // Can be empty

    // Navigation
    public Quest Quest { get; set; }
}
```

**Constraints**:

- StageNumber is immutable (defines sequence)
- Unique constraint: `(QuestId, StageNumber)` - each quest has unique stage ordering
- Objectives collection: Min 1 objective required
- Ordered by `StageNumber` in all queries (enforced in DbContext)

---

### 3. QuestObjective (Component Entity)

**Purpose**: Single task/condition that must be met to progress stage.  
**Examples**: "Collect 5 logs", "Defeat 10 bandits", "Visit the shrine", "Deliver item to NPC"

```csharp
public class QuestObjective
{
    public Guid ObjectiveId { get; set; }
    public Guid StageId { get; set; }  // FK to QuestStage

    public int ObjectiveNumber { get; set; }  // Order within stage (for UI display)
    public string Description { get; set; }  // Player-facing text: "Collect 5 logs"

    // Condition definition - how to evaluate success
    public ObjectiveConditionType ConditionType { get; set; }
    public int TargetAmount { get; set; }  // How many? (default 1; varies by type)
    public string Metadata { get; set; }  // JSON: {itemId: "...", locationId: "...", npcId: "..."}

    // Navigation
    public QuestStage Stage { get; set; }
}

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
```

**Constraints**:

- ObjectiveNumber unique within stage
- TargetAmount >= 1 (validated in value object)
- Metadata is JSON string; validated by ConditionEvaluator (optional structure per type)
- Description non-empty, max 500 chars

---

### 4. FailureCondition (Component Entity)

**Purpose**: Condition that causes stage or quest to fail.  
**Examples**: "Player dies", "Time expires", "Wrong NPC chosen"

```csharp
public class FailureCondition
{
    public Guid FailureConditionId { get; set; }
    public Guid StageId { get; set; }  // FK to QuestStage

    public FailureConditionType ConditionType { get; set; }
    public string Metadata { get; set; }  // JSON: detailed parameters

    // Navigation
    public QuestStage Stage { get; set; }
}

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
```

---

### 5. QuestProgress (Root Aggregate)

**Purpose**: Tracks player's progress through a quest. One instance per `(player, quest)` pair.  
**Ownership**: Created when player accepts quest; updated on stage completion  
**Persistence**: EF Core with optimistic locking

```csharp
public class QuestProgress
{
    // Primary key
    public Guid QuestProgressId { get; set; }

    // Foreign keys
    public Guid PlayerId { get; set; }
    public Guid QuestId { get; set; }

    // Progress state
    public int CurrentStageNumber { get; set; }  // 1-indexed (1 = first stage)
    public QuestProgressStatus Status { get; set; }  // Active, Completed, Failed, Abandoned

    // Stage progress tracking
    public ICollection<StageProgress> StageProgress { get; set; }  // One per stage

    // Timeline
    public DateTime AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public DateTime? AbandonedAt { get; set; }
    public DateTime LastModified { get; set; }

    // Optimistic locking
    [ConcurrencyCheck]
    public byte[] RowVersion { get; set; }

    // Navigation
    public Quest Quest { get; set; }

    // Methods
    public void ProgressToNextStage()
    {
        if (CurrentStageNumber >= Quest.Stages.Count)
            throw new InvalidOperationException("Already on final stage");
        CurrentStageNumber++;
        LastModified = DateTime.UtcNow;
    }

    public void MarkCompleted()
    {
        Status = QuestProgressStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        LastModified = DateTime.UtcNow;
    }

    public void MarkFailed()
    {
        Status = QuestProgressStatus.Failed;
        FailedAt = DateTime.UtcNow;
        LastModified = DateTime.UtcNow;
    }
}

public enum QuestProgressStatus
{
    Active = 1,
    Completed = 2,
    Failed = 3,
    Abandoned = 4
}
```

**Constraints**:

- Unique constraint: `(PlayerId, QuestId)` - one progress instance per player per quest
- PlayerID immutable after creation
- QuestID immutable after creation
- CurrentStageNumber >= 1 and <= total stages
- Cannot resume if Status = Failed (must abandon and restart)
- RowVersion incremented on every Update (EF Core automatic)

**Indexes**:

```sql
CREATE INDEX idx_quest_progress_player ON quest_progress(player_id, status);
CREATE INDEX idx_quest_progress_quest ON quest_progress(quest_id);
CREATE UNIQUE INDEX idx_quest_progress_unique ON quest_progress(player_id, quest_id);
```

---

### 6. StageProgress (Component Entity)

**Purpose**: Track individual stage completion status and objective progress.  
**Ownership**: Belongs to QuestProgress; accessed through progress queries

```csharp
public class StageProgress
{
    public Guid StageProgressId { get; set; }
    public Guid QuestProgressId { get; set; }
    public Guid StageId { get; set; }

    public int StageNumber { get; set; }  // Copy of QuestStage.StageNumber for queries
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Objective-level progress
    public ICollection<ObjectiveProgress> ObjectiveProgress { get; set; }

    // Navigation
    public QuestProgress QuestProgress { get; set; }
    public QuestStage Stage { get; set; }
}
```

---

### 7. ObjectiveProgress (Component Entity)

**Purpose**: Track progress toward completing a single objective.

```csharp
public class ObjectiveProgress
{
    public Guid ObjectiveProgressId { get; set; }
    public Guid StageProgressId { get; set; }
    public Guid ObjectiveId { get; set; }

    public int CurrentProgress { get; set; }  // 0 to TargetAmount
    public int TargetAmount { get; set; }  // Copy from QuestObjective for display
    public bool IsCompleted { get; set; }

    // Navigation
    public StageProgress StageProgress { get; set; }
    public QuestObjective Objective { get; set; }

    public void IncrementProgress(int amount = 1)
    {
        CurrentProgress = Math.Min(CurrentProgress + amount, TargetAmount);
        IsCompleted = (CurrentProgress >= TargetAmount);
    }
}
```

---

### 8. QuestReward (Component Entity)

**Purpose**: Definition of benefits granted on quest completion  
**Ownership**: Belongs to Quest or QuestStage

```csharp
public class QuestReward
{
    public Guid RewardId { get; set; }
    public Guid? QuestId { get; set; }  // Null if stage reward
    public Guid? StageId { get; set; }  // Null if quest reward

    public RewardType Type { get; set; }
    public int Amount { get; set; }  // XP amount, item count, currency units, etc.
    public string ItemId { get; set; }  // Required if Type = Item

    // Navigation
    public Quest Quest { get; set; }
    public QuestStage Stage { get; set; }
}

public enum RewardType
{
    Experience = 1,      // Amount = XP points
    Item = 2,           // Amount = count; ItemId = which item
    Currency = 3,       // Amount = gold/credits
    Achievement = 4     // Amount = unused; ItemId = achievement ID
}
```

---

### 9. QuestDependency (Relationship Entity)

**Purpose**: Defines prerequisite relationships between quests  
**Pattern**: Dependency Graph (Directed Acyclic Graph - DAG)

```csharp
public class QuestDependency
{
    public Guid DependencyId { get; set; }

    public Guid DependentQuestId { get; set; }   // Quest that is blocked
    public Guid PrerequisiteQuestId { get; set; }  // Quest that must be done first

    public DependencyType Type { get; set; }  // Must complete, or must not fail

    // Navigation
    public Quest DependentQuest { get; set; }
    public Quest PrerequisiteQuest { get; set; }
}

public enum DependencyType
{
    MustComplete = 1,     // Prerequisite must be status = Completed
    MustNotFail = 2       // Prerequisite must not be status = Failed
}
```

**Constraints**:

- Unique constraint: `(DependentQuestId, PrerequisiteQuestId)` - prevent duplicate dependencies
- No circular dependencies: Validated by topological sort on startup
- No self-referential: `DependentQuestId != PrerequisiteQuestId`

---

## Summary of Value Objects

No explicit value object classes; using simple types with validation rules:

| Domain Concept         | Storage Type                                | Validation Rule                  |
| ---------------------- | ------------------------------------------- | -------------------------------- |
| QuestStatus            | enum (Active, Completed, Failed, Abandoned) | Must be valid enum value         |
| StageNumber            | int                                         | >= 1, <= Stage.MaxNumber         |
| ObjectiveNumber        | int                                         | >= 1, <= ObjectivesInStage.Count |
| ObjectiveConditionType | enum                                        | Must be valid enum value         |
| CurrentProgress        | int                                         | >= 0, <= TargetAmount            |
| TargetAmount           | int                                         | >= 1                             |
| RowVersion             | byte[]                                      | Managed by EF Core               |

---

## Validation Rules

### At Entity Level

**Quest**:

- Name: Non-null, 1-255 chars
- Description: Non-null, 1-2000 chars
- Stages: Min 1 collection; ordered by StageNumber unique
- Difficulty: Valid enum value

**QuestStage**:

- StageNumber: 1-indexed, unique within quest
- Title: Non-null, 1-255 chars
- Description: Non-null, 1-1000 chars
- Objectives: Min 1 collection; ordered by ObjectiveNumber

**QuestObjective**:

- Description: Non-null, 1-500 chars
- ConditionType: Valid enum value
- TargetAmount: >= 1
- Metadata: Valid JSON (if present)

**QuestProgress**:

- PlayerId: Non-null Guid
- QuestId: Non-null Guid
- CurrentStageNumber: >= 1, <= Quest.Stages.Count
- Status: Valid enum value
- AcceptedAt: Must be before CompletedAt/FailedAt if set

### At Repository Level (SaveChanges)

- Unique `(PlayerId, QuestId)` - prevent duplicate progress
- Unique `(QuestId, StageNumber)` - prevent duplicate stage numbers
- Referential integrity: StageId->QuestId, ObjectiveId->StageId

### At Service Level

- Dependency resolution: Prerequisite quest completed before allowing acceptance
- Stage transition: Only advance to next stage if current stage all objectives complete
- Reward granting: Atomic transaction (all rewards or none)
- Failure state: Mark quest failed if failure condition triggered

---

## Database Schema Overview

```sql
-- Quest definitions (designed by team, not modified by players)
CREATE TABLE quests (
    quest_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    difficulty INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255)
);

CREATE TABLE quest_stages (
    stage_id UUID PRIMARY KEY,
    quest_id UUID REFERENCES quests(quest_id),
    stage_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    UNIQUE(quest_id, stage_number)
);

CREATE TABLE quest_objectives (
    objective_id UUID PRIMARY KEY,
    stage_id UUID REFERENCES quest_stages(stage_id),
    objective_number INT NOT NULL,
    description VARCHAR(500) NOT NULL,
    condition_type INT NOT NULL,
    target_amount INT NOT NULL,
    metadata TEXT,
    UNIQUE(stage_id, objective_number)
);

CREATE TABLE failure_conditions (
    failure_condition_id UUID PRIMARY KEY,
    stage_id UUID REFERENCES quest_stages(stage_id),
    condition_type INT NOT NULL,
    metadata TEXT
);

CREATE TABLE quest_rewards (
    reward_id UUID PRIMARY KEY,
    quest_id UUID REFERENCES quests(quest_id),
    stage_id UUID REFERENCES quest_stages(stage_id),
    reward_type INT NOT NULL,
    amount INT NOT NULL,
    item_id VARCHAR(255)
);

CREATE TABLE quest_dependencies (
    dependency_id UUID PRIMARY KEY,
    dependent_quest_id UUID REFERENCES quests(quest_id),
    prerequisite_quest_id UUID REFERENCES quests(quest_id),
    dependency_type INT NOT NULL,
    UNIQUE(dependent_quest_id, prerequisite_quest_id)
);

-- Player progress (created at runtime when player accepts quest)
CREATE TABLE quest_progress (
    quest_progress_id UUID PRIMARY KEY,
    player_id UUID NOT NULL,
    quest_id UUID REFERENCES quests(quest_id),
    current_stage_number INT NOT NULL,
    status INT NOT NULL,
    accepted_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    abandoned_at TIMESTAMP,
    last_modified TIMESTAMP NOT NULL,
    row_version BYTEA NOT NULL,
    UNIQUE(player_id, quest_id)
);

CREATE INDEX idx_quest_progress_player ON quest_progress(player_id, status);
CREATE INDEX idx_quest_progress_quest ON quest_progress(quest_id);

CREATE TABLE stage_progress (
    stage_progress_id UUID PRIMARY KEY,
    quest_progress_id UUID REFERENCES quest_progress(quest_progress_id),
    stage_id UUID REFERENCES quest_stages(stage_id),
    stage_number INT NOT NULL,
    is_completed BOOLEAN NOT NULL,
    completed_at TIMESTAMP
);

CREATE TABLE objective_progress (
    objective_progress_id UUID PRIMARY KEY,
    stage_progress_id UUID REFERENCES stage_progress(stage_progress_id),
    objective_id UUID REFERENCES quest_objectives(objective_id),
    current_progress INT NOT NULL,
    target_amount INT NOT NULL,
    is_completed BOOLEAN NOT NULL
);
```

---

## Relationships & Cardinality

```
Quest (1) -----> (Many) QuestStage
Quest (1) -----> (Many) QuestReward
Quest (1) -----> (Many) QuestDependency (dependent side)
Quest (1) -----> (Many) QuestDependency (prerequisite side)

QuestStage (1) -----> (Many) QuestObjective
QuestStage (1) -----> (Many) FailureCondition
QuestStage (1) -----> (Many) QuestReward

QuestObjective (1) -----> (Many) ObjectiveProgress

QuestProgress (Many) -----> (1) Quest
QuestProgress (1) -----> (Many) StageProgress

StageProgress (1) -----> (Many) ObjectiveProgress
```

---

## Data Model Complete ✅

All entities defined, relationships established, constraints documented.  
Ready for Phase 1 Contracts generation.
