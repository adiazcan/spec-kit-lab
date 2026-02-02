/**
 * Game API Service Layer
 *
 * Provides React Query hooks for all game-related API calls:
 * - useAdventure: Fetch adventure state
 * - useCharacter: Fetch character details
 * - useCombat: Fetch combat state
 * - useResolveTurn: Resolve player combat turn
 * - useResolveEnemyTurn: Resolve enemy combat turn
 *
 * All hooks use React Query for caching and automatic refetching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "../types/api";

// Extract types from generated API schema
type AdventureDto = components["schemas"]["AdventureDto"];
type CharacterDto = components["schemas"]["CharacterDto"];
type CombatStateResponse = components["schemas"]["CombatStateResponse"];

const API_BASE = "/api";

/**
 * Query key factories for React Query
 */
export const queryKeys = {
  adventure: (adventureId: string) => ["adventure", adventureId] as const,
  character: (characterId: string) => ["character", characterId] as const,
  combat: (combatId: string) => ["combat", combatId] as const,
};

/**
 * Fetch current adventure state
 *
 * @param adventureId - Adventure UUID
 * @returns Query result with adventure data (scene, game state, timestamps)
 *
 * Cache: 30 seconds (stale)
 * Refetch: Every 60 seconds (background)
 */
export function useAdventure(adventureId: string) {
  return useQuery({
    queryKey: queryKeys.adventure(adventureId),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/Adventures/${adventureId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Adventure not found");
        }
        throw new Error("Failed to fetch adventure");
      }
      return response.json() as Promise<AdventureDto>;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 60 seconds
  });
}

/**
 * Fetch character status for sidebar display
 *
 * @param characterId - Character UUID (or null to disable query)
 * @returns Query result with character data (HP, equipment, conditions, attributes)
 *
 * Cache: 10 seconds (stale)
 * Refetch: Every 5 seconds (volatile data)
 */
export function useCharacter(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.character(characterId || ""),
    queryFn: async () => {
      if (!characterId) return null;
      const response = await fetch(`${API_BASE}/characters/${characterId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Character not found");
        }
        throw new Error("Failed to fetch character");
      }
      return response.json() as Promise<CharacterDto>;
    },
    enabled: !!characterId,
    staleTime: 10000, // 10 seconds
    refetchInterval: 5000, // 5 seconds
  });
}

/**
 * Fetch combat state during active combat
 *
 * @param combatId - Combat UUID (or null to disable query)
 * @returns Query result with combat data (combatants, turn order, round, history)
 *
 * Cache: 5 seconds (stale)
 * Refetch: Every 2 seconds (highly volatile)
 */
export function useCombat(combatId: string | null) {
  return useQuery({
    queryKey: queryKeys.combat(combatId || ""),
    queryFn: async () => {
      if (!combatId) return null;
      const response = await fetch(`${API_BASE}/Combats/${combatId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Combat not found");
        }
        throw new Error("Failed to fetch combat");
      }
      return response.json() as Promise<CombatStateResponse>;
    },
    enabled: !!combatId,
    staleTime: 5000, // 5 seconds
    refetchInterval: 2000, // 2 seconds
  });
}

/**
 * Resolve a player combat turn action
 *
 * @param combatId - Combat UUID
 * @returns Mutation hook for POST /api/Combats/{combatId}/turns
 *
 * Mutation automatically updates combat state query cache on success.
 */
export function useResolveTurn(combatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      attackerId: string;
      targetId: string;
      action: string;
    }) => {
      const response = await fetch(`${API_BASE}/Combats/${combatId}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to resolve turn");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update combat state in cache
      queryClient.setQueryData(queryKeys.combat(combatId), data);
    },
    onError: (error: Error) => {
      console.error("Turn resolution failed:", error.message);
    },
  });
}

/**
 * Resolve an enemy combat turn action
 *
 * @param combatId - Combat UUID
 * @returns Mutation hook for POST /api/Combats/{combatId}/enemy-turn
 *
 * Mutation automatically updates combat state query cache on success.
 */
export function useResolveEnemyTurn(combatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_BASE}/Combats/${combatId}/enemy-turn`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to resolve enemy turn");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update combat state in cache
      queryClient.setQueryData(queryKeys.combat(combatId), data);
    },
    onError: (error: Error) => {
      console.error("Enemy turn resolution failed:", error.message);
    },
  });
}

/**
 * Submit a player command to the game engine
 *
 * @param adventureId - Current adventure UUID
 * @returns Mutation hook for POST /api/Adventures/{adventureId}/actions
 *
 * Submits a command string to the game engine and returns the result
 * including updated adventure state and any narrative messages generated.
 *
 * NOTE: This endpoint may not exist yet and should be implemented in the backend
 * or mapped to an existing endpoint. For now, it serves as a placeholder for
 * the command submission flow that can be integrated once the endpoint is available.
 */
export function useSubmitCommand(adventureId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: string) => {
      // TODO: Update this endpoint when the actual command submission endpoint is implemented
      // For now, POST to a placeholder route
      const response = await fetch(
        `${API_BASE}/Adventures/${adventureId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to submit command");
      }

      return response.json() as Promise<{
        success: boolean;
        message: string;
        adventureState?: AdventureDto;
        narrativeMessages?: Array<{
          id: string;
          type: string;
          content: string;
          timestamp: string;
        }>;
      }>;
    },
    onSuccess: (data) => {
      // Update adventure state in cache if returned
      if (data.adventureState) {
        queryClient.setQueryData(
          queryKeys.adventure(adventureId),
          data.adventureState,
        );
      }
    },
    onError: (error: Error) => {
      console.error("Command submission failed:", error.message);
    },
  });
}
