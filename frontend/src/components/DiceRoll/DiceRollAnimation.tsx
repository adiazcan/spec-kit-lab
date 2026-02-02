import React, { useEffect, useMemo } from "react";
import type { DiceRollResult } from "../../types/game";
import { DiceVisualizer } from "./DiceVisualizer";
import { DiceResult } from "./DiceResult";
import { calculateAnimationDuration } from "../../utils/diceAnimationHelper";

/**
 * DiceRollAnimation component displays an animated dice roll with result reveal.
 *
 * Handles the complete dice roll animation lifecycle:
 * 1. Spinning animation phase (1.2-1.5 seconds)
 * 2. Result reveal phase with breakdown
 * 3. Optional auto-dismiss (configurable)
 *
 * @component
 * @example
 * ```tsx
 * const roll: DiceRollResult = {
 *   notation: "1d20+5",
 *   baseRoll: 15,
 *   modifiers: 5,
 *   total: 20,
 *   context: "Attack vs Goblin"
 * };
 *
 * return (
 *   <DiceRollAnimation
 *     roll={roll}
 *     onAnimationComplete={() => console.log("Done!")}
 *     autoDismissMs={3000}
 *   />
 * );
 * ```
 */
interface DiceRollAnimationProps {
  /** Dice roll data to animate */
  roll: DiceRollResult;

  /** Callback when animation completes */
  onAnimationComplete?: () => void;

  /** Auto-dismiss after this many ms (0 = no auto-dismiss, default: 0) */
  autoDismissMs?: number;

  /** Size of dice (default: "medium") */
  diceSize?: "small" | "medium" | "large";

  /** Optional custom CSS class */
  className?: string;
}

export const DiceRollAnimation: React.FC<DiceRollAnimationProps> = ({
  roll,
  onAnimationComplete,
  autoDismissMs = 0,
  diceSize = "medium",
  className = "",
}) => {
  const animationDuration = useMemo(
    () => calculateAnimationDuration(roll),
    [roll],
  );

  // Handle animation completion and auto-dismiss
  useEffect(() => {
    // Animation completes after dice stop spinning
    const animationTimer = setTimeout(() => {
      onAnimationComplete?.();
    }, animationDuration);

    // Auto-dismiss the component if specified
    let dismissTimer: NodeJS.Timeout;
    if (autoDismissMs > 0) {
      dismissTimer = setTimeout(() => {
        onAnimationComplete?.();
      }, animationDuration + autoDismissMs);
    }

    return () => {
      clearTimeout(animationTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [animationDuration, autoDismissMs, onAnimationComplete]);

  // Determine if still animating (within animation duration)
  const [isAnimating, setIsAnimating] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);

    return () => clearTimeout(timer);
  }, [animationDuration]);

  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        gap-6
        p-6
        bg-gradient-to-br
        from-slate-900
        to-slate-800
        rounded-lg
        border-2
        border-blue-500
        shadow-2xl
        ${className}
      `}
    >
      {/* Animated dice display */}
      <div className="flex flex-col items-center gap-4">
        <DiceVisualizer roll={roll} isAnimating={isAnimating} size={diceSize} />

        {/* Spinning indicator text */}
        {isAnimating && (
          <div className="text-center">
            <p className="text-sm text-blue-300 font-semibold animate-pulse">
              Rolling...
            </p>
          </div>
        )}
      </div>

      {/* Result reveal (shown after animation completes) */}
      {!isAnimating && (
        <div className="w-full animate-fade-in">
          <DiceResult roll={roll} />
        </div>
      )}

      {/* Loading skeleton during animation */}
      {isAnimating && (
        <div className="w-full">
          <div className="bg-slate-700 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-slate-600 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-600 rounded w-1/2"></div>
          </div>
        </div>
      )}
    </div>
  );
};
