import React from "react";
import type { CombatState } from "../../types/combat";
import { useCombatState } from "../../hooks/useCombatState";
import { TurnIndicator } from "./TurnIndicator";
import { RoundCounter } from "./RoundCounter";
import { CombatantsList } from "./CombatantsList";

interface CombatOverlayProps {
  /** Combat state data */
  combat: CombatState;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Combat mode UI overlay container.
 * Displays combat state, turn information, and combatants list.
 *
 * @component
 * @example
 * ```tsx
 * <CombatOverlay combat={combatState} />
 * ```
 */
export const CombatOverlay: React.FC<CombatOverlayProps> = ({
  combat,
  className = "",
}) => {
  const { currentCombatant, isPlayerTurn } = useCombatState(combat);

  if (!currentCombatant) {
    return null;
  }

  return (
    <div
      className={`combat-overlay bg-gray-900/95 border border-red-700 rounded-lg p-4 ${className}`}
      role="region"
      aria-label="Combat Status"
    >
      <div className="combat-header flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
          <span className="combat-icon" aria-hidden="true">
            ⚔️
          </span>
          <span>COMBAT</span>
        </h2>
        <RoundCounter round={combat.round} />
      </div>

      <div className="combat-content space-y-4">
        {/* Turn Indicator */}
        <TurnIndicator
          currentCombatant={currentCombatant}
          isPlayerTurn={isPlayerTurn}
        />

        {/* Combatants List */}
        <CombatantsList
          combatants={combat.combatants}
          currentTurnIndex={combat.currentTurnIndex}
        />
      </div>
    </div>
  );
};

export default CombatOverlay;
