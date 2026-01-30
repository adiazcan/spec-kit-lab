/**
 * Character API Service
 * Handles HTTP communication with the backend character management API
 * Provides React Query hooks for data fetching and mutations
 *
 * Backend Endpoints:
 * - POST /api/characters - Create character
 * - GET /api/characters/{id} - Retrieve character
 * - PUT /api/characters/{id} - Update character
 * - DELETE /api/characters/{id} - Delete character
 * - GET /api/adventures/{adventureId}/characters - List adventure characters
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";

import { Character, CharacterFormData } from "@/types/character";

/**
 * API base URL from environment or localhost fallback
 * Should be set via VITE_API_URL environment variable
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_ENDPOINTS = {
  CREATE_CHARACTER: "/api/characters",
  GET_CHARACTER: (id: string) => `/api/characters/${id}`,
  UPDATE_CHARACTER: (id: string) => `/api/characters/${id}`,
  DELETE_CHARACTER: (id: string) => `/api/characters/${id}`,
  GET_ADVENTURE_CHARACTERS: (adventureId: string) =>
    `/api/adventures/${adventureId}/characters`,
} as const;

/**
 * Error types for API responses
 */
interface ApiError {
  error: string;
  details?: unknown;
}

/**
 * Character API Service - handles all HTTP operations
 * Static class with no state, methods return Promise<T>
 */
export class CharacterApiService {
  /**
   * Create a new character
   *
   * @param data - Character form data (name, attributes, adventureId)
   * @returns Promise resolving to created Character with id and timestamps
   * @throws Error with message from server if creation fails
   *
   * @example
   * ```typescript
   * const character = await characterApi.createCharacter({
   *   name: "Aragorn",
   *   adventureId: "adventure-123",
   *   attributes: { str: 15, dex: 14, int: 12, con: 16, cha: 17 }
   * });
   * ```
   */
  async createCharacter(data: CharacterFormData): Promise<Character> {
    const response = await fetch(
      `${API_BASE}${API_ENDPOINTS.CREATE_CHARACTER}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.error || "Failed to create character");
    }

    return response.json() as Promise<Character>;
  }

  /**
   * Retrieve a character by ID
   *
   * @param characterId - UUID of character to fetch
   * @returns Promise resolving to complete Character object
   * @throws Error if character not found (404) or server error
   *
   * @example
   * ```typescript
   * const character = await characterApi.getCharacter("550e8400-e29b-41d4...");
   * ```
   */
  async getCharacter(characterId: string): Promise<Character> {
    const response = await fetch(
      `${API_BASE}${API_ENDPOINTS.GET_CHARACTER(characterId)}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Character not found");
      }
      throw new Error("Failed to load character");
    }

    return response.json() as Promise<Character>;
  }

  /**
   * Update an existing character
   *
   * @param characterId - UUID of character to update
   * @param data - Updated character data (name and/or attributes)
   * @returns Promise resolving to updated Character object
   * @throws Error if character not found or update fails
   *
   * @example
   * ```typescript
   * const updated = await characterApi.updateCharacter("char-id", {
   *   name: "Aragorn the Great",
   *   adventureId: "adventure-123",
   *   attributes: { str: 16, dex: 14, int: 12, con: 16, cha: 17 }
   * });
   * ```
   */
  async updateCharacter(
    characterId: string,
    data: CharacterFormData,
  ): Promise<Character> {
    const response = await fetch(
      `${API_BASE}${API_ENDPOINTS.UPDATE_CHARACTER(characterId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Character not found");
      }
      const error = (await response.json()) as ApiError;
      throw new Error(error.error || "Failed to update character");
    }

    return response.json() as Promise<Character>;
  }

  /**
   * Delete a character
   *
   * @param characterId - UUID of character to delete
   * @returns Promise that resolves when delete completes
   * @throws Error if character not found or deletion fails
   *
   * @example
   * ```typescript
   * await characterApi.deleteCharacter("char-id");
   * // Character is now permanently deleted
   * ```
   */
  async deleteCharacter(characterId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}${API_ENDPOINTS.DELETE_CHARACTER(characterId)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Character not found");
      }
      throw new Error("Failed to delete character");
    }

    // No body content on 204 response
  }

  /**
   * Get all characters in an adventure
   *
   * @param adventureId - UUID of adventure
   * @returns Promise resolving to array of Character objects
   * @throws Error if adventure not found or request fails
   *
   * @example
   * ```typescript
   * const characters = await characterApi.getAdventureCharacters("adventure-123");
   * // Returns all characters associated with that adventure
   * ```
   */
  async getAdventureCharacters(adventureId: string): Promise<Character[]> {
    const response = await fetch(
      `${API_BASE}${API_ENDPOINTS.GET_ADVENTURE_CHARACTERS(adventureId)}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Adventure not found");
      }
      throw new Error("Failed to load characters");
    }

    return response.json() as Promise<Character[]>;
  }
}

