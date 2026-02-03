/**
 * QuestListItem Component (T012)
 *
 * Individual quest item component that displays a single quest in the quest list.
 *
 * Props:
 * - quest: QuestProgress - the quest data to display
 * - onSelect: () => void - callback when quest is selected
 * - onAbandon?: () => void - optional callback when quest is abandoned
 *
 * Display:
 * - Quest name (clickable)
 * - Status badge (Active/Completed/Failed)
 * - Progress percentage and bar
 * - Optional abandon button
 *
 * Accessibility:
 * - role="button" for keyboard navigation
 * - aria-label includes quest name and status
 * - focus ring for visibility
 * - Enter key activation
 *
 * @component
 * @example
 * <QuestListItem
 *   quest={questProgress}
 *   onSelect={() => selectQuest(questProgress.questProgressId)}
 *   onAbandon={() => abandonQuest(questProgress.questProgressId)}
 * />
 */

import React from "react";
import type { QuestProgress } from "@/types/quest";
import ProgressBar from "./ProgressBar";

interface QuestListItemProps {
  /** Quest data to display */
  quest: QuestProgress;
  /** Callback invoked when quest item is selected/clicked */
  onSelect: () => void;
  /** Optional callback invoked when abandon button is clicked */
  onAbandon?: () => void;
}

/**
 * Individual quest list item component
 *
 * Displays:
 * - Quest name (large, clickable)
 * - Current status badge with color coding
 * - Progress percentage and visual progress bar
 * - Abandon button (only for active quests)
 *
 * Keyboard:
 * - Tab to focus the item
 * - Enter/Space to select
 * - Tab to abandon button (if present), Enter to activate
 *
 * @param props - Component props
 * @returns Rendered quest list item
 */
const QuestListItem = React.memo(
  ({ quest, onSelect, onAbandon }: QuestListItemProps) => {
    // Determine status badge styling
    const getStatusColor = (
      status: string,
    ): {
      bg: string;
      text: string;
      label: string;
    } => {
      switch (status) {
        case "Active":
          return {
            bg: "bg-blue-100",
            text: "text-blue-800",
            label: "Active",
          };
        case "Completed":
          return {
            bg: "bg-green-100",
            text: "text-green-800",
            label: "Completed",
          };
        case "Failed":
          return {
            bg: "bg-red-100",
            text: "text-red-800",
            label: "Failed",
          };
        case "Abandoned":
          return {
            bg: "bg-gray-100",
            text: "text-gray-800",
            label: "Abandoned",
          };
        default:
          return {
            bg: "bg-gray-100",
            text: "text-gray-800",
            label: status,
          };
      }
    };

    const statusStyle = getStatusColor(quest.status);

    // Generate aria-label for accessibility
    const ariaLabelText = `${quest.questName} - ${quest.status} quest with ${quest.progressPercentage}% progress`;

    // Stop event propagation when clicking abandon button
    const handleAbandonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAbandon?.();
    };

    // Handle keyboard events (Enter to select)
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    };

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabelText}
        className="focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg p-4 mb-3 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
      >
        {/* Quest header with name and status */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
            {quest.questName}
          </h3>

          {/* Status badge */}
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Progress section */}
        <div className="flex flex-col gap-2 mb-3">
          <ProgressBar
            percentage={quest.progressPercentage}
            label={`Progress: ${quest.progressPercentage}%`}
            showLabel={false}
            ariaLabel={`Quest progress: ${quest.progressPercentage} percent complete`}
          />
        </div>

        {/* Stage info and buttons */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Stage {quest.currentStageNumber} of {quest.totalStages}
          </span>

          {/* Abandon button (only for active quests) */}
          {quest.status === "Active" && onAbandon && (
            <button
              onClick={handleAbandonClick}
              className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
              aria-label={`Abandon quest: ${quest.questName}`}
            >
              Abandon
            </button>
          )}
        </div>
      </div>
    );
  },
);

QuestListItem.displayName = "QuestListItem";

export default QuestListItem;
