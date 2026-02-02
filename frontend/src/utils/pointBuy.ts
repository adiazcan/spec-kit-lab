/**
 * Point-Buy Attribute Allocation System
 * Implements D&D 5E standard point-buy rules
 * Used during character creation in point-buy mode
 *
 * System: 27 points available, all attributes start at 8
 * Costs increase non-linearly to incentivize specialization
 */

import {
  Attributes,
  ATTRIBUTE_CONSTRAINTS,
  POINT_BUY_CONSTRAINTS,
  POINT_BUY_COSTS,
} from "@/types/character";

/**
 * Calculate total points spent on current attribute allocation
 *
 * Iterates through all attributes and sums their costs using
 * the DnD 5E point-buy cost table.
 *
 * @param attributes - Character attributes to evaluate
 * @returns Total points spent (0-27, can exceed budget)
 *
 * @example
 * ```typescript
 * const attrs = { str: 8, dex: 12, int: 15, con: 10, cha: 14 };
 * calculatePointsSpent(attrs);  // Returns: 0 + 1 + 2 + 0 + 2 = 5 points
 * ```
 */
export function calculatePointsSpent(attributes: Attributes): number {
  let total = 0;

  for (const attr of Object.values(attributes)) {
    const cost = POINT_BUY_COSTS[attr];
    if (cost !== undefined) {
      total += cost;
    }
  }

  return total;
}

/**
 * Calculate remaining points in budget
 *
 * @param attributes - Current attribute allocation
 * @returns Points remaining (27 - pointsSpent)
 * Can be negative if over budget
 *
 * @example
 * ```typescript
 * const attrs = { str: 8, dex: 14, int: 16, con: 12, cha: 15 };
 * getPointsRemaining(attrs);  // Returns: 27 - 8 = 19 points remaining
 * ```
 */
export function getPointsRemaining(attributes: Attributes): number {
  return POINT_BUY_CONSTRAINTS.POOL - calculatePointsSpent(attributes);
}

/**
 * Check if current allocation is within budget
 *
 * @param attributes - Attributes to validate
 * @returns true if total cost <= 27 points, false if over budget
 *
 * @example
 * ```typescript
 * isWithinBudget({ str: 18, ... });  // false (costs 4 points for 18)
 * isWithinBudget({ str: 17, dex: 16, ... });  // depends on other attributes
 * ```
 */
export function isWithinBudget(attributes: Attributes): boolean {
  return calculatePointsSpent(attributes) <= POINT_BUY_CONSTRAINTS.POOL;
}

/**
 * Get the cost to increase an attribute by 1 point
 *
 * Used when the user increments an attribute - tells them
 * how many points it will cost.
 *
 * @param currentValue - Current attribute value (3-18)
 * @returns Cost in points to increase to (currentValue + 1)
 * Returns undefined if at maximum (18) or invalid
 *
 * @example
 * ```typescript
 * getIncrementCost(10);  // Returns: 1 (cost to go from 10→11)
 * getIncrementCost(14);  // Returns: 2 (cost to go from 14→15)
 * getIncrementCost(18);  // Returns: undefined (already maximum)
 * ```
 */
export function getIncrementCost(currentValue: number): number | undefined {
  if (currentValue >= ATTRIBUTE_CONSTRAINTS.MAX) {
    return undefined;
  }

  const nextValue = currentValue + 1;
  const currentCost = POINT_BUY_COSTS[currentValue];
  const nextCost = POINT_BUY_COSTS[nextValue];

  if (currentCost === undefined || nextCost === undefined) {
    return undefined;
  }

  return nextCost - currentCost;
}

/**
 * Get the refund for decreasing an attribute by 1 point
 *
 * When user decreases an attribute, they get these points back.
 *
 * @param currentValue - Current attribute value (3-18)
 * @returns Points refunded when decreasing to (currentValue - 1)
 * Returns undefined if at minimum (3) or invalid
 *
 * @example
 * ```typescript
 * getDecrementRefund(14);  // Returns: 1 (refund from 14→13)
 * getDecrementRefund(10);  // Returns: 1 (refund from 10→9)
 * getDecrementRefund(3);   // Returns: undefined (already minimum)
 * ```
 */
export function getDecrementRefund(currentValue: number): number | undefined {
  if (currentValue <= ATTRIBUTE_CONSTRAINTS.MIN) {
    return undefined;
  }

  const previousValue = currentValue - 1;
  const currentCost = POINT_BUY_COSTS[currentValue];
  const previousCost = POINT_BUY_COSTS[previousValue];

  if (currentCost === undefined || previousCost === undefined) {
    return undefined;
  }

  return currentCost - previousCost;
}

