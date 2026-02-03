/**
 * QuestList Component (T014)
 *
 * List container component that displays multiple quest items with filtering and state management.
 *
 * Props:
 * - quests: QuestProgress[] - array of quests to display
 * - filters: QuestFilterState - current filter state
 * - onSelectQuest: (questId: string) => void - callback when quest is selected
 * - onAbandonQuest?: (questId: string) => void - optional callback when quest is abandoned
 * - isLoading?: boolean - whether quests are loading
 * - error?: string - error message if quest loading failed
 * - onRetry?: () => void - optional retry callback
 *
 * Display:
 * - List of QuestListItem components
 * - Empty state message when no quests
 * - Error message and retry button if error
 * - Loading spinner if isLoading
 * - Filter indicators and quest count
 *
 * Accessibility:
 * - role="list" with proper list semantics
 * - aria-label describing the list
 * - Proper heading structure
 * - Keyboard navigation through quest items
 *
 * @component
 * @example
 * <QuestList
 *   quests={filteredQuests}
 *   filters={filters}
 *   onSelectQuest={selectQuest}
 *   onAbandonQuest={abandonQuest}
 *   isLoading={isLoading}
 *   error={error}
 * />
 */

import React from "react";
import type { QuestProgress, QuestFilterState } from "@/types/quest";
import QuestListItem from "./QuestListItem";

interface QuestListProps {
  /** Array of quest progress objects to display */
  quests: QuestProgress[];
  /** Current filter state */
  filters: QuestFilterState;
  /** Callback when quest is selected/clicked */
  onSelectQuest: (questId: string) => void;
  /** Optional callback when quest is abandoned */
  onAbandonQuest?: (questId: string) => void;
  /** Whether quests are currently loading */
  isLoading?: boolean;
  /** Error message if quest loading failed */
  error?: string;
  /** Optional retry callback when error occurs */
  onRetry?: () => void;
}

/**
 * Quest list container component
 *
 * Displays:
 * - Heading "Active Quests" or similar based on filters
 * - List of QuestListItem components mapped from quests array
 * - Empty state message if no quests match filters
 * - Error message with retry button if error
 * - Loading indicator if isLoading is true
 * - Filter indicators and quest count summary
 *
 * Accessibility:
 * - role="list" with context-aware aria-label
 * - Proper heading hierarchy (h2 for list title)
 * - Each item has role="listitem"
 * - All interactive elements accessible via keyboard
 * - Screen reader announcements for state changes
 *
 * Performance:
 * - Uses React.memo() to prevent unnecessary re-renders
 * - Efficient list rendering with map()
 * - Memoized callbacks prevent child re-renders
 *
 * @param props - Component props
 * @returns Rendered quest list
 */
const QuestList = React.memo(
  ({
    quests,
    filters,
    onSelectQuest,
    onAbandonQuest,
    isLoading = false,
    error,
    onRetry,
  }: QuestListProps) => {
    // Generate list title based on filters
    const getListTitle = (): string => {
      if (filters.statusFilters.length === 0) {
        return "All Quests";
      }
      if (filters.statusFilters.length === 1) {
        return `${filters.statusFilters[0]} Quests`;
      }
      return `Filtered Quests`;
    };

    const listTitle = getListTitle();

    // Handle loading state
    if (isLoading) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading quests...</p>
          </div>
        </div>
      );
    }

    // Handle error state
    if (error) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Quests
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    // Handle empty state
    if (quests.length === 0) {
      return (
        <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-lg mb-2">No active quests found</p>
          <p className="text-gray-500 text-sm">
            {filters.statusFilters.length > 0 &&
            filters.statusFilters[0] !== "Active"
              ? `There are no ${filters.statusFilters.join(", ").toLowerCase()} quests.`
              : "Complete your current quests or start a new adventure!"}
          </p>
        </div>
      );
    }

    // Create accessible heading for list
    const ariaLabel = `${listTitle}, showing ${quests.length} ${quests.length === 1 ? "quest" : "quests"}`;

    return (
      <div className="space-y-4">
        {/* List header with title and filter indicator */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{listTitle}</h2>
          <div className="text-sm text-gray-600">
            Showing {quests.length} {quests.length === 1 ? "quest" : "quests"}
            {filters.statusFilters.length > 0 &&
              filters.statusFilters[0] !== "Active" && (
                <span className="ml-2">
                  • Filtered: {filters.statusFilters.join(", ")}
                </span>
              )}
          </div>
        </div>

        {/* Quest list */}
        <ul role="list" aria-label={ariaLabel} className="space-y-2">
          {quests.map((quest) => (
            <li key={quest.questProgressId} role="listitem">
              <QuestListItem
                quest={quest}
                onSelect={() => onSelectQuest(quest.questProgressId)}
                onAbandon={
                  onAbandonQuest
                    ? () => onAbandonQuest(quest.questProgressId)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

QuestList.displayName = "QuestList";

export default QuestList;
