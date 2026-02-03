# Data Model: Quest Tracking System

**Date**: 2026-02-03 | **Branch**: `011-quest-tracking-ui`

## Entity Relationships

```
Quest
├── Objectives (1:many)
│   ├── ObjectiveId
│   ├── Description
│   ├── ConditionType
│   ├── TargetAmount
│   └── CurrentProgress (from QuestProgress.ObjectiveProgress)
│
└── Stages (1:many)
    ├── StageNumber
    ├── Title
    ├── Description
    └── Objectives (array in stage)

QuestProgress
├── QuestProgressId (primary key)
├── QuestId (foreign key)
├── PlayerId (foreign key)
├── Status (enum: Active | Completed | Failed | Abandoned)
├── CurrentStageNumber
├── ProgressPercentage (calculated: 0-100)
├── Timestamps (acceptedAt, completedAt, failedAt, abandonedAt)
└── StageProgress (1:many)
    └── ObjectiveProgress (1:many)

Reward
├── RewardId
├── Type (enum: Experience | Item | Currency | Achievement)
├── Amount/ItemName
└── Associated with Quest or StageCompletion

Filter State
└── ActiveFilters (array: "Active" | "Completed" | "Failed")
```

## Frontend Data Model

### Core Types

```typescript
// Quest entity as returned from API
type Quest = {
  questId: string;
  questName: string;
  questDescription: string;
  questGiver?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Epic";
};

// Quest with progress tracking
type QuestProgress = {
  questProgressId: string;
  questId: string;
  playerId: string;
  questName: string;
  questDescription: string;
  currentStageNumber: number;
  totalStages: number;
  progressPercentage: number; // 0-100
  status: "Active" | "Completed" | "Failed" | "Abandoned";
  currentStage: StageProgress;
  acceptedAt: string; // ISO date
  completedAt?: string;
  failedAt?: string;
  abandonedAt?: string;
};

// Stage within a quest
type StageProgress = {
  stageNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  objectives: ObjectiveProgress[];
};

// Individual objective/task
type ObjectiveProgress = {
  objectiveId: string;
  description: string;
  conditionType: string; // e.g., "Defeat", "Collect", "Deliver"
  currentProgress: number;
  targetAmount: number;
  isCompleted: boolean;
  progressPercentage: number; // 0-100
};

// Quest rewards
type Reward = {
  rewardId: string;
  type: "Experience" | "Item" | "Currency" | "Achievement";
  amount: number;
  itemId?: string;
  itemName?: string;
  description?: string;
};

// Quest dependency information
type QuestDependency = {
  questId: string;
  prerequisites: PrerequisiteQuest[];
  allPrerequisitesMet: boolean;
};

type PrerequisiteQuest = {
  prerequisiteQuestId: string;
  questName: string;
  dependencyType: string; // e.g., "RequiredBefore", "UnlockedBy"
  playerStatus: "Completed" | "InProgress" | "NotStarted";
};

// Paginated response from list endpoint
type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
  skip: number;
  limit: number;
};
```

### UI Component State

```typescript
// Quest list filter state
type QuestFilterState = {
  statusFilters: ("Active" | "Completed" | "Failed")[];
  searchText?: string;
  sortBy?: "name" | "progress" | "dateAccepted"; // future enhancement
};

// Quest detail view state
type QuestDetailState = {
  selectedQuestId: string | null;
  isLoading: boolean;
  error?: string;
  questData: QuestProgress | null;
};

// Completed quests history state
type CompletedQuestsState = {
  quests: QuestProgress[];
  totalCount: number;
  currentPage: number;
  isLoading: boolean;
};
```

## Data Validation & Business Rules

### Quest Status Lifecycle

```
Active ──► Completed (objectives completed)
  │
  ├──► Failed (objectives failed)
  │
  └──► Abandoned (player choice)

Completed ──► [Final state - cannot change]
Failed    ──► [Final state - cannot change]
Abandoned ──► [Final state - cannot change]
```

### Progress Calculation

```
ObjectiveProgress = (currentProgress / targetAmount) * 100

StageProgress = Average of all objectives in stage

QuestProgress = Average of all stages in quest
```

### Validation Rules (Frontend)

1. **Quest List**:
   - Filter state must be valid enum values
   - Pagination: skip >= 0, limit between 1-50
   - Search text max 100 characters

2. **Quest Detail**:
   - selectedQuestId must be valid UUID
   - Progress percentages must be 0-100
   - Timestamps must be valid ISO dates

3. **Objectives**:
   - currentProgress cannot exceed targetAmount
   - progressPercentage must match calculation
   - isCompleted logic: progressPercentage === 100

## Data Requirements from Backend

**From `/api/adventures/{adventureId}/quests`**:

- Quest metadata (name, description, giver)
- Difficulty level (optional, for sorting/filtering)
- Rewards information

**From `/api/adventures/{adventureId}/players/{playerId}/quests/active`**:

- QuestProgress objects for current player
- Nested Stage and Objective progress

**From `/api/adventures/{adventureId}/quests/{questId}/progress`**:

- Full QuestProgress with all nested data
- Completion timestamps
- Reward information

## Assumptions

1. **Immutable Quest Definition**: Quest names, descriptions, and structure don't change during gameplay
2. **Progress is Additive**: Objective progress can only increase or reset (not decrease partway)
3. **Status is Authoritative**: Backend determines quest status; frontend displays it
4. **No Concurrent Updates**: Player doesn't have multiple tabs open modifying same quest
5. **Timestamps are UTC**: All dates returned in ISO 8601 format

## Constraints

- **Max Active Quests**: 10 per player (backend enforced, UI should not populate beyond 10)
- **Max Quests in History**: Unlimited (pagination required for display)
- **Max Objectives per Quest**: 50 (API will enforce, UI should handle displays)
- **Max Stages per Quest**: 20 (API will enforce)
- **Reward Type String**: Must be one of: "Experience", "Item", "Currency", "Achievement"
