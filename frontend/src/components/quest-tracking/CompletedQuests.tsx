/**
 * CompletedQuests Component (T036)
 *
 * Displays a list of completed and failed quests with completion dates.
 *
 * Props:
 * - quests: QuestProgress[] - array of completed/failed quests to display
 * - onSelectQuest?: (questId: string) => void - optional callback when quest is selected
 * - isLoading?: boolean - whether quests are loading
 * - error?: string - error message if quest loading failed
 * - onRetry?: () => void - optional retry callback
 *
 * Display:
 * - List of completed/failed quest items with completion dates
 * - Quest name, status badge (Completed/Failed), and formatted date
 * - Empty state message when no completed quests
 * - Error message and retry button if error
 * - Loading spinner if isLoading
 * - Quest count summary
 *
 * Sorting:
 * - Quests are displayed sorted by completion date (newest first)
 *
 * Accessibility:
 * - role="list" with proper list semantics
 * - aria-label describing the completed quests list
 * - Proper heading structure
 * - Keyboard navigation through quest items
 * - Dates formatted accessibly for screen readers
 *
 * @component
 * @example
 * <CompletedQuests
 *   quests={completedQuests}
 *   onSelectQuest={selectQuest}
 *   isLoading={isLoading}
 *   error={error}
 * />
 */

import React, { useMemo } from "react";
import type { QuestProgress } from "@/types/quest";

interface CompletedQuestsProps {
  /** Array of completed/failed quest progress objects */
  quests: QuestProgress[];
  /** Optional callback when quest is selected/clicked */
  onSelectQuest?: (questId: string) => void;
  /** Whether quests are currently loading */
  isLoading?: boolean;
  /** Error message if quest loading failed */
  error?: string;
  /** Optional retry callback when error occurs */
  onRetry?: () => void;
}

/**
 * Format date for display
 * Returns date in format "Jan 20, 2026 at 3:30 PM"
 */
function formatCompletionDate(dateString: string | null): string {
  if (!dateString) {
    return "Date not available";
  }

  const date = new Date(dateString);

  // Format date: "Jan 20, 2026"
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Format time: "3:30 PM"
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Get completion date from quest (handles both completed and failed quests)
 */
function getCompletionDate(quest: QuestProgress): string {
  if (quest.status === "Completed" && quest.completedAt) {
    return quest.completedAt;
  }
  if (quest.status === "Failed" && quest.failedAt) {
    return quest.failedAt;
  }
  if (quest.status === "Abandoned" && quest.abandonedAt) {
    return quest.abandonedAt;
  }
  return "";
}

/**
 * Completed quests list component
 *
 * Displays:
 * - Heading "Completed Quests" with count
 * - List of completed/failed quest items with dates
 * - Empty state message if no completed quests
 * - Error message with retry button if error
 * - Loading indicator if isLoading is true
 *
 * Sorting:
 * - Quests sorted by completion date (newest first) automatically
 *
 * Accessibility:
 * - role="list" with descriptive aria-label
 * - Proper heading hierarchy (h2 for list title)
 * - Each item has role="listitem"
 * - All interactive elements accessible via keyboard
 * - Dates use semantic time element with datetime attribute
 *
 * Performance:
 * - Uses React.memo() to prevent unnecessary re-renders
 * - Efficient list rendering with map()
 * - Memoized sorted quests to avoid recomputation
 *
 * @param props - Component props
 * @returns Rendered completed quests list
 */
const CompletedQuests = React.memo(
  ({
    quests,
    onSelectQuest,
    isLoading = false,
    error,
    onRetry,
  }: CompletedQuestsProps) => {
    // Sort quests by completion date (newest first)
    const sortedQuests = useMemo(() => {
      const sorted = [...quests];
      sorted.sort((a, b) => {
        const dateA = new Date(getCompletionDate(a) || 0).getTime();
        const dateB = new Date(getCompletionDate(b) || 0).getTime();
        return dateB - dateA; // Newest first
      });
      return sorted;
    }, [quests]);

    // Handle loading state
    if (isLoading) {
      return (
        <div className="p-6 text-center">
          <div className="inline-block">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading completed quests...</p>
          </div>
        </div>
      );
    }

    // Handle error state
    if (error) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Completed Quests
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Retry loading completed quests"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    // Handle empty state
    if (sortedQuests.length === 0) {
      return (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-gray-600 text-lg font-medium mb-2">
            No completed quests yet
          </p>
          <p className="text-gray-500 text-sm">
            Complete quests to see them here in your quest history
          </p>
        </div>
      );
    }

    const ariaLabel = `Completed Quests, ${sortedQuests.length} ${sortedQuests.length === 1 ? "quest" : "quests"} completed`;

    return (
      <div className="space-y-4">
        {/* List header with title and count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Completed Quests</h2>
          <div className="text-sm text-gray-600">
            {sortedQuests.length}{" "}
            {sortedQuests.length === 1 ? "quest" : "quests"} completed
          </div>
        </div>

        {/* Completed quests list */}
        <ul role="list" aria-label={ariaLabel} className="space-y-3">
          {sortedQuests.map((quest) => {
            const completionDate = getCompletionDate(quest);
            const formattedDate = formatCompletionDate(completionDate);

            return (
              <li key={quest.questProgressId} role="listitem">
                <button
                  onClick={() => onSelectQuest && onSelectQuest(quest.questId)}
                  className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={`View details for ${quest.questName}, ${quest.status} on ${formattedDate}`}
                  disabled={!onSelectQuest}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Quest name */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {quest.questName}
                      </h3>

                      {/* Completion date */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <time dateTime={completionDate}>{formattedDate}</time>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="ml-4">
                      {quest.status === "Completed" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      )}
                      {quest.status === "Failed" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Failed
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Pagination controls (optional, shown if > 20 quests) */}
        {sortedQuests.length > 20 && (
          <nav
            className="mt-6 flex items-center justify-center"
            role="navigation"
            aria-label="Pagination"
          >
            <p className="text-sm text-gray-600">
              Showing 1-{Math.min(20, sortedQuests.length)} of{" "}
              {sortedQuests.length}
            </p>
            {/* Pagination buttons can be added here in future enhancement */}
          </nav>
        )}
      </div>
    );
  },
);

CompletedQuests.displayName = "CompletedQuests";

export default CompletedQuests;