/**
 * Singleton instance of CharacterApiService
 * Use this in React components to call API methods
 *
 * @example
 * ```typescript
 * const character = await api.createCharacter(formData);
 * ```
 */
export const api = new CharacterApiService();

// ==================== React Query Hooks ====================

/**
 * Query hook: Fetch a single character by ID
 *
 * Automatically refetches on mount and when characterId changes.
 * Caches results for 5 minutes (staleTime).
 * Disabled when characterId is undefined.
 *
 * @param characterId - Character UUID to fetch (undefined to disable query)
 * @returns UseQueryResult with character data, loading, and error states
 *
 * @example
 * ```typescript
 * const { data: character, isLoading, error } = useCharacter("char-123");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * return <CharacterSheet character={character} />;
 * ```
 */
export function useCharacter(
  characterId: string | undefined,
): UseQueryResult<Character> {
  return useQuery({
    queryKey: ["character", characterId],
    queryFn: () => api.getCharacter(characterId!),
    enabled: !!characterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mutation hook: Create a new character
 *
 * Automatically invalidates character lists after successful creation.
 * Use with useState or form library for status tracking.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * ```typescript
 * const { mutate: createCharacter, isPending } = useCreateCharacter();
 *
 * const handleSubmit = (formData) => {
 *   createCharacter(formData, {
 *     onSuccess: (character) => navigate(`/characters/${character.id}`),
 *     onError: (error) => setError(error.message)
 *   });
 * };
 * ```
 */
export function useCreateCharacter(): UseMutationResult<
  Character,
  Error,
  CharacterFormData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CharacterFormData) => api.createCharacter(data),
    onSuccess: () => {
      // Invalidate all character-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["adventure-characters"] });
    },
  });
}

/**
 * Mutation hook: Update an existing character
 *
 * Automatically refetches the updated character and invalidates lists.
 * Supports optimistic updates for better UX.
 *
 * @param characterId - Character UUID to update
 * @returns UseMutationResult with mutate function
 *
 * @example
 * ```typescript
 * const { mutate: updateCharacter } = useUpdateCharacter("char-123");
 *
 * const handleUpdate = (formData) => {
 *   updateCharacter(formData, {
 *     onSuccess: () => toast.success("Character updated!")
 *   });
 * };
 * ```
 */
export function useUpdateCharacter(
  characterId: string,
): UseMutationResult<Character, Error, CharacterFormData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CharacterFormData) =>
      api.updateCharacter(characterId, data),
    onSuccess: () => {
      // Refetch this specific character
      queryClient.invalidateQueries({
        queryKey: ["character", characterId],
      });
      // Also invalidate lists since character may have changed
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["adventure-characters"] });
    },
  });
}

/**
 * Mutation hook: Delete a character
 *
 * Automatically invalidates character lists after deletion.
 * UI should handle confirmation before calling mutate.
 *
 * @returns UseMutationResult with mutate function
 *
 * @example
 * ```typescript
 * const { mutate: deleteCharacter, isPending } = useDeleteCharacter();
 *
 * const handleDelete = async (characterId) => {
 *   if (confirm("Delete this character?")) {
 *     deleteCharacter(characterId, {
 *       onSuccess: () => navigate("/characters")
 *     });
 *   }
 * };
 * ```
 */
export function useDeleteCharacter(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) => api.deleteCharacter(characterId),
    onSuccess: () => {
      // Invalidate all character lists
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["adventure-characters"] });
    },
  });
}

/**
 * Query hook: Fetch all characters in an adventure
 *
 * Used for adventure character selection and character list pages.
 * Returns empty array if adventureId is undefined.
 * Caches results for 5 minutes.
 *
 * @param adventureId - Adventure UUID to fetch characters for (undefined to disable)
 * @returns UseQueryResult with array of characters
 *
 * @example
 * ```typescript
 * const { data: characters = [], isLoading } = useAdventureCharacters("adventure-123");
 *
 * return (
 *   <div>
 *     {isLoading ? "Loading..." : characters.map(c => <CharacterCard key={c.id} character={c} />)}
 *   </div>
 * );
 * ```
 */
export function useAdventureCharacters(
  adventureId: string | undefined,
): UseQueryResult<Character[]> {
  return useQuery({
    queryKey: ["adventure-characters", adventureId],
    queryFn: () => api.getAdventureCharacters(adventureId!),
    enabled: !!adventureId,
    initialData: [], // Return empty array if disabled
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