/**
 * Get cost for this specific attribute value
 *
 * @param value - Attribute value to check (3-18)
 * @returns Cost in points, or undefined if invalid
 *
 * @example
 * ```typescript
 * getAttributeCost(8);   // Returns: 0 (starting value)
 * getAttributeCost(14);  // Returns: 2
 * getAttributeCost(18);  // Returns: 4
 * getAttributeCost(25);  // Returns: undefined (invalid)
 * ```
 */
export function getAttributeCost(value: number): number | undefined {
  return POINT_BUY_COSTS[value];
}

/**
 * Create a point-buy attribute allocation with validation
 *
 * Validates that:
 * - All attributes are within 3-18 range
 * - Total cost does not exceed 27 points
 *
 * @param attributes - Proposed attribute values
 * @returns Validation result with success status and error message if invalid
 *
 * @example
 * ```typescript
 * validatePointBuy({ str: 14, dex: 12, int: 15, con: 13, cha: 11 });
 * // Returns: { valid: true, pointsUsed: 5 }
 *
 * validatePointBuy({ str: 20, dex: 12, int: 15, con: 13, cha: 11 });
 * // Returns: { valid: false, error: "STR must be 3-18" }
 * ```
 */
export function validatePointBuy(attributes: Attributes): {
  valid: boolean;
  pointsUsed: number;
  error?: string;
} {
  // Check each attribute is in valid range
  for (const [attr, value] of Object.entries(attributes)) {
    if (
      value < ATTRIBUTE_CONSTRAINTS.MIN ||
      value > ATTRIBUTE_CONSTRAINTS.MAX
    ) {
      return {
        valid: false,
        pointsUsed: 0,
        error: `${attr.toUpperCase()} must be ${ATTRIBUTE_CONSTRAINTS.MIN}-${ATTRIBUTE_CONSTRAINTS.MAX}`,
      };
    }
  }

  const pointsUsed = calculatePointsSpent(attributes);

  // Check budget
  if (pointsUsed > POINT_BUY_CONSTRAINTS.POOL) {
    return {
      valid: false,
      pointsUsed,
      error: `Point budget exceeded: ${pointsUsed} / ${POINT_BUY_CONSTRAINTS.POOL}`,
    };
  }

  return { valid: true, pointsUsed };
}

/**
 * Get recommended point-buy allocations for common character archetypes
 *
 * Provides pre-built point-buy combinations for quick character creation.
 * Each uses different specialization strategy.
 *
 * @returns Object with preset allocations (Warrior, Wizard, Rogue, Cleric Paladin)
 *
 * @example
 * ```typescript
 * const presets = getPointBuyPresets();
 * // Warrior: STR 15, CON 14, DEX 12, ... (melee combatant)
 * // Wizard: INT 15, DEX 14, CON 12, ... (spellcaster)
 * const warrior = presets.warrior;
 * ```
 */
export function getPointBuyPresets(): Record<string, Attributes> {
  return {
    // Strong, tough fighter
    warrior: {
      str: 15,
      dex: 12,
      int: 10,
      con: 14,
      cha: 11,
    },

    // Intelligent spellcaster
    wizard: {
      str: 8,
      dex: 14,
      int: 15,
      con: 12,
      cha: 11,
    },

    // Dexterous, sneaky character
    rogue: {
      str: 12,
      dex: 15,
      int: 12,
      con: 11,
      cha: 13,
    },

    // Holy warrior with CHA
    paladin: {
      str: 15,
      dex: 11,
      int: 10,
      con: 13,
      cha: 14,
    },

    // Healing support character
    cleric: {
      str: 11,
      dex: 12,
      int: 10,
      con: 14,
      cha: 14,
    },

    // Balanced generalist
    balanced: {
      str: 12,
      dex: 12,
      int: 12,
      con: 12,
      cha: 13,
    },
  };
}

/**
 * Get cost breakdown for visualization
 *
 * Useful for showing users exactly how many points each attribute costs.
 *
 * @param attributes - Attributes to analyze
 * @returns Array of cost details for each attribute
 *
 * @example
 * ```typescript
 * const costs = getCostBreakdown({ str: 14, dex: 10, ... });
 * // Returns: [
 * //   { attr: 'str', value: 14, cost: 2 },
 * //   { attr: 'dex', value: 10, cost: 1 },
 * //   ...
 * // ]
 * ```
 */
export function getCostBreakdown(
  attributes: Attributes,
): Array<{ attr: string; value: number; cost: number }> {
  const breakdown: Array<{ attr: string; value: number; cost: number }> = [];

  for (const [attr, value] of Object.entries(attributes)) {
    const cost = POINT_BUY_COSTS[value] ?? 0;
    breakdown.push({ attr, value, cost });
  }

  return breakdown.sort((a, b) => b.cost - a.cost); // Highest cost first
}
