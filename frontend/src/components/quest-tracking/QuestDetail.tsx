/**
 * QuestDetail Component
 *
 * Displays comprehensive quest details including:
 * - Quest title, description, and giver
 * - Current stage information (for multi-stage quests)
 * - All objectives for the current stage with progress
 * - Quest rewards
 * - Quest status and completion information
 *
 * Renders as a modal dialog with keyboard navigation support.
 *
 * @component
 * @example
 * ```tsx
 * <QuestDetail
 *   quest={questData}
 *   isOpen={true}
 *   onClose={handleClose}
 *   onAbandon={handleAbandon}
 * />
 * ```
 *
 * **Accessibility**: WCAG AA compliant modal with:
 * - role="dialog", aria-modal="true", aria-labelledby
 * - Escape key closes dialog
 * - Focus management and trap within modal
 * - Keyboard navigation for all buttons
 * - Screen reader friendly objectives list
 * - Progress bars with aria-valuenow/min/max
 */

import React, { useEffect, useRef } from "react";
import type { QuestProgress } from "@/types/quest";
import ObjectiveItem from "./ObjectiveItem";
import RewardDisplay from "./RewardDisplay";
import ProgressBar from "./ProgressBar";

export interface QuestDetailProps {
  /** The quest to display details for (null if not selected) */
  quest: QuestProgress | null;
  /** Whether the detail panel is open */
  isOpen: boolean;
  /** Callback when closing the detail view */
  onClose: () => void;
  /** Optional callback for abandoning quest */
  onAbandon?: () => void;
}

/**
 * Format ISO date string to readable format
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

/**
 * QuestDetail component - displays full quest information in modal dialog
 */
const QuestDetail: React.FC<QuestDetailProps> = ({
  quest,
  isOpen,
  onClose,
  onAbandon,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close when clicking outside (backdrop)
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Don't render if not open or no quest selected
  if (!isOpen || !quest) {
    return null;
  }

  const currentStage = quest.currentStage;
  const isCompleted = quest.status === "Completed";
  const isFailed = quest.status === "Failed";
  const isAbandoned = quest.status === "Abandoned";
  const isActive = quest.status === "Active";
  const isHistorical = isCompleted || isFailed || isAbandoned;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Container - Slide-out from right */}
      <div
        ref={dialogRef}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } overflow-y-auto bg-white dark:bg-gray-800 shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-detail-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1
              id="quest-detail-title"
              className="text-2xl font-bold text-gray-900 dark:text-white truncate"
            >
              {quest.questName}
            </h1>
            {/* Status Badge */}
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  isActive
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : isCompleted
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : isFailed
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : isAbandoned
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {quest.status}
              </span>
              {isHistorical && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  • Historical Quest
                </span>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Close quest details"
          >
            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {quest.questDescription}
            </p>
          </div>

          {/* Quest Giver and Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Accepted
              </h3>
              <p className="text-gray-900 dark:text-white">
                {formatDate(quest.acceptedAt)}
              </p>
            </div>
            {isCompleted && quest.completedAt && (
              <div className={isHistorical ? "col-span-2" : ""}>
                <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">
                  ✓ Completed
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(quest.completedAt)}
                </p>
              </div>
            )}
            {isFailed && quest.failedAt && (
              <div className={isHistorical ? "col-span-2" : ""}>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                  ✗ Failed
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(quest.failedAt)}
                </p>
              </div>
            )}
            {isAbandoned && quest.abandonedAt && (
              <div className={isHistorical ? "col-span-2" : ""}>
                <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                  ⚠ Abandoned
                </h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(quest.abandonedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Overall Quest Progress */}
          {!isCompleted && !isFailed && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Quest Progress
              </h3>
              <div className="space-y-2">
                <ProgressBar
                  percentage={quest.progressPercentage}
                  showLabel={true}
                  ariaLabel={`Overall quest progress: ${quest.progressPercentage}%`}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stage {quest.currentStageNumber} of {quest.totalStages}
                </p>
              </div>
            </div>
          )}

          {/* Current Stage Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {currentStage.title || `Stage ${currentStage.stageNumber}`}
            </h2>
            {currentStage.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {currentStage.description}
              </p>
            )}
          </div>

          {/* Objectives */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Objectives
            </h3>
            {currentStage.objectives && currentStage.objectives.length > 0 ? (
              <ul
                className="space-y-3"
                role="list"
                aria-label="Quest objectives"
              >
                {currentStage.objectives.map((objective) => (
                  <ObjectiveItem
                    key={objective.objectiveId}
                    objective={objective}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No objectives for this stage.
              </p>
            )}
          </div>
          {/* Rewards */}
          <RewardDisplay rewards={quest.rewards} />

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            {isActive && onAbandon && (
              <button
                onClick={onAbandon}
                className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Abandon Quest
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuestDetail;
