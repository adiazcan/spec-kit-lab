/**
 * Completed Quests History Page Component (T037)
 *
 * Page-level component that displays completed and failed quest history.
 * Integrates with questService to fetch completed quests and display them with completion dates.
 *
 * Features:
 * - Fetches all quests and filters for completed/failed status
 * - Displays quest history with proper loading/error states
 * - Handles quest selection to view historical details
 * - Shows completion dates prominently
 * - Optional detail panel display for selected quest
 *
 * Props:
 * - adventureId: string - the adventure ID
 * - playerId: string - the player ID
 * - showDetails?: boolean - whether to show quest detail panel
 *
 * @component
 * @example
 * <CompletedQuestsHistory
 *   adventureId="adv-123"
 *   playerId="player-456"
 *   showDetails={true}
 * />
 */

import React, { useCallback, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { questService } from "@/services/questService";
import CompletedQuests from "./CompletedQuests";
import QuestDetail from "./QuestDetail";

interface CompletedQuestsHistoryProps {
  /** Adventure ID for quest context */
  adventureId: string;
  /** Player ID for filtering relevant quests */
  playerId: string;
}

/**
 * Completed quests history page component
 *
 * Integrates:
 * - React Query for data fetching with caching
 * - CompletedQuests component for displaying quest history
 * - Optional quest detail panel for viewing full quest information
 *
 * Handles:
 * - Loading completed quests via React Query (5-min stale time)
 * - Filtering to show only completed/failed/abandoned quests
 * - Selecting quests for detail view with historical data
 * - Error states and retry functionality
 * - Empty state when no quests completed
 *
 * Responsive:
 * - Desktop layout: Full width list
 * - Mobile/tablet: Stacked layout or modal detail view
 * - Minimum width target: 1024px+
 *
 * @param props - Component props
 * @returns Rendered completed quests history page
 */
const CompletedQuestsHistory: React.FC<CompletedQuestsHistoryProps> = ({
  adventureId,
  playerId,
}) => {
  // Local state for detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailQuestId, setSelectedDetailQuestId] = useState<
    string | null
  >(null);

  // Fetch all quests (active quests endpoint returns all quest statuses when filtered)
  const {
    data: allQuests,
    isLoading: isLoadingQuests,
    error: questsError,
    refetch: refetchQuests,
  } = useQuery({
    queryKey: ["quests", "completed", adventureId, playerId],
    queryFn: () => questService.getActiveQuests(adventureId, playerId),
    staleTime: 5 * 60 * 1000, // 5 minutes - quest history changes infrequently
    refetchInterval: 10 * 60 * 1000, // Background refetch every 10 minutes
  });

  // Filter for completed, failed, and abandoned quests
  const completedQuests = useMemo(() => {
    if (!allQuests) return [];
    return allQuests.filter(
      (quest) =>
        quest.status === "Completed" ||
        quest.status === "Failed" ||
        quest.status === "Abandoned",
    );
  }, [allQuests]);

  // Fetch selected quest detail when needed
  const { data: selectedQuestDetail } = useQuery({
    queryKey: ["quest-detail", adventureId, selectedDetailQuestId],
    queryFn: () =>
      questService.getQuestProgress(
        adventureId,
        selectedDetailQuestId!,
        playerId,
      ),
    enabled: !!selectedDetailQuestId && detailModalOpen,
    staleTime: 30 * 1000, // 30 seconds - details can change
  });

  // Find the selected quest for detail display
  const selectedQuestForDetail = selectedDetailQuestId
    ? completedQuests.find(
        (q) => q.questProgressId === selectedDetailQuestId,
      ) || selectedQuestDetail
    : null;

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    refetchQuests();
  }, [refetchQuests]);

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

  // Format error message
  const errorMessage = questsError
    ? questsError instanceof Error
      ? questsError.message
      : "Failed to load completed quests"
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Quest History</h1>
          <p className="mt-2 text-gray-600">
            Review your completed, failed, and abandoned quests
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <CompletedQuests
            quests={completedQuests}
            onSelectQuest={handleOpenQuestDetail}
            isLoading={isLoadingQuests}
            error={errorMessage}
            onRetry={handleRetry}
          />
        </div>

        {/* Quest Detail Modal - Slides in from right when quest selected */}
        <QuestDetail
          quest={selectedQuestForDetail || null}
          isOpen={detailModalOpen}
          onClose={handleCloseQuestDetail}
          // No onAbandon for historical quests
        />
      </div>
    </div>
  );
};

export default CompletedQuestsHistory;
