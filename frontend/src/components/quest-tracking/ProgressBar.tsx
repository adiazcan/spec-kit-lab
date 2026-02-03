/**
 * ProgressBar Component (T013)
 *
 * A reusable progress bar component for displaying visual progress indicators.
 * Used by QuestListItem, ObjectiveItem, and other components showing progress.
 *
 * Features:
 * - Visual progress bar using HTML progress element or styled div
 * - Optional percentage label display
 * - Full accessibility: role="progressbar", aria-valuenow/min/max
 * - Tailwind CSS styling
 * - Supports custom width and color
 *
 * @component
 * @example
 * <ProgressBar percentage={65} label="Quest Progress" showLabel={true} />
 */

import React from "react";

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Optional label to display above/beside progress bar */
  label?: string;
  /** Whether to show percentage text on the bar */
  showLabel?: boolean;
  /** Optional CSS class for styling */
  className?: string;
  /** Custom aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * Reusable progress bar component for displaying quest and objective progress
 *
 * Provides:
 * - Visual progress indicator (HTML progress element)
 * - Optional label display
 * - Full WCAG AA accessibility with ARIA attributes
 * - Responsive design with Tailwind CSS
 * - Color indicates progress level (0-33%: red, 34-66%: yellow, 67-100%: green)
 *
 * @param props - Component props
 * @returns Rendered progress bar component
 */
const ProgressBar = React.memo(
  ({
    percentage,
    label,
    showLabel = false,
    className = "",
    ariaLabel,
  }: ProgressBarProps) => {
    // Clamp percentage between 0 and 100
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

    // Determine color based on progress
    const getProgressColor = (percent: number): string => {
      if (percent <= 33) return "bg-red-600";
      if (percent <= 66) return "bg-yellow-500";
      return "bg-green-600";
    };

    const progressColor = getProgressColor(clampedPercentage);

    // Generate aria-label if not provided
    const ariaLabelText =
      ariaLabel ||
      `Progress: ${clampedPercentage}% ${label ? `for ${label}` : ""}`.trim();

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}

        <div
          className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200 border border-gray-300"
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabelText}
        >
          {/* Progress fill */}
          <div
            className={`h-full transition-all duration-300 ease-out ${progressColor}`}
            style={{
              width: `${clampedPercentage}%`,
            }}
          />

          {/* Optional percentage label */}
          {showLabel && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-multiply">
              {clampedPercentage}%
            </div>
          )}
        </div>
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
