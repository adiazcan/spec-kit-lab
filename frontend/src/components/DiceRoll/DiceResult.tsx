import React, { useMemo } from "react";
import type { DiceRollResult } from "../../types/game";
import { checkCritical, formatDiceRoll } from "../../utils/diceAnimationHelper";

/**
 * DiceResult component displays the final dice roll result with detailed breakdown.
 *
 * Shows:
 * - Base roll result
 * - Applied modifiers
 * - Final total
 * - Critical success/failure indicators
 * - Roll context/description
 *
 * @component
 * @example
 * ```tsx
 * const roll: DiceRollResult = {
 *   notation: "1d20+5",
 *   baseRoll: 15,
 *   modifiers: 5,
 *   total: 20,
 *   context: "Attack vs Goblin",
 *   critical: "success"
 * };
 * return <DiceResult roll={roll} />;
 * ```
 */
interface DiceResultProps {
  /** Dice roll data to display */
  roll: DiceRollResult;

  /** Optional custom CSS class */
  className?: string;
}

/**
 * Get background color class based on critical status
 */
function getCriticalColorClass(critical: DiceRollResult["critical"]): string {
  switch (critical) {
    case "success":
      return "bg-green-100 border-green-500";
    case "failure":
      return "bg-red-100 border-red-500";
    default:
      return "bg-slate-100 border-slate-300";
  }
}

/**
 * Get text color for critical result
 */
function getCriticalTextClass(critical: DiceRollResult["critical"]): string {
  switch (critical) {
    case "success":
      return "text-green-700";
    case "failure":
      return "text-red-700";
    default:
      return "text-slate-700";
  }
}

/**
 * Get glow/shadow effect for critical results
 */
function getCriticalGlowClass(critical: DiceRollResult["critical"]): string {
  switch (critical) {
    case "success":
      return "shadow-lg shadow-green-400";
    case "failure":
      return "shadow-lg shadow-red-400";
    default:
      return "shadow-md";
  }
}

export const DiceResult: React.FC<DiceResultProps> = ({
  roll,
  className = "",
}) => {
  const critical = useMemo(() => checkCritical(roll), [roll]);
  const formattedRoll = useMemo(() => formatDiceRoll(roll), [roll]);

  const glowClass =
    critical === "success"
      ? "critical-success-glow"
      : critical === "failure"
        ? "critical-failure-glow"
        : "";

  return (
    <div
      className={`
        p-4
        rounded-lg
        border-2
        transition-all
        ${getCriticalColorClass(critical)}
        ${getCriticalGlowClass(critical)}
        ${glowClass}
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label={`Dice roll result: ${formattedRoll}`}
    >
      {/* Roll context */}
      {roll.context && (
        <p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">
          {roll.context}
        </p>
      )}

      {/* Roll notation and breakdown */}
      <div className="mb-3">
        <p className="text-lg font-bold text-slate-800 mb-1">{roll.notation}</p>

        {/* Detailed breakdown for multi-part rolls */}
        {roll.diceResults && roll.diceResults.length > 1 && (
          <p className="text-sm text-slate-600">
            Rolls: [
            <span className="font-mono">{roll.diceResults.join(", ")}</span>]
          </p>
        )}

        {/* Single die or summary */}
        <p className="text-sm text-slate-600">
          {roll.diceResults && roll.diceResults.length === 1
            ? `Roll: ${roll.diceResults[0]}`
            : `Base: ${roll.baseRoll}`}
        </p>
      </div>

      {/* Modifiers */}
      {roll.modifiers !== 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-slate-600">Modifiers:</span>
          <span className="font-mono font-bold text-slate-800">
            {roll.modifiers > 0 ? "+" : ""}
            {roll.modifiers}
          </span>
        </div>
      )}

      {/* Total result - highlighted */}
      <div className="border-t-2 border-current border-opacity-20 pt-3 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-600">Total:</span>
          <span
            className={`
              text-3xl
              font-bold
              font-mono
              ${getCriticalTextClass(critical)}
            `}
          >
            {roll.total}
          </span>
        </div>
      </div>

      {/* Critical indicator with visual effect */}
      {critical && (
        <div
          className={`
            mt-3
            p-2
            rounded
            text-center
            font-bold
            text-sm
            uppercase
            tracking-wider
            ${critical === "success" ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"}
          `}
        >
          {critical === "success" ? (
            <>✨ CRITICAL SUCCESS ✨</>
          ) : (
            <>⚠️ CRITICAL FAILURE ⚠️</>
          )}
        </div>
      )}

      {/* Full formatted roll for screen readers */}
      <p className="sr-only">{formattedRoll}</p>
    </div>
  );
};
