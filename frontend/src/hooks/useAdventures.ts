import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Adventure } from "../services/api";
import { parseError } from "../utils/errorMessages";

/**
 * Hook to fetch list of adventures
 * @returns Query result with adventures data, loading state, and error
 */
export function useAdventures() {
  return useQuery({
    queryKey: ["adventures"],
    queryFn: () => api.adventures.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a new adventure
 * @returns Mutation with loading state and error handling
 */
export function useCreateAdventure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: {
      initialSceneId?: string;
      initialGameState?: Record<string, unknown>;
    }) => api.adventures.create(request),
    onSuccess: (newAdventure: Adventure) => {
      // Optimistically add to cache
      queryClient.setQueryData<Adventure[]>(["adventures"], (old = []) => [
        ...old,
        newAdventure,
      ]);
    },
    onError: async (error: unknown) => {
      const message = await parseError(error);
      console.error("Failed to create adventure:", message);
    },
  });
}

/**
 * Hook to delete an adventure by ID
 * @returns Mutation with loading state and error handling
 */
export function useDeleteAdventure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.adventures.delete(id),
    onSuccess: (_data, deletedId: string) => {
      // Optimistically remove from cache
      queryClient.setQueryData<Adventure[]>(["adventures"], (old = []) =>
        old.filter((adventure) => adventure.id !== deletedId),
      );
    },
    onError: async (error: unknown) => {
      const message = await parseError(error);
      console.error("Failed to delete adventure:", message);
    },
  });
}
