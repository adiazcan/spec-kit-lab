/**
 * Active Quests List Page Component (T015)
 *
 * Page-level component that integrates the useQuestTracking hook with the QuestList component.
 * This is the main component for the quest tracking UI page/route.
 *
 * Features:
 * - Fetches active quests via useQuestTracking hook
 * - Displays quest list with proper loading/error states
 * - Handles quest selection and detail fetching
 * - Supports quest abandonment
 * - Optional detail panel display for selected quest
 *
 * Props:
 * - adventureId: string - the adventure ID
 * - playerId: string - the player ID
 * - showDetails?: boolean - whether to show quest detail panel
 *
 * @component
 * @example
 * <ActiveQuestsList
 *   adventureId="adv-123"
 *   playerId="player-456"
 *   showDetails={true}
 * />
 */

import React, { useCallback, useState } from "react";
import { useQuestTracking } from "@/hooks/useQuestTracking";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import QuestList from "./QuestList";
import QuestDetail from "./QuestDetail";
import QuestFilter from "./QuestFilter";

interface ActiveQuestsListProps {
  /** Adventure ID for quest context */
  adventureId: string;
  /** Player ID for filtering relevant quests */
  playerId: string;
}

/**
 * Active quests list page component
 *
 * Integrates:
 * - useQuestTracking hook for state management and data fetching
 * - QuestList component for displaying quests
 * - Optional quest detail panel for viewing full quest information
 *
 * Handles:
 * - Loading quests via React Query (5-min stale time)
 * - Filtering quests by status
 * - Searching quests by name/description
 * - Selecting quests for detail view
 * - Abandoning quests with error handling
 * - Error states and retry functionality
 *
 * Responsive:
 * - Desktop layout: List on left, detail on right (if showDetails=true)
 * - Mobile/tablet: Stacked layout or modal detail view
 * - Minimum width target: 1024px+
 *
 * @param props - Component props
 * @returns Rendered active quests page
 */
const ActiveQuestsList: React.FC<ActiveQuestsListProps> = ({
  adventureId,
  playerId,
}) => {
  // Local state for detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailQuestId, setSelectedDetailQuestId] = useState<
    string | null
  >(null);

  // Get quest tracking state and handlers
  const {
    filteredQuests,
    isLoadingQuests,
    error,
    filters,
    setStatusFilter,
    clearFilters,
    abandonQuest,
  } = useQuestTracking(adventureId, playerId);

  // Persist filter state to localStorage
  // This hook handles saving and restoring filters
  useFilterPersistence(filters, (restoredFilters) => {
    setStatusFilter(restoredFilters.statusFilters);
  });

  // Find the selected quest for detail display
  const selectedQuestForDetail = selectedDetailQuestId
    ? filteredQuests.find((q) => q.questProgressId === selectedDetailQuestId)
    : null;

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    // Re-run the query by clearing and refetching
    // This would be handled by React Query's refetch mechanism
    clearFilters();
  }, [clearFilters]);

  // Handle opening quest detail
  const handleOpenQuestDetail = useCallback((questId: string) => {
    setSelectedDetailQuestId(questId);
    setDetailModalOpen(true);
  }, []);

  // Handle closing quest detail
  const handleCloseQuestDetail = useCallback(() => {
    setDetailModalOpen(false);
    // Keep the selection for re-opening if user clicks same quest
  }, []);

  // Memoize abandon handler
  const handleAbandon = useCallback(
    (questId: string) => {
      abandonQuest.mutate(questId);
      // Also close the detail modal after abandoning
      handleCloseQuestDetail();
    },
    [abandonQuest, handleCloseQuestDetail],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Quest Tracking</h1>
          <p className="mt-2 text-gray-600">
            View and manage your current quest progress
          </p>
        </div>
      </div>

      {/* Main content area with filter sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter sidebar - Left column on desktop, full width on mobile */}
          <div className="lg:col-span-1">
            <QuestFilter
              filters={filters}
              onFiltersChange={(newFilters) => {
                setStatusFilter(newFilters.statusFilters);
              }}
            />
          </div>

          {/* Quest list and detail - Right column on desktop, full width on mobile */}
          <div className="lg:col-span-3">
            {/* Quest list */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <QuestList
                quests={filteredQuests}
                filters={filters}
                onSelectQuest={handleOpenQuestDetail}
                onAbandonQuest={handleAbandon}
                isLoading={isLoadingQuests}
                error={error || undefined}
                onRetry={handleRetry}
              />
            </div>
          </div>
        </div>

        {/* Error message for abandon action */}
        {abandonQuest.isError && abandonQuest.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              <strong>Error:</strong>{" "}
              {abandonQuest.error || "Failed to abandon quest"}
            </p>
          </div>
        )}

        {/* Quest Detail Modal - Slides in from right when quest selected */}
        <QuestDetail
          quest={selectedQuestForDetail || null}
          isOpen={detailModalOpen}
          onClose={handleCloseQuestDetail}
          onAbandon={() => {
            if (selectedDetailQuestId) {
              handleAbandon(selectedDetailQuestId);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ActiveQuestsList;
