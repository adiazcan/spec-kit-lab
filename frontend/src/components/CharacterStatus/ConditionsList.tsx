import React from "react";
import type { ActiveCondition } from "../../types/combat";

/**
 * ConditionsList component displays active status effects/conditions.
 * Shows condition name, type, and remaining turns.
 *
 * Condition type colors:
 * - buff: Green (positive effects)
 * - debuff: Red (negative effects)
 * - neutral: Gray (neutral effects)
 *
 * @component
 */
interface ConditionsListProps {
  /** Array of active conditions */
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

export const ConditionsList: React.FC<ConditionsListProps> = ({
  conditions,
}) => {
  if (conditions.length === 0) {
    return (
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">CONDITIONS</h4>
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
            className={`p-2 rounded border text-xs ${getConditionBgColor(
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
};
