import React from "react";
import type { Combatant } from "../../types/combat";

interface CombatantsListProps {
  /** Array of all combatants in initiative order */
  combatants: Combatant[];
  /** Index of the currently active combatant */
  currentTurnIndex: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * List of all combatants in combat with their status.
 * Displays in initiative order with active turn highlighting.
 *
 * @component
 * @example
 * ```tsx
 * <CombatantsList
 *   combatants={combatants}
 *   currentTurnIndex={0}
 * />
 * ```
 */
export const CombatantsList: React.FC<CombatantsListProps> = ({
  combatants,
  currentTurnIndex,
  className = "",
}) => {
  /**
   * Calculate HP percentage for color coding.
   */
  const getHpPercentage = (combatant: Combatant): number => {
    return (combatant.currentHp / combatant.maxHp) * 100;
  };

  /**
   * Get HP bar color based on percentage.
   */
  const getHpBarColor = (percentage: number): string => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  /**
   * Get combatant type label with icon.
   */
  const getCombatantTypeLabel = (type: Combatant["type"]): string => {
    switch (type) {
      case "player":
        return "[YOU]";
      case "enemy":
        return "[ENEMY]";
      case "ally":
        return "[ALLY]";
      default:
        return "";
    }
  };

  return (
    <div
      className={`combatants-list space-y-2 ${className}`}
      role="list"
      aria-label="Combatants in combat"
    >
      {combatants.map((combatant, index) => {
        const isActive = index === currentTurnIndex;
        const isDefeated = combatant.status === "defeated";
        const hpPercentage = getHpPercentage(combatant);
        const hpBarColor = getHpBarColor(hpPercentage);

        return (
          <div
            key={combatant.id}
            className={`combatant-card border rounded-lg p-3 transition-all ${
              isActive
                ? "border-green-500 bg-green-900/20"
                : "border-gray-700 bg-gray-800/50"
            } ${isDefeated ? "opacity-50" : ""}`}
            role="listitem"
          >
            <div className="combatant-header flex items-center gap-2 mb-2">
              {isActive && (
                <span
                  className="active-indicator text-green-500"
                  aria-label="Active turn"
                >
                  ▶️
                </span>
              )}
              <span
                className={`combatant-type text-xs font-bold ${
                  combatant.type === "player"
                    ? "text-blue-400"
                    : combatant.type === "enemy"
                      ? "text-red-400"
                      : "text-green-400"
                }`}
              >
                {getCombatantTypeLabel(combatant.type)}
              </span>
              <span
                className={`combatant-name font-semibold ${
                  isDefeated ? "line-through text-gray-500" : "text-white"
                }`}
              >
                {combatant.name}
              </span>
            </div>

            <div className="combatant-stats text-sm space-y-1">
              {/* HP Bar */}
              <div className="hp-display">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">HP:</span>
                  <span
                    className={`font-semibold ${
                      isDefeated ? "text-red-500" : "text-white"
                    }`}
                  >
                    {combatant.currentHp} / {combatant.maxHp}
                  </span>
                </div>
                <div className="hp-bar-container bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`hp-bar ${hpBarColor} h-full transition-all duration-300`}
                    style={{ width: `${Math.max(0, hpPercentage)}%` }}
                    role="progressbar"
                    aria-valuenow={combatant.currentHp}
                    aria-valuemin={0}
                    aria-valuemax={combatant.maxHp}
                    aria-label={`${combatant.name} hit points`}
                  />
                </div>
              </div>

              {/* AC */}
              <div className="ac-display flex justify-between text-gray-300">
                <span>AC:</span>
                <span>{combatant.armorClass}</span>
              </div>

              {/* Initiative */}
              <div className="initiative-display flex justify-between text-gray-300">
                <span>Initiative:</span>
                <span>{combatant.initiative}</span>
              </div>

              {/* Active Conditions */}
              {combatant.conditions.length > 0 && (
                <div className="conditions-display mt-2">
                  <div className="text-gray-400 text-xs mb-1">Conditions:</div>
                  <div className="flex flex-wrap gap-1">
                    {combatant.conditions.map((condition, idx: number) => (
                      <span
                        key={idx}
                        className={`condition-badge text-xs px-2 py-1 rounded ${
                          condition.type === "buff"
                            ? "bg-green-700 text-green-200"
                            : condition.type === "debuff"
                              ? "bg-red-700 text-red-200"
                              : "bg-gray-700 text-gray-200"
                        }`}
                        title={
                          condition.turnsRemaining
                            ? `${condition.turnsRemaining} turns remaining`
                            : "Permanent"
                        }
                      >
                        {condition.icon && (
                          <span className="mr-1">{condition.icon}</span>
                        )}
                        {condition.name}
                        {condition.turnsRemaining &&
                          ` (${condition.turnsRemaining})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CombatantsList;
