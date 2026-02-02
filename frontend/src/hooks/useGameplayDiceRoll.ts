import { useState, useCallback, useRef, useEffect } from "react";
import type { DiceRollResult } from "../types/game";
import type { CombatActionResult } from "../types/combat";
import { calculateAnimationDuration } from "../utils/diceAnimationHelper";

/**
 * useDiceRoll Hook for Gameplay
 *
 * Manages dice roll state and animation lifecycle during gameplay/combat.
 *
 * Handles:
 * - Display and animation of dice rolls from game actions
 * - Tracking currently visible roll in UI
 * - Animation timing and completion callbacks
 * - Extraction of dice roll data from combat/action responses
 *
 * Different from useCharacterFormDiceRoll (character creation):
 * - This hook displays rolls triggered by gameplay actions
 * - Receives roll data from API responses
 * - Manages temporary visual animations
 * - Auto-clears after animation completes
 */

/**
 * Return type for useDiceRoll hook
 */
export interface UseDiceRollReturn {
  // Roll state
  /** Currently displayed roll (null if not rolling) */
  currentRoll: DiceRollResult | null;

  /** Whether animation is currently playing */
  isAnimating: boolean;

  /** Animation duration in milliseconds */
  animationDuration: number;

  // Methods
  /** Display a new dice roll animation */
  displayRoll: (roll: DiceRollResult) => void;

  /** Extract and display roll from combat action result */
  displayActionResult: (result: CombatActionResult) => void;

  /** Clear the current roll display */
  clearRoll: () => void;

  /** Auto-dismiss roll after animation (for quick feedback) */
  displayRollWithAutoDismiss: (
    roll: DiceRollResult,
    durationMs?: number,
  ) => void;
}

/**
 * Hook for managing dice roll display and animation during gameplay.
 *
 * Handles receiving dice rolls from API responses and displaying them
 * with appropriate animations and visual feedback.
 *
 * @param autoDismissAfterAnimation - Auto-dismiss roll after animation completes (default: false)
 * @returns Dice roll state and display methods
 *
 * @example
 * ```typescript
 * const dice = useDiceRoll();
 *
 * // From combat turn response
 * const handleAttack = async () => {
 *   const result = await combatApi.resolveTurn(turnRequest);
 *   dice.displayActionResult(result.actionResult);
 * };
 *
 * // Direct roll display
 * const handleSkillCheck = async () => {
 *   const skillRoll = await api.rollSkillCheck({ skill: 'perception' });
 *   dice.displayRoll(skillRoll);
 * };
 *
 * // In component:
 * return (
 *   <>
 *     {dice.currentRoll && (
 *       <DiceRollAnimation
 *         roll={dice.currentRoll}
 *         isAnimating={dice.isAnimating}
 *         onAnimationComplete={() => dice.clearRoll()}
 *       />
 *     )}
 *   </>
 * );
 * ```
 */
export function useGameplayDiceRoll(
  autoDismissAfterAnimation = false,
): UseDiceRollReturn {
  // ============ State ============

  /** Currently displayed roll (null if animation not active) */
  const [currentRoll, setCurrentRoll] = useState<DiceRollResult | null>(null);

  /** Whether animation is playing */
  const [isAnimating, setIsAnimating] = useState(false);

  /** Animation duration for current roll */
  const [animationDuration, setAnimationDuration] = useState(1200);

  /** Timer reference for auto-dismiss */
  const autoDismissTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // ============ Methods ============

  /**
   * Display a new dice roll animation
   *
   * @param roll - Dice roll result to display
   * @example
   * ```typescript
   * const roll: DiceRollResult = {
   *   notation: "1d20+5",
   *   baseRoll: 15,
   *   modifiers: 5,
   *   total: 20
   * };
   * dice.displayRoll(roll);
   * ```
   */
  const displayRoll = useCallback((roll: DiceRollResult): void => {
    setCurrentRoll(roll);
    setIsAnimating(true);

    // Calculate animation duration based on roll complexity
    const duration = calculateAnimationDuration(roll);
    setAnimationDuration(duration);

    // Auto-completion timer
    setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  }, []);

  /**
   * Extract and display dice roll from combat/action result
   *
   * Looks for attack roll or damage roll in the result and displays it.
   *
   * @param result - Combat action result from API response
   * @example
   * ```typescript
   * const result = await combatApi.resolveTurn(...);
   * dice.displayActionResult(result.actionResult);
   * ```
   */
  const displayActionResult = useCallback(
    (result: CombatActionResult): void => {
      // Prioritize attack roll if available, otherwise damage roll
      const rollToDisplay = result.attackRoll || result.damageRoll;

      if (rollToDisplay) {
        displayRoll(rollToDisplay);
      }
    },
    [displayRoll],
  );

  /**
   * Display roll with automatic dismissal after animation + additional time
   *
   * Useful for quick feedback that auto-clears without user intervention.
   *
   * @param roll - Dice roll to display
   * @param durationMs - Additional time to show result after animation (default: 2000ms)
   * @example
   * ```typescript
   * // Show roll for 2s after animation
   * dice.displayRollWithAutoDismiss(roll);
   *
   * // Or custom duration
   * dice.displayRollWithAutoDismiss(roll, 3000);
   * ```
   */
  const displayRollWithAutoDismiss = useCallback(
    (roll: DiceRollResult, durationMs = 2000): void => {
      // Clear any existing timer
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }

      // Display the roll
      displayRoll(roll);

      // Calculate total time: animation + display time
      const duration = calculateAnimationDuration(roll);
      const totalTime = duration + durationMs;

      // Auto-dismiss
      autoDismissTimerRef.current = setTimeout(() => {
        setCurrentRoll(null);
        setIsAnimating(false);
      }, totalTime);
    },
    [displayRoll],
  );

  /**
   * Clear the current roll display
   *
   * Used to manually dismiss the roll animation.
   */
  const clearRoll = useCallback((): void => {
    // Clear any auto-dismiss timers
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }

    setCurrentRoll(null);
    setIsAnimating(false);
  }, []);

  /**
   * Auto-dismiss behavior when animation completes
   */
  useEffect(() => {
    if (autoDismissAfterAnimation && !isAnimating && currentRoll) {
      const timer = setTimeout(() => {
        clearRoll();
      }, 2000); // Show result for 2 seconds after animation ends

      return () => clearTimeout(timer);
    }
  }, [autoDismissAfterAnimation, isAnimating, currentRoll, clearRoll]);

  // ============ Cleanup ============

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, []);

  // ============ Return ============

  return {
    currentRoll,
    isAnimating,
    animationDuration,
    displayRoll,
    displayActionResult,
    clearRoll,
    displayRollWithAutoDismiss,
  };
}
