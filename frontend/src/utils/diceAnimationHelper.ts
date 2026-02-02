/**
 * Dice Animation Helper Utilities
 *
 * Utilities for managing dice roll animations:
 * - generateDiceRotation: Generate random rotation values for 3D dice
 * - formatDiceRoll: Format dice roll result for display
 * - checkCritical: Determine if roll is critical success/failure
 */

import type { DiceRollResult } from "../types/game";

/**
 * Generate random 3D rotation values for dice animation
 *
 * @returns Object with rotationX, rotationY, rotationZ in degrees
 *
 * Used to create realistic spinning appearance during dice roll animation.
 * Values are randomized within realistic ranges.
 */
export function generateDiceRotation() {
  return {
    rotationX: Math.random() * 360,
    rotationY: Math.random() * 360,
    rotationZ: Math.random() * 360,
  };
}

/**
 * Format a dice roll result for display
 *
 * @param roll - DiceRollResult object
 * @returns Formatted string like "1d20+5: 12+5 = 17" or "2d6: [3,2]+1 = 6"
 *
 * Format varies based on dice type and complexity.
 */
export function formatDiceRoll(roll: DiceRollResult): string {
  const { notation, baseRoll, modifiers, total, diceResults } = roll;

  // Multi-die roll with individual results: "2d6: [3,2]+1 = 6"
  if (diceResults && diceResults.length > 1) {
    const diceStr = `[${diceResults.join(",")}]`;
    const modStr =
      modifiers !== 0 ? (modifiers > 0 ? `+${modifiers}` : `${modifiers}`) : "";
    return `${notation}: ${diceStr}${modStr} = ${total}`;
  }

  // Single die or simple roll: "1d20+5: 12+5 = 17"
  const modStr =
    modifiers !== 0 ? (modifiers > 0 ? `+${modifiers}` : `${modifiers}`) : "";
  return `${notation}: ${baseRoll}${modStr} = ${total}`;
}

/**
 * Check if a d20 roll is critical success or failure
 *
 * @param roll - DiceRollResult object
 * @returns "success", "failure", or null (not a d20 roll or normal result)
 *
 * D&D 5E rules:
 * - Natural 20 (baseRoll === 20) = critical success
 * - Natural 1 (baseRoll === 1) = critical failure
 * - Other rolls = null
 */
export function checkCritical(
  roll: DiceRollResult,
): "success" | "failure" | null {
  // Only d20 rolls can be critical
  if (!roll.notation.includes("d20")) {
    return null;
  }

  if (roll.baseRoll === 20) {
    return "success";
  }

  if (roll.baseRoll === 1) {
    return "failure";
  }

  return null;
}

/**
 * Calculate animation duration based on roll complexity
 *
 * @param roll - DiceRollResult object
 * @returns Duration in milliseconds (1200-1500ms)
 *
 * More complex rolls (multiple dice) get slightly longer animations
 * to allow time for all dice to settle.
 */
export function calculateAnimationDuration(roll: DiceRollResult): number {
  const baseTime = 1200; // 1.2 seconds
  const extraTime = (roll.diceResults?.length || 1) * 50; // +50ms per die
  return Math.min(baseTime + extraTime, 1500); // Cap at 1.5 seconds
}

/**
 * Generate CSS animation delay sequence for multiple dice
 *
 * @param diceCount - Number of dice to animate
 * @returns Array of delay values in milliseconds
 *
 * Creates staggered animation effect where each die settles slightly after the previous.
 */
export function generateAnimationDelays(diceCount: number): number[] {
  return Array.from({ length: diceCount }, (_, i) => i * 100);
}

/**
 * Format a roll result with context for narrative
 *
 * @param roll - DiceRollResult object
 * @returns Formatted narrative string with outcome description
 *
 * Example: "Attack Roll (1d20+5): 17 ✓ HIT"
 */
export function formatRollNarrative(roll: DiceRollResult): string {
  const baseStr = formatDiceRoll(roll);
  const context = roll.context ? `${roll.context}: ` : "";
  const critical = checkCritical(roll);

  let result = context + baseStr;

  if (critical === "success") {
    result += " ✓ CRITICAL SUCCESS";
  } else if (critical === "failure") {
    result += " ✗ CRITICAL FAILURE";
  }

  return result;
}

/**
 * Validate dice notation string
 *
 * @param notation - Dice notation string (e.g., "1d20+5", "2d6")
 * @returns true if notation is valid, false otherwise
 *
 * Valid format: NdN[±M] where N is digits, optional ±M is modifier
 */
export function isValidDiceNotation(notation: string): boolean {
  const regex = /^\d+d\d+([+-]\d+)?$/;
  return regex.test(notation);
}
