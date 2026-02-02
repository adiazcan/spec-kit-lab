import React from "react";

/**
 * HealthDisplay component shows the character's HP status.
 * Displays an HP bar with current/max values and a percentage.
 *
 * Bar colors:
 * - Green: >50% HP
 * - Yellow: 25-50% HP
 * - Red: <25% HP
 * - Gray: 0 HP (defeated)
 *
 * @component
 */
interface HealthDisplayProps {
  /** Current hit points */
  currentHp: number;

  /** Maximum hit points */
  maxHp: number;

  /** Character name for display */
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

export const HealthDisplay: React.FC<HealthDisplayProps> = ({
  currentHp,
  maxHp,
  name = "Character",
}) => {
  const healthPercentage = Math.max(0, (currentHp / maxHp) * 100);
  const isDefeated = currentHp <= 0;

  return (
    <div className="bg-gray-900 p-4 border-b border-gray-700">
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
          className={`h-full transition-all duration-300 ${getHealthColor(currentHp, maxHp)} flex items-center justify-center`}
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
};
