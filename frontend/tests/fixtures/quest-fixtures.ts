/**
 * Quest Test Fixtures
 *
 * Provides mock quest data for unit and integration tests
 *
 * @module tests/fixtures/quest-fixtures
 */

import type {
  Quest,
  QuestProgress,
  StageProgress,
  ObjectiveProgress,
  Reward,
} from "@/types/quest";

/**
 * Mock objective progress data
 */
export const mockObjectiveProgress: ObjectiveProgress = {
  objectiveId: "obj-1",
  description: "Defeat 5 goblin scouts",
  conditionType: "Defeat",
  currentProgress: 3,
  targetAmount: 5,
  isCompleted: false,
  progressPercentage: 60,
};

/**
 * Mock completed objective
 */
export const mockCompletedObjective: ObjectiveProgress = {
  objectiveId: "obj-2",
  description: "Collect ancient keys",
  conditionType: "Collect",
  currentProgress: 3,
  targetAmount: 3,
  isCompleted: true,
  progressPercentage: 100,
};

/**
 * Mock stage progress data
 */
export const mockStageProgress: StageProgress = {
  stageNumber: 1,
  title: "Entry to the Dungeon",
  description: "Enter the dungeon and defeat initial enemies",
  isCompleted: false,
  completedAt: null,
  objectives: [mockObjectiveProgress, mockCompletedObjective],
};

/**
 * Mock quest progress - active quest
 */
export const mockQuestProgressActive: QuestProgress = {
  questProgressId: "qp-1",
  questId: "quest-1",
  playerId: "player-1",
  questName: "Defeat the Shadow Lord",
  questDescription:
    "A dark lord has arisen in the northern mountains. Defeat him and bring peace to the realm.",
  currentStageNumber: 1,
  totalStages: 3,
  progressPercentage: 40,
  status: "Active",
  currentStage: mockStageProgress,
  acceptedAt: "2026-01-15T10:00:00Z",
  completedAt: null,
  failedAt: null,
  abandonedAt: null,
  rewards: [
    {
      rewardId: "reward-1",
      type: "Experience",
      amount: 5000,
    },
    {
      rewardId: "reward-2",
      type: "Currency",
      amount: 500,
    },
    {
      rewardId: "reward-3",
      type: "Item",
      amount: 1,
      itemId: "item-123",
      itemName: "Sword of Truth",
    },
  ],
};

/**
 * Mock quest progress - completed quest
 */
export const mockQuestProgressCompleted: QuestProgress = {
  questProgressId: "qp-2",
  questId: "quest-2",
  playerId: "player-1",
  questName: "Rescue the Princess",
  questDescription:
    "The princess has been kidnapped. Find and rescue her from the tower.",
  currentStageNumber: 2,
  totalStages: 2,
  progressPercentage: 100,
  status: "Completed",
  currentStage: {
    ...mockStageProgress,
    isCompleted: true,
    completedAt: "2026-01-20T15:30:00Z",
  },
  acceptedAt: "2026-01-18T09:00:00Z",
  completedAt: "2026-01-20T15:30:00Z",
  failedAt: null,
  abandonedAt: null,
  rewards: [
    {
      rewardId: "reward-4",
      type: "Experience",
      amount: 3000,
    },
    {
      rewardId: "reward-5",
      type: "Currency",
      amount: 250,
    },
  ],
};

/**
 * Mock quest progress - failed quest
 */
export const mockQuestProgressFailed: QuestProgress = {
  questProgressId: "qp-3",
  questId: "quest-3",
  playerId: "player-1",
  questName: "Retrieve the Ancient Artifact",
  questDescription:
    "Find and retrieve an ancient artifact from the forgotten ruins.",
  currentStageNumber: 1,
  totalStages: 2,
  progressPercentage: 25,
  status: "Failed",
  currentStage: mockStageProgress,
  acceptedAt: "2026-01-10T08:00:00Z",
  completedAt: null,
  failedAt: "2026-01-22T14:00:00Z",
  abandonedAt: null,
  rewards: [
    {
      rewardId: "reward-6",
      type: "Experience",
      amount: 1500,
    },
  ],
};

/**
 * Mock quest progress - multiple objectives
 */
export const mockQuestProgressMultiObj: QuestProgress = {
  questProgressId: "qp-4",
  questId: "quest-4",
  playerId: "player-1",
  questName: "Explore the Hidden Cave",
  questDescription: "Explore the hidden cave and find the secret treasure.",
  currentStageNumber: 1,
  totalStages: 1,
  progressPercentage: 60,
  status: "Active",
  currentStage: {
    stageNumber: 1,
    title: "Cave Exploration",
    description: "Explore the cave",
    isCompleted: false,
    completedAt: null,
    objectives: [
      {
        objectiveId: "obj-m1",
        description: "Collect 3 crystals",
        conditionType: "Collect",
        currentProgress: 2,
        targetAmount: 3,
        isCompleted: false,
        progressPercentage: 67,
      },
      {
        objectiveId: "obj-m2",
        description: "Defeat cave guardian",
        conditionType: "Defeat",
        currentProgress: 1,
        targetAmount: 1,
        isCompleted: true,
        progressPercentage: 100,
      },
      {
        objectiveId: "obj-m3",
        description: "Read the ancient inscription",
        conditionType: "Interact",
        currentProgress: 0,
        targetAmount: 1,
        isCompleted: false,
        progressPercentage: 0,
      },
    ],
  },
  acceptedAt: "2026-02-01T12:00:00Z",
  completedAt: null,
  failedAt: null,
  abandonedAt: null,
  rewards: [
    {
      rewardId: "reward-7",
      type: "Experience",
      amount: 2000,
    },
    {
      rewardId: "reward-8",
      type: "Achievement",
      description: "Cave Explorer",
    },
  ],
};

/**
 * Array of mock active quests
 */
export const mockActiveQuests: QuestProgress[] = [
  mockQuestProgressActive,
  mockQuestProgressMultiObj,
];

/**
 * Array of all quest progress statuses
 */
export const mockAllQuests: QuestProgress[] = [
  mockQuestProgressActive,
  mockQuestProgressCompleted,
  mockQuestProgressFailed,
  mockQuestProgressMultiObj,
];

/**
 * Mock quest data from list endpoint
 */
export const mockQuest: Quest = {
  questId: "quest-1",
  questName: "Defeat the Shadow Lord",
  questDescription: "A dark lord has arisen in the northern mountains.",
  questGiver: "The High Council",
  difficulty: "Hard",
  estimatedDuration: 120,
};

/**
 * Mock rewards
 */
export const mockRewards: Reward[] = [
  {
    rewardId: "reward-1",
    type: "Experience",
    amount: 5000,
  },
  {
    rewardId: "reward-2",
    type: "Currency",
    amount: 500,
  },
  {
    rewardId: "reward-3",
    type: "Item",
    amount: 1,
    itemId: "item-123",
    itemName: "Sword of Truth",
  },
];
