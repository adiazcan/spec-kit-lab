import React, { useMemo } from "react";
import type { DiceRollResult } from "../../types/game";

/**
 * DiceVisualizer component displays a 3D (or stylized 2D) representation of dice.
 *
 * Renders a visual representation of the dice being rolled, supporting:
 * - Single die (1d20, 1d12, etc.)
 * - Multiple dice (2d6, 4d4, etc.)
 * - 3D CSS transforms for depth effect
 *
 * @component
 * @example
 * ```tsx
 * const roll: DiceRollResult = {
 *   notation: "1d20",
 *   baseRoll: 15,
 *   modifiers: 5,
 *   total: 20,
 *   diceResults: [15]
 * };
 * return <DiceVisualizer roll={roll} isAnimating={true} />;
 * ```
 */
interface DiceVisualizerProps {
  /** Dice roll data with notation and results */
  roll: DiceRollResult;

  /** Whether animation is currently playing */
  isAnimating: boolean;

  /** Optional custom size (default: "medium") */
  size?: "small" | "medium" | "large";
}

/**
 * Parse dice notation to extract number and sides
 * e.g., "2d6" -> { count: 2, sides: 6 }
 */
function parseDiceNotation(notation: string): { count: number; sides: number } {
  const match = notation.match(/(\d+)d(\d+)/);
  if (!match) {
    return { count: 1, sides: 20 }; // default d20
  }
  return { count: parseInt(match[1], 10), sides: parseInt(match[2], 10) };
}

/**
 * Get die color based on sides (D&D convention)
 */
function getDieColor(sides: number): string {
  switch (sides) {
    case 4:
      return "bg-purple-600";
    case 6:
      return "bg-red-600";
    case 8:
      return "bg-blue-600";
    case 10:
      return "bg-green-600";
    case 12:
      return "bg-orange-600";
    case 20:
      return "bg-indigo-600";
    default:
      return "bg-gray-600";
  }
}

/**
 * Get size classes based on size prop
 */
function getSizeClasses(size: "small" | "medium" | "large"): string {
  const base = "flex items-center justify-center font-bold text-white";
  switch (size) {
    case "small":
      return `${base} w-12 h-12 text-lg`;
    case "large":
      return `${base} w-32 h-32 text-5xl`;
    default:
      return `${base} w-20 h-20 text-2xl`;
  }
}

export const DiceVisualizer: React.FC<DiceVisualizerProps> = ({
  roll,
  isAnimating,
  size = "medium",
}) => {
  const { count, sides } = useMemo(
    () => parseDiceNotation(roll.notation),
    [roll.notation],
  );

  const dieColor = getDieColor(sides);
  const sizeClasses = getSizeClasses(size);

  // Show individual die results if available, otherwise show the base roll
  const results =
    roll.diceResults && roll.diceResults.length > 0
      ? roll.diceResults
      : [roll.baseRoll];

  return (
    <div
      className="flex gap-3 items-center justify-center"
      role="img"
      aria-label={`Dice roll: ${roll.notation}`}
      aria-busy={isAnimating}
    >
      {/* Multiple dice display */}
      {count > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {results.slice(0, count).map((result, index) => (
            <div
              key={`die-${index}`}
              className={`
                ${sizeClasses}
                ${dieColor}
                rounded-lg
                shadow-lg
                transition-transform
                ${isAnimating ? `dice-roll-animate-${(index % 3) + 1}` : ""}
                ${!isAnimating && index < results.length ? "dice-bounce-land" : ""}
              `}
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              <span>{result}</span>
            </div>
          ))}
        </div>
      )}

      {/* Single die display */}
      {count === 1 && (
        <div
          className={`
            ${sizeClasses}
            ${dieColor}
            rounded-lg
            shadow-2xl
            transition-all
            ${isAnimating ? "dice-roll-animate" : "dice-bounce-land"}
          `}
          style={{
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
        >
          <span>{results[0]}</span>
        </div>
      )}

      {/* Modifiers display */}
      {roll.modifiers !== 0 && !isAnimating && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">+</span>
          <div
            className={`
              ${getDieColor(6)}
              flex items-center justify-center
              w-12 h-12
              text-sm
              font-bold
              text-white
              rounded-lg
              shadow-lg
            `}
          >
            {roll.modifiers > 0 ? `+${roll.modifiers}` : roll.modifiers}
          </div>
        </div>
      )}
    </div>
  );
};
