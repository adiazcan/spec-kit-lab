/**
 * Generated Quest API Types
 *
 * These types are derived from the OpenAPI specification for quest endpoints.
 * They should be kept in sync with the backend API and OpenAPI spec.
 *
 * @module types/questTypes
 */

// ============================================================================
// Core Quest Types
// ============================================================================

/**
 * Quest entity as returned from quest list endpoint
 */
export interface Quest {
  questId: string;
  questName: string;
  questDescription: string;
  questGiver?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Epic";
  estimatedDuration?: number;
}

/**
 * Quest progress tracking - main type for quest tracking UI
 * Contains all information needed to display quest details with objectives
 */
export interface QuestProgress {
  questProgressId: string;
  questId: string;
  playerId: string;
  questName: string;
  questDescription: string;
  currentStageNumber: number;
  totalStages: number;
  progressPercentage: number; // 0-100
  status: QuestStatus;
  currentStage: StageProgress;
  acceptedAt: string; // ISO 8601 date-time
  completedAt: string | null;
  failedAt: string | null;
  abandonedAt: string | null;
}

/**
 * Stage within a quest - represents a major milestone
 */
export interface StageProgress {
  stageNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null; // ISO 8601 date-time
  objectives: ObjectiveProgress[];
}

/**
 * Individual objective - represents a concrete task within a stage
 */
export interface ObjectiveProgress {
  objectiveId: string;
  description: string;
  conditionType: string; // e.g., "Defeat", "Collect", "Deliver", "Explore"
  currentProgress: number;
  targetAmount: number;
  isCompleted: boolean;
  progressPercentage: number; // 0-100, calculated from currentProgress/targetAmount
}

/**
 * Quest status enumeration
 * Represents the lifecycle state of a quest for a player
 */
export type QuestStatus = "Active" | "Completed" | "Failed" | "Abandoned";

/**
 * Quest reward granted upon completion or stage completion
 */
export interface Reward {
  rewardId: string;
  type: "Experience" | "Item" | "Currency" | "Achievement";
  amount: number;
  itemId?: string;
  itemName?: string;
  description?: string;
}

/**
 * Quest dependency information - prerequisites and unlock conditions
 */
export interface QuestDependency {
  questId: string;
  prerequisites: PrerequisiteQuest[];
  allPrerequisitesMet: boolean;
}

/**
 * Individual prerequisite quest
 */
export interface PrerequisiteQuest {
  prerequisiteQuestId: string;
  questName: string;
  dependencyType: string; // e.g., "RequiredBefore", "UnlockedBy"
  playerStatus: "Completed" | "InProgress" | "NotStarted";
}

/**
 * Stage completion result returned after completing a stage
 */
export interface StageCompletionResult {
  questProgressId: string;
  currentStageNumber: number;
  questStatus: QuestStatus;
  stageRewards: Reward[];
  message: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Response from list quests endpoint
 * Provides paginated quest listings with metadata
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  skip: number;
  limit: number;
}

/**
 * Request to accept a quest
 */
export interface AcceptQuestRequest {
  playerId: string;
}

/**
 * Request to abandon a quest
 */
export interface AbandonQuestRequest {
  playerId: string;
}

/**
 * Request to update objective progress
 */
export interface UpdateObjectiveProgressRequest {
  playerId: string;
  progressAmount: number; // Amount to increment progress by (1-2147483647)
}

/**
 * Request to complete a stage
 */
export interface CompleteStageRequest {
  playerId: string;
}

/**
 * API error response format
 */
export interface ErrorResponse {
  type: string; // e.g., "https://api.example.com/errors/not-found"
  title: string; // e.g., "Quest Not Found"
  status: number; // HTTP status code
  detail: string; // Detailed error message
  traceId: string; // Request trace ID for debugging
}

// ============================================================================
// Query Parameters & UI State
// ============================================================================

/**
 * Parameters for listing quests
 */
export interface ListQuestsParams {
  skip?: number;
  limit?: number;
  difficulty?: string;
}

/**
 * Active quest filter options
 */
export type QuestFilterType = "Active" | "Completed" | "Failed";

/**
 * UI state for quest filtering
 */
export interface QuestFilterState {
  statusFilters: QuestFilterType[];
  searchText?: string;
  sortBy?: "name" | "progress" | "dateAccepted";
}

/**
 * UI state for quest detail panel
 */
export interface QuestDetailState {
  selectedQuestId: string | null;
  isLoading: boolean;
  error?: string;
  questData: QuestProgress | null;
}

// ============================================================================
// Type Guards & Validators
// ============================================================================

/**
 * Type guard to check if a value is a valid quest status
 */
export function isQuestStatus(value: unknown): value is QuestStatus {
  return (
    value === "Active" ||
    value === "Completed" ||
    value === "Failed" ||
    value === "Abandoned"
  );
}

/**
 * Type guard to check if a value is a valid quest filter type
 */
export function isQuestFilterType(value: unknown): value is QuestFilterType {
  return value === "Active" || value === "Completed" || value === "Failed";
}

/**
 * Type guard to check if value is a valid reward type
 */
export function isRewardType(
  value: unknown,
): value is "Experience" | "Item" | "Currency" | "Achievement" {
  return (
    value === "Experience" ||
    value === "Item" ||
    value === "Currency" ||
    value === "Achievement"
  );
}

/**
 * Calculate quest progress percentage from stages
 */
export function calculateQuestProgress(stages: StageProgress[]): number {
  if (stages.length === 0) return 0;
  const completed = stages.filter((s) => s.isCompleted).length;
  return Math.round((completed / stages.length) * 100);
}

/**
 * Sort quests by name, progress, or date
 */
export function sortQuests(
  quests: QuestProgress[],
  sortBy: "name" | "progress" | "dateAccepted" = "name",
): QuestProgress[] {
  const sorted = [...quests];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.questName.localeCompare(b.questName));
    case "progress":
      return sorted.sort((a, b) => b.progressPercentage - a.progressPercentage);
    case "dateAccepted":
      return sorted.sort(
        (a, b) =>
          new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime(),
      );
    default:
      return sorted;
  }
}

/**
 * Filter quests by status
 */
export function filterQuestsByStatus(
  quests: QuestProgress[],
  statuses: QuestStatus[],
): QuestProgress[] {
  if (statuses.length === 0) return quests;
  return quests.filter((quest) => statuses.includes(quest.status));
}

/**
 * Filter quests by search text (name and description)
 */
export function filterQuestsBySearch(
  quests: QuestProgress[],
  searchText: string,
): QuestProgress[] {
  const lower = searchText.toLowerCase();
  return quests.filter(
    (quest) =>
      quest.questName.toLowerCase().includes(lower) ||
      quest.questDescription.toLowerCase().includes(lower),
  );
}
