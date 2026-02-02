import React, { memo } from "react";

/**
 * HealthDisplay - Displays character's hit points with visual HP bar
 * T081: Optimized with React.memo to prevent unnecessary re-renders
 *
 * Features:
 * - Color-coded HP bar based on health percentage
 * - Smooth transitions when HP changes (0.3s duration)
 * - Percentage display with formatting
 * - Defeated status indication
 * - Responsive sizing
 *
 * Visual Design:
 * - Green bar: >50% HP (healthy)
 * - Yellow bar: 25-50% HP (wounded)
 * - Red bar: <25% HP (critical)
 * - Gray bar: 0 HP (defeated)
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.currentHp - Current hit points (0 to maxHp)
 * @param {number} props.maxHp - Maximum hit points (must be > 0)
 * @param {string} [props.name="Character"] - Character/combatant name for display
 *
 * @example
 * ```tsx
 * <HealthDisplay currentHp={25} maxHp={30} name="Player Character" />
 * // Displays: "Player Character 25/30" with 83% green bar
 * ```
 */
interface HealthDisplayProps {
  /** Current hit points (0 to maxHp) */
  currentHp: number;

  /** Maximum hit points (must be > 0) */
  maxHp: number;

  /** Character name for display (default: "Character") */
  name?: string;
}

const getHealthColor = (current: number, max: number): string => {
  if (current <= 0) return "bg-gray-600";
  const percentage = (current / max) * 100;
  if (percentage > 50) return "bg-green-500";
  if (percentage > 25) return "bg-yellow-500";
  return "bg-red-500";
};

const getHealthTextColor = (current: number, max: number): string => {
  if (current <= 0) return "text-gray-400";
  const percentage = (current / max) * 100;
  if (percentage > 50) return "text-green-400";
  if (percentage > 25) return "text-yellow-400";
  return "text-red-400";
};

/**
 * Memoized component - only re-renders when HP values actually change
 * Uses custom comparison to avoid unnecessary renders during parent updates
 */
export const HealthDisplay: React.FC<HealthDisplayProps> = memo(
  ({ currentHp, maxHp, name = "Character" }) => {
    const healthPercentage = Math.max(0, (currentHp / maxHp) * 100);
    const isDefeated = currentHp <= 0;

    return (
      <div className="bg-gray-900 p-4 border-b border-gray-700 health-display">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-semibold">{name}</h3>
          <span
            className={`text-sm font-bold ${getHealthTextColor(currentHp, maxHp)}`}
          >
            {isDefeated ? "DEFEATED" : `${currentHp}/${maxHp}`}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden border border-gray-600">
          <div
            className={`hp-bar h-full ${getHealthColor(currentHp, maxHp)} flex items-center justify-center`}
            style={{ width: `${healthPercentage}%` }}
          >
            {healthPercentage > 10 && (
              <span className="text-xs font-bold text-white">
                {Math.round(healthPercentage)}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Memoization: re-render only if currentHp or maxHp changed
    return (
      prevProps.currentHp === nextProps.currentHp &&
      prevProps.maxHp === nextProps.maxHp &&
      prevProps.name === nextProps.name
    );
  },
);
