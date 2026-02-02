import React from "react";

interface RoundCounterProps {
  /** Current round number (1-indexed) */
  round: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Combat round counter display.
 * Shows the current round number in the combat encounter.
 *
 * @component
 * @example
 * ```tsx
 * <RoundCounter round={3} />
 * ```
 */
export const RoundCounter: React.FC<RoundCounterProps> = ({
  round,
  className = "",
}) => {
  return (
    <div
      className={`round-counter text-gray-300 text-sm font-semibold ${className}`}
      role="status"
      aria-label={`Combat round ${round}`}
    >
      <div className="flex items-center gap-2">
        <span className="round-icon" aria-hidden="true">
          🔄
        </span>
        <span className="round-text">Round {round}</span>
      </div>
    </div>
  );
};

export default RoundCounter;
