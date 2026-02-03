/**
 * Quest Tracking State Management Hook
 *
 * Provides quest tracking state, mutations, and handlers for viewing and managing quests.
 * Manages active quests list, filter state, quest details, and quest mutations.
 *
 * @module hooks/useQuestTracking
 */

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  QuestProgress,
  QuestFilterState,
  QuestFilterType,
} from "@/types/quest";
import {
  filterQuestsByStatus,
  filterQuestsBySearch,
  sortQuests,
} from "@/types/quest";
import { questService, getErrorMessage } from "@/services/questService";

/**
 * Return type for useQuestTracking hook
 */
export interface UseQuestTrackingReturn {
  // Data
  quests: QuestProgress[];
  filteredQuests: QuestProgress[];
  selectedQuestId: string | null;
  selectedQuest: QuestProgress | null;

  // State
  isLoadingQuests: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  detailError: string | null;

  // Filters
  filters: QuestFilterState;

  // Actions
  setStatusFilter: (statuses: QuestFilterType[]) => void;
  setSearchText: (text: string) => void;
  setSortBy: (sort: "name" | "progress" | "dateAccepted") => void;
  clearFilters: () => void;

  // Quest selection
  selectQuest: (questId: string | null) => void;

  // Mutations
  abandonQuest: {
    mutate: (questId: string) => void;
    isPending: boolean;
    isError: boolean;
    error: string | null;
  };
}

const DEFAULT_FILTER_STATE: QuestFilterState = {
  statusFilters: ["Active"],
  searchText: "",
  sortBy: "name",
};

/**
 * Hook for managing quest tracking state and operations
 *
 * Provides:
 * - Real-time active quests list via React Query
 * - Filter and search capabilities for quest list
 * - Quest selection and detail loading
 * - Abandon quest mutation with error handling
 * - Automatic cache invalidation on mutations
 *
 * Requirements met:
 * - Fetching active quests via React Query (5-min stale time)
 * - Managing filter state (status filters, search text, sort)
 * - Handling abandon quest mutation with error handling
 * - Returning quest data, filter state, and action handlers
 *
 * @param adventureId - The adventure ID to load quests for
 * @param playerId - The player ID for filtering relevant quests
 * @returns Quest tracking state, filters, and action handlers
 *
 * @example
 * const quests = useQuestTracking(adventureId, playerId);
 * if (quests.isLoadingQuests) return <div>Loading quests...</div>;
 *
 * return (
 *   <div>
 *     <div>
 *       <input
 *         value={quests.filters.searchText || ''}
 *         onChange={(e) => quests.setSearchText(e.target.value)}
 *         placeholder="Search quests..."
 *       />
 *     </div>
 *     {quests.filteredQuests.map((quest) => (
 *       <div
 *         key={quest.questProgressId}
 *         onClick={() => quests.selectQuest(quest.questProgressId)}
 *       >
 *         {quest.questName} - {quest.status}
 *       </div>
 *     ))}
 *   </div>
 * );
 */
