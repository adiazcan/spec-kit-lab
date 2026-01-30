/**
 * Dice Roller Utility
 * Implements D&D 5E standard 4d6 drop lowest dice rolling
 * Used during character creation in dice-roll mode
 *
 * Pure functions - no side effects, returns deterministic value
 * at time of call (random number generation via Math.random())
 */

import { DiceRoll } from "@/types/character";

/**
 * Generate a single random d6 result (1-6)
 *
 * @returns Random integer from 1 to 6 inclusive
 * @internal Used internally by roll4d6DropLowest
 *
 * @example
 * ```typescript
 * rollD6();  // Returns: 1-6 (random)
 * ```
 */
function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll 4d6 and drop the lowest die (D&D 5E standard)
 *
 * Process:
 * 1. Roll four 6-sided dice (each 1-6)
 * 2. Find the lowest die value
 * 3. Sum the remaining three dice
 * 4. Return result with all dice shown (for UI visualization)
 *
 * Possible Results: 3-18
 * - Minimum: 1+1+1 = 3 (all ones, drop one)
 * - Maximum: 6+6+6 = 18 (three sixes, drop one)
 *
 * Distribution: Heavily weighted toward higher values (bell curve 8-15)
 * - This gives more exciting results compared to 3d6 (median ~10)
 * - While staying within standard attribute range (3-18)
 *
 * @returns DiceRoll object with dice array, sum, and dropped index
 *
 * @example
 * ```typescript
 * const roll = roll4d6DropLowest();
 * console.log(roll.dice);      // [3, 5, 6, 2]
 * console.log(roll.dropped);   // 3 (index of the 2)
 * console.log(roll.sum);       // 14 (3+5+6)
 *
 * // UI can highlight dice[3] as the dropped die
 * ```
 */
export function roll4d6DropLowest(): DiceRoll {
  // Roll four dice
  const dice: [number, number, number, number] = [
    rollD6(),
    rollD6(),
    rollD6(),
    rollD6(),
  ];

  // Find index of the minimum die
  let minIndex = 0;
  let minValue = dice[0];

  for (let i = 1; i < 4; i++) {
    if (dice[i] < minValue) {
      minValue = dice[i];
      minIndex = i;
    }
  }

  // Sum the three highest dice (all except the minimum)
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    if (i !== minIndex) {
      sum += dice[i];
    }
  }

  return {
    dice,
    sum,
    dropped: minIndex,
    timestamp: Date.now(),
  };
}

/**
 * Roll attributes for all six ability scores
 * (Note: D&D 5E typically has 6 ability scores, but this feature uses 5)
 *
 * @param count - Number of rolls to generate (default: 5 for STR, DEX, INT, CON, CHA)
 * @returns Array of DiceRoll results, one per ability score
 *
 * @example
 * ```typescript
 * const rolls = rollAllAttributes(5);
 * // Returns: [
 * //   { dice: [3,5,6,2], sum: 14, dropped: 3 },
 * //   { dice: [2,4,5,6], sum: 15, dropped: 0 },
 * //   ...
 * // ]
 * ```
 */
export function rollAllAttributes(count: number = 5): DiceRoll[] {
  const rolls: DiceRoll[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(roll4d6DropLowest());
  }
  return rolls;
}

/**
 * Check if a roll is valid
 * Used for validation when importing or processing rolls
 *
 * @param roll - DiceRoll object to validate
 * @returns true if roll is valid, false otherwise
 *
 * Validation rules:
 * - Exactly 4 dice
 * - Each die value 1-6
 * - dropped index 0-3
 * - sum equals sum of three highest dice
 *
 * @example
 * ```typescript
 * const validRoll = { dice: [3,5,6,2], sum: 14, dropped: 3 };
 * isValidRoll(validRoll);  // true
 *
 * const invalidRoll = { dice: [3,5,6], sum: 14, dropped: 3 };
 * isValidRoll(invalidRoll);  // false (only 3 dice)
 * ```
 */
export function isValidRoll(roll: DiceRoll): boolean {
  // Check dice count
  if (!roll.dice || roll.dice.length !== 4) {
    return false;
  }

  // Check each die is 1-6
  for (const die of roll.dice) {
    if (die < 1 || die > 6 || !Number.isInteger(die)) {
      return false;
    }
  }

  // Check dropped index is valid
  if (!Number.isInteger(roll.dropped) || roll.dropped < 0 || roll.dropped > 3) {
    return false;
  }

  // Verify sum is correct
  let expectedSum = 0;
  for (let i = 0; i < 4; i++) {
    if (i !== roll.dropped) {
      expectedSum += roll.dice[i];
    }
  }

  return roll.sum === expectedSum;
}

/**
 * Get probability of rolling a specific value (3-18)
 * Useful for showing odds or probability distribution in UI
 *
 * Returns probability as decimal (0-1)
 * Based on combinatorial analysis of 4d6 drop lowest
 *
 * @param target - Target value (3-18)
 * @returns Probability as decimal (e.g., 0.25 for 25%)
 *
 * @example
 * ```typescript
 * getRollProbability(14);  // Returns ~0.1157 (11.57% chance)
 * getRollProbability(3);   // Returns ~0.0008 (0.08% chance)
 * getRollProbability(18);  // Returns ~0.0308 (3.08% chance)
 * ```
 */
export function getRollProbability(target: number): number {
  // Pre-calculated from combinatorial analysis of all 6^4 = 1296 possibilities
  const probabilities: Record<number, number> = {
    3: 1 / 1296, // 0.00077
    4: 4 / 1296, // 0.00309
    5: 10 / 1296, // 0.00772
    6: 21 / 1296, // 0.01620
    7: 38 / 1296, // 0.02932
    8: 62 / 1296, // 0.04784
    9: 91 / 1296, // 0.07022
    10: 122 / 1296, // 0.09414
    11: 148 / 1296, // 0.11420
    12: 167 / 1296, // 0.12888
    13: 172 / 1296, // 0.13272
    14: 160 / 1296, // 0.12346
    15: 131 / 1296, // 0.10108
    16: 94 / 1296, // 0.07251
    17: 54 / 1296, // 0.04167
    18: 20 / 1296, // 0.01543
  };

  return probabilities[target] ?? 0;
}

/**
 * Get descriptive label for a rolled value
 * Useful for UI feedback ("Excellent!", "Lucky roll!", etc.)
 *
 * @param value - Rolled value (3-18)
 * @returns Descriptive feedback string
 *
 * @example
 * ```typescript
 * getRollFeedback(18);  // "Excellent roll!"
 * getRollFeedback(14);  // "Good roll"
 * getRollFeedback(8);   // "Average roll"
 * getRollFeedback(3);   // "Better luck next time..."
 * ```
 */
export function getRollFeedback(value: number): string {
  if (value >= 17) return "Excellent roll!";
  if (value >= 15) return "Great roll!";
  if (value >= 13) return "Good roll";
  if (value >= 10) return "Average roll";
  if (value >= 8) return "Below average roll";
  if (value >= 5) return "Poor roll";
  return "Unfortunate roll...";
}
