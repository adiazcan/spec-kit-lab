/**
 * Attribute Modifier Calculator
 * Calculates D&D 5E modifiers from base attribute values
 * Formula: floor((value - 10) / 2)
 *
 * Pure functions for modifier calculation - easily testable, no side effects
 */

import {
  Attributes,
  AttributeKey,
  ATTRIBUTE_CONSTRAINTS,
} from "@/types/character";

/**
 * Calculate D&D 5E modifier from a single attribute value
 *
 * Formula: floor((attributeValue - 10) / 2)
 *
 * Examples:
 * - 3 → -4, 8 → -1, 10 → 0, 12 → 1, 14 → 2, 18 → 4
 *
 * @param attributeValue - Base attribute value (must be 3-18)
 * @returns Calculated modifier (-4 to +4)
 * @throws Error if value is outside valid range (3-18)
 *
 * @example
 * ```typescript
 * calculateModifier(10)  // Returns 0
 * calculateModifier(16)  // Returns 3
 * calculateModifier(8)   // Returns -1
 * ```
 */
export function calculateModifier(attributeValue: number): number {
  if (
    !Number.isInteger(attributeValue) ||
    attributeValue < ATTRIBUTE_CONSTRAINTS.MIN ||
    attributeValue > ATTRIBUTE_CONSTRAINTS.MAX
  ) {
    throw new Error(
      `Attribute value must be integer between ${ATTRIBUTE_CONSTRAINTS.MIN}-${ATTRIBUTE_CONSTRAINTS.MAX}, ` +
        `got: ${attributeValue}`,
    );
  }

  return Math.floor((attributeValue - 10) / 2);
}

/**
 * Calculate all modifiers for a character's attribute set
 *
 * Applies calculateModifier to each attribute in the input object.
 * Preserves the Key structure (str, dex, int, con, cha).
 *
 * @param attributes - Character attributes object with all 5 attributes
 * @returns Object with same keys containing calculated modifiers (-4 to +4 each)
 * @throws Error if any attribute is outside valid range
 *
 * @example
 * ```typescript
 * const attributes = { str: 10, dex: 14, int: 18, con: 12, cha: 9 };
 * calculateAllModifiers(attributes);
 * // Returns: { str: 0, dex: 2, int: 4, con: 1, cha: -1 }
 * ```
 */
export function calculateAllModifiers(
  attributes: Partial<Attributes>,
): Partial<Record<AttributeKey, number>> {
  const modifiers: Partial<Record<AttributeKey, number>> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      modifiers[key as AttributeKey] = calculateModifier(value as number);
    }
  }

  return modifiers;
}

/**
 * Format a calculated modifier for UI display with explicit sign
 *
 * Positive modifiers show as "+2", "+3", etc.
 * Zero shows as "+0" (not "0" or blank)
 * Negative modifiers show as "-1", "-2", etc.
 *
 * @param modifier - Calculated modifier (-4 to +4)
 * @returns Formatted string with leading sign ("±2")
 *
 * @example
 * ```typescript
 * formatModifier(2)   // Returns "+2"
 * formatModifier(0)   // Returns "+0"
 * formatModifier(-1)  // Returns "-1"
 * formatModifier(-4)  // Returns "-4"
 * ```
 */
export function formatModifier(modifier: number): string {
  if (modifier >= 0) {
    return `+${modifier}`;
  }
  return `${modifier}`;
}

/**
 * Lookup table for O(1) modifier calculations (optional optimization)
 * Pre-calculated results for all valid attribute values
 */
const MODIFIER_CACHE: Record<number, number> = {
  3: -4,
  4: -3,
  5: -3,
  6: -2,
  7: -2,
  8: -1,
  9: -1,
  10: 0,
  11: 0,
  12: 1,
  13: 1,
  14: 2,
  15: 2,
  16: 3,
  17: 3,
  18: 4,
};

/**
 * Fast modifier calculation using pre-computed cache
 * Useful for performance-critical sections where recalculation happens
 * frequently (e.g., form inputs updating 60+ times per second on drag)
 *
 * @param attributeValue - Attribute value (3-18)
 * @returns Cached modifier result (-4 to +4)
 * @throws Error if value not in cache (outside 3-18 range)
 *
 * @example
 * ```typescript
 * // In performance-critical form input handler:
 * calculateModifierFast(14)  // Returns 2 (cache lookup, no math)
 * ```
 */
export function calculateModifierFast(attributeValue: number): number {
  const modifier = MODIFIER_CACHE[attributeValue];
  if (modifier === undefined) {
    throw new Error(
      `Attribute ${attributeValue} not in cache (valid range 3-18)`,
    );
  }
  return modifier;
}

/**
 * Get all attribute names in order for iteration
 * Useful for building lists or grids of attributes
 *
 * @returns Array of attribute keys in canonical order
 *
 * @example
 * ```typescript
 * getAttributeKeys().forEach(attr => {
 *   console.log(`${attr}: ${character.attributes[attr]}`);
 * });
 * ```
 */
export function getAttributeKeys(): AttributeKey[] {
  return ["str", "dex", "int", "con", "cha"];
}

/**
 * Format complete character attribute/modifier display
 * Useful for summary displays or character previews
 *
 * @param attributes - Character attributes
 * @returns Formatted string like "STR 14 (+2), DEX 10 (+0), ..."
 *
 * @example
 * ```typescript
 * const attrs = { str: 14, dex: 10, int: 18, con: 12, cha: 9 };
 * formatAttributesSummary(attrs);
 * // Returns: "STR 14 (+2), DEX 10 (+0), INT 18 (+4), CON 12 (+1), CHA 9 (-1)"
 * ```
 */
export function formatAttributesSummary(attributes: Attributes): string {
  return getAttributeKeys()
    .map((attr) => {
      const value = attributes[attr];
      const modifier = calculateModifier(value);
      return `${attr.toUpperCase()} ${value} (${formatModifier(modifier)})`;
    })
    .join(", ");
}

/**
 * Get the highest modifier from a set of attributes
 * Useful for quick stat assessment in lists
 *
 * @param attributes - Character attributes
 * @returns Highest calculated modifier in the set
 *
 * @example
 * ```typescript
 * const attrs = { str: 10, dex: 8, int: 16, con: 12, cha: 14 };
 * getHighestModifier(attrs); // Returns 3 (from INT 16)
 * ```
 */
export function getHighestModifier(attributes: Attributes): number {
  let highest = -Infinity;
  getAttributeKeys().forEach((attr) => {
    const modifier = calculateModifier(attributes[attr]);
    if (modifier > highest) {
      highest = modifier;
    }
  });
  return highest;
}
