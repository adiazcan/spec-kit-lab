import type {
  Quest,
  QuestProgress,
  QuestDependency,
  PaginatedResponse,
  ListQuestsParams,
  AcceptQuestRequest,
  AbandonQuestRequest,
  ErrorResponse,
} from "@/types/quest";

const API_BASE = "/api";

/**
 * API client for quest management
 * Provides type-safe methods for all quest endpoints
 *
 * Uses fetch API for HTTP requests with proper error handling and type safety.
 *
 * @module services/questService
 */
export const questService = {
  /**
   * List all quests for an adventure (paginated)
   *
   * @param adventureId - Adventure ID
   * @param params - Pagination and filter parameters
   * @returns Paginated quest list
   *
   * @example
   * const quests = await questService.listQuests('adv-123', { skip: 0, limit: 20 });
   */
  async listQuests(
    adventureId: string,
    params?: ListQuestsParams,
  ): Promise<PaginatedResponse<Quest>> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined)
      queryParams.append("skip", params.skip.toString());
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.difficulty) queryParams.append("difficulty", params.difficulty);

    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/quests?${queryParams}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch quests: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get active quests for current player
   *
   * @param adventureId - Adventure ID
   * @param playerId - Player ID
   * @returns Array of active quest progress objects
   *
   * @example
   * const activeQuests = await questService.getActiveQuests('adv-123', 'player-456');
   */
  async getActiveQuests(
    adventureId: string,
    playerId: string,
  ): Promise<QuestProgress[]> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/players/${playerId}/quests/active`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch active quests: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get detailed progress for a specific quest
   *
   * @param adventureId - Adventure ID
   * @param questId - Quest ID
   * @param playerId - Player ID (optional)
   * @returns Full quest progress with objectives and stages
   *
   * @example
   * const progress = await questService.getQuestProgress('adv-123', 'quest-789', 'player-456');
   */
  async getQuestProgress(
    adventureId: string,
    questId: string,
    playerId?: string,
  ): Promise<QuestProgress> {
    const params = playerId ? `?playerId=${playerId}` : "";
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/progress${params}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch quest progress: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Accept a quest for the current player
   *
   * @param adventureId - Adventure ID
   * @param questId - Quest ID to accept
   * @param playerId - Player ID accepting the quest
   * @returns Updated quest progress after acceptance
   *
   * @example
   * const accepted = await questService.acceptQuest('adv-123', 'quest-789', 'player-456');
   */
  async acceptQuest(
    adventureId: string,
    questId: string,
    playerId: string,
  ): Promise<QuestProgress> {
    const request: AcceptQuestRequest = { playerId };
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/accept`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to accept quest: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Abandon an active quest
   *
   * @param adventureId - Adventure ID
   * @param questId - Quest ID to abandon
   * @param playerId - Player ID abandoning the quest
   * @returns Void on success (204 No Content)
   *
   * @example
   * await questService.abandonQuest('adv-123', 'quest-789', 'player-456');
   */
  async abandonQuest(
    adventureId: string,
    questId: string,
    playerId: string,
  ): Promise<void> {
    const request: AbandonQuestRequest = { playerId };
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/abandon`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to abandon quest: ${response.statusText}`);
    }

    // 204 No Content responses don't have a body
  },

  /**
   * Get quest dependencies (prerequisites)
   *
   * @param adventureId - Adventure ID
   * @param questId - Quest ID
   * @param playerId - Player ID (optional, for checking if prerequisites are met)
   * @returns Quest dependency information with prerequisites
   *
   * @example
   * const deps = await questService.getQuestDependencies('adv-123', 'quest-789', 'player-456');
   */
  async getQuestDependencies(
    adventureId: string,
    questId: string,
    playerId?: string,
  ): Promise<QuestDependency> {
    const params = playerId ? `?playerId=${playerId}` : "";
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/dependencies${params}`,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch quest dependencies: ${response.statusText}`,
      );
    }

    return response.json();
  },
};

/**
 * Error handling helper - extracts user-friendly message from API errors
 *
 * @param error - Unknown error object from API call
 * @returns User-friendly error message string
 *
 * @example
 * try {
 *   await questService.acceptQuest(...);
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   console.error(message);
 * }
 */
export function getErrorMessage(error: unknown): string {
  // Handle Error objects
  if (error instanceof Error) {
    // Check if it's a fetch error with a response
    if ("response" in error) {
      const errorData = (error as any).response?.data as
        | ErrorResponse
        | unknown;

      if (errorData && typeof errorData === "object" && "detail" in errorData) {
        return (errorData as ErrorResponse).detail;
      }
    }

    // Return the error message
    return error.message;
  }

  // Handle structured error responses (unlikely with fetch, but for completeness)
  if (error && typeof error === "object" && "detail" in error) {
    return (error as ErrorResponse).detail;
  }

  // Fallback generic message
  return "An unexpected error occurred";
}
