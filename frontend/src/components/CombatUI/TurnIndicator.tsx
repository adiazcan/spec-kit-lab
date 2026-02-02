import React from "react";
import type { Combatant } from "../../types/combat";

interface TurnIndicatorProps {
  /** Currently active combatant */
  currentCombatant: Combatant;
  /** Whether it's the player's turn */
  isPlayerTurn: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Turn indicator banner showing whose turn it is.
 * Displays with green background for player turn, neutral for enemy turn.
 *
 * @component
 * @example
 * ```tsx
 * <TurnIndicator
 *   currentCombatant={activeCombatant}
 *   isPlayerTurn={true}
 * />
 * ```
 */
export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentCombatant,
  isPlayerTurn,
  className = "",
}) => {
  const bgColor = isPlayerTurn ? "bg-green-700" : "bg-gray-700";
  const icon = isPlayerTurn ? "🗡️" : "⏳";
  const turnText = isPlayerTurn
    ? "YOUR TURN"
    : `${currentCombatant.name}'s Turn`;

  return (
    <div
      className={`turn-indicator ${bgColor} text-white px-4 py-3 rounded-lg font-bold text-center ${className}`}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="turn-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="turn-text text-lg">{turnText}</span>
      </div>
    </div>
  );
};

export default TurnIndicator;