export function useQuestTracking(
  adventureId: string,
  playerId: string,
): UseQuestTrackingReturn {
  const queryClient = useQueryClient();

  // State: Filter state
  const [filters, setFilters] =
    useState<QuestFilterState>(DEFAULT_FILTER_STATE);

  // State: Selected quest for detail view
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // Query: Get all active quests
  const {
    data: questsData = [],
    isLoading: isLoadingQuests,
    error: questsError,
  } = useQuery({
    queryKey: ["quests", "active", adventureId, playerId],
    queryFn: async () => {
      const result = await questService.getActiveQuests(adventureId, playerId);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes as per requirements
    gcTime: 10 * 60 * 1000, // 10 minutes (previously called cacheTime)
  });

  // Query: Get selected quest details (if a quest is selected)
  const {
    data: selectedQuestData,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useQuery({
    queryKey: ["quest", "detail", adventureId, selectedQuestId],
    queryFn: async () => {
      if (!selectedQuestId) return null;
      const result = await questService.getQuestProgress(
        adventureId,
        selectedQuestId,
        playerId,
      );
      return result;
    },
    enabled: selectedQuestId !== null, // Only fetch if quest is selected
    staleTime: 2 * 60 * 1000, // 2 minutes for detail view
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Compute: Filter and sort quests based on current filters
  const filteredQuests: QuestProgress[] = useMemo(() => {
    let result = [...questsData];

    // Apply status filter
    if (filters.statusFilters.length > 0) {
      result = filterQuestsByStatus(result, filters.statusFilters);
    }

    // Apply search filter
    if (filters.searchText) {
      result = filterQuestsBySearch(result, filters.searchText);
    }

    // Apply sort
    if (filters.sortBy) {
      result = sortQuests(result, filters.sortBy);
    }

    return result;
  }, [questsData, filters]);

  // Mutation: Abandon a quest
  const abandonQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      await questService.abandonQuest(adventureId, questId, playerId);
    },
    onSuccess: () => {
      // Invalidate quests cache to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: ["quests", "active", adventureId, playerId],
      });

      // Invalidate detail cache
      queryClient.invalidateQueries({
        queryKey: ["quest", "detail", adventureId],
      });

      // Clear selected quest after successful abandon
      setSelectedQuestId(null);
    },
    onError: (error: Error) => {
      console.error("Error abandoning quest:", error);
    },
  });

  // Action: Update status filters
  const setStatusFilter = useCallback((statuses: QuestFilterType[]) => {
    setFilters((prev) => ({
      ...prev,
      statusFilters: statuses,
    }));
  }, []);

  // Action: Update search text
  const setSearchText = useCallback((text: string) => {
    setFilters((prev) => ({
      ...prev,
      searchText: text,
    }));
  }, []);

  // Action: Update sort
  const setSortBy = useCallback(
    (sort: "name" | "progress" | "dateAccepted") => {
      setFilters((prev) => ({
        ...prev,
        sortBy: sort,
      }));
    },
    [],
  );

  // Action: Reset filters to default
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  // Action: Select quest for detail view
  const selectQuest = useCallback((questId: string | null) => {
    setSelectedQuestId(questId);
  }, []);

  // Compute: Get the selected quest from either original list or detail query
  const selectedQuest: QuestProgress | null = useMemo(() => {
    if (!selectedQuestId) return null;
    // Prefer detail data if available (more complete), fall back to list data
    if (selectedQuestData) return selectedQuestData;
    return (
      questsData.find((q) => q.questProgressId === selectedQuestId) || null
    );
  }, [selectedQuestId, selectedQuestData, questsData]);

  // Compute: Error messages
  const questsErrorMessage = questsError ? getErrorMessage(questsError) : null;
  const detailErrorMessage = detailError ? getErrorMessage(detailError) : null;

  return {
    // Data
    quests: questsData,
    filteredQuests,
    selectedQuestId,
    selectedQuest,

    // State
    isLoadingQuests,
    isLoadingDetail,
    error: questsErrorMessage,
    detailError: detailErrorMessage,

    // Filters
    filters,

    // Actions
    setStatusFilter,
    setSearchText,
    setSortBy,
    clearFilters,
    selectQuest,

    // Mutations
    abandonQuest: {
      mutate: abandonQuestMutation.mutate,
      isPending: abandonQuestMutation.isPending,
      isError: abandonQuestMutation.isError,
      error: abandonQuestMutation.error
        ? getErrorMessage(abandonQuestMutation.error)
        : null,
    },
  };
}

/**
 * Helper hook to compute quest statistics
 *
 * @param quests - Array of quest progress objects
 * @returns Statistics about the quest list
 *
 * @example
 * const stats = useQuestStats(filteredQuests);
 * return <div>{stats.totalQuests} quests, {stats.completedCount} completed</div>;
 */
export function useQuestStats(quests: QuestProgress[]) {
  return useMemo(
    () => ({
      totalQuests: quests.length,
      activeCount: quests.filter((q) => q.status === "Active").length,
      completedCount: quests.filter((q) => q.status === "Completed").length,
      failedCount: quests.filter((q) => q.status === "Failed").length,
      abandonedCount: quests.filter((q) => q.status === "Abandoned").length,
      averageProgress:
        quests.length > 0
          ? Math.round(
              quests.reduce((sum, q) => sum + q.progressPercentage, 0) /
                quests.length,
            )
          : 0,
    }),
    [quests],
  );
}
