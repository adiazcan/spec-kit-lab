import React, { memo } from "react";
import type { ActiveCondition } from "../../types/combat";

/**
 * ConditionsList - Displays active status effects and conditions
 * T081: Optimized with React.memo to prevent unnecessary re-renders
 * T086: Enhanced with comprehensive JSDoc documentation
 *
 * Features:
 * - Color-coded badges by condition type
 * - Turns remaining indicator
 * - Smooth transitions for condition changes
 * - Type-specific icons and styling
 * - Empty state messaging
 *
 * Condition Types:
 * - buff: Green badge (positive effects like "Blessed", "Haste")
 * - debuff: Red badge (negative effects like "Poisoned", "Weakened")
 * - neutral: Gray badge (neutral effects)
 *
 * @component
 * @param {Object} props - Component props
 * @param {ActiveCondition[]} props.conditions - Array of active conditions to display
 *
 * @example
 * ```tsx
 * const conditions: ActiveCondition[] = [
 *   { name: "Blessed", type: "buff", turnsRemaining: 3, icon: "✨" },
 *   { name: "Poisoned", type: "debuff", turnsRemaining: 2, icon: "☠️" }
 * ];
 * <ConditionsList conditions={conditions} />
 * ```
 */
interface ConditionsListProps {
  /** Array of active status conditions/effects */
  conditions: ActiveCondition[];
}

const getConditionBgColor = (type: ActiveCondition["type"]): string => {
  switch (type) {
    case "buff":
      return "bg-green-900 border-green-700";
    case "debuff":
      return "bg-red-900 border-red-700";
    case "neutral":
      return "bg-gray-700 border-gray-600";
    default:
      return "bg-gray-700 border-gray-600";
  }
};

const getConditionTextColor = (type: ActiveCondition["type"]): string => {
  switch (type) {
    case "buff":
      return "text-green-200";
    case "debuff":
      return "text-red-200";
    case "neutral":
      return "text-gray-200";
    default:
      return "text-gray-200";
  }
};

const getConditionIcon = (type: ActiveCondition["type"]): string => {
  switch (type) {
    case "buff":
      return "✨";
    case "debuff":
      return "☠️";
    case "neutral":
      return "◉";
    default:
      return "•";
  }
};

/**
 * Memoized component - only re-renders when conditions array actually changes
 */
export const ConditionsList: React.FC<ConditionsListProps> = memo(
  ({ conditions }) => {
    if (conditions.length === 0) {
      return (
        <div className="bg-gray-900 p-4 border-b border-gray-700">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">
            CONDITIONS
          </h4>
          <p className="text-xs text-gray-500">No active conditions</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">CONDITIONS</h4>
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div
              key={`${condition.name}-${index}`}
              className={`condition-badge p-2 rounded border text-xs ${getConditionBgColor(
                condition.type,
              )} ${getConditionTextColor(condition.type)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span>
                  {condition.icon || getConditionIcon(condition.type)}{" "}
                  <span className="font-semibold">{condition.name}</span>
                </span>
                {condition.turnsRemaining !== null && (
                  <span className="text-xs opacity-75 flex-shrink-0">
                    {condition.turnsRemaining}T
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Memoization: try shallow comparison first
    if (prevProps.conditions.length !== nextProps.conditions.length) {
      return false;
    }
    // Deep comparison of conditions array
    return prevProps.conditions.every(
      (cond, idx) =>
        cond.name === nextProps.conditions[idx].name &&
        cond.type === nextProps.conditions[idx].type &&
        cond.turnsRemaining === nextProps.conditions[idx].turnsRemaining,
    );
  },
);
