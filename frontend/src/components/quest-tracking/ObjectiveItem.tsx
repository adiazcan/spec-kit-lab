/**
 * ObjectiveItem Component
 *
 * Displays a single quest objective with progress information.
 * Shows description, progress counter (current/target), progress bar,
 * and completion status.
 *
 * @component
 * @example
 * ```tsx
 * <ObjectiveItem objective={objectiveData} />
 * ```
 *
 * **Accessibility**: WCAG AA compliant with progress bar ARIA attributes
 * and clear completion status announcements.
 */

import React from "react";
import type { ObjectiveProgress } from "@/types/quest";
import ProgressBar from "./ProgressBar";

export interface ObjectiveItemProps {
  /** The objective data to display */
  objective: ObjectiveProgress;
}

/**
 * Formats progress counter as "current/target" string
 */
const formatProgressCounter = (
  currentProgress: number,
  targetAmount: number,
): string => {
  return `${currentProgress}/${targetAmount}`;
};

/**
 * ObjectiveItem component - displays individual quest objectives with progress
 */
const ObjectiveItem: React.FC<ObjectiveItemProps> = React.memo(
  ({ objective }) => {
    const progressCounter = formatProgressCounter(
      objective.currentProgress,
      objective.targetAmount,
    );

    // Determine styling based on completion status
    const itemClassName = objective.isCompleted
      ? "objective-completed"
      : "objective-in-progress";

    return (
      <li
        className={`flex flex-col gap-2 p-4 rounded border border-gray-200 dark:border-gray-700 ${
          objective.isCompleted
            ? "bg-gray-50 dark:bg-gray-900 opacity-75"
            : "bg-white dark:bg-gray-800"
        } ${itemClassName}`}
        aria-label={`${objective.description}, ${progressCounter}, ${objective.progressPercentage}% complete`}
      >
        {/* Objective Description */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {objective.description}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Condition: {objective.conditionType}
            </p>
          </div>

          {/* Completion Indicator */}
          {objective.isCompleted && (
            <div className="flex-shrink-0">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
                aria-label="Completed"
              >
                <svg
                  className="h-4 w-4 text-green-600 dark:text-green-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          )}
        </div>

        {/* Progress Information */}
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{progressCounter}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {" "}
              ({objective.progressPercentage}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          percentage={objective.progressPercentage}
          label={`${objective.progressPercentage}%`}
          showLabel={false}
          ariaLabel={`Progress for ${objective.description}`}
        />
      </li>
    );
  },
);

ObjectiveItem.displayName = "ObjectiveItem";

export default ObjectiveItem;
