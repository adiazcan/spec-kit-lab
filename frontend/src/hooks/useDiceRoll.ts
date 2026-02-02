/**
 * useDiceRoll Hook
 * Manages dice rolling state for character creation
 *
 * Handles:
 * - Rolling dice for individual attributes
 * - Tracking rolled attributes
 * - Animation state for roll feedback
 * - Re-rolling individual or all attributes
 */

import { useState, useCallback } from "react";
import { DiceRoll } from "@/types/character";
import { roll4d6DropLowest } from "@/services/diceRoller";

/**
 * Return type for useDiceRoll hook
 */
export interface UseDiceRollReturn {
  // Current roll state
  currentRoll: DiceRoll | null;

  // Rolled values for each attribute (index -> value)
  rolledValues: Record<string, number>;

  // Attribute indices that have been rolled
  rolledAttributes: Set<string>;

  // Animation state
  isRolling: boolean;
  rollAnimationTime: number;

  // Methods
  rollAttribute: (attributeName: string) => Promise<void>;
  rollAllAttributes: (attributeNames: string[]) => Promise<void>;
  rerollAttribute: (attributeName: string) => Promise<void>;
  getRolledValue: (attributeName: string) => number | undefined;
  hasRolled: (attributeName: string) => boolean;
  resetRolls: () => void;
}

/**
 * Hook for managing dice rolls during character creation
 *
 * Supports rolling individual attributes or all at once.
 * Provides animation timing for visual feedback.
 * Tracks which attributes have been rolled.
 *
 * @param animationTime - Delay in ms for roll animation (default 600ms)
 * @returns Dice roll state and methods
 *
 * @example
 * ```typescript
 * const dice = useDiceRoll();
 *
 * // Roll a single attribute
 * const handleRollStr = async () => {
 *   await dice.rollAttribute('str');
 *   // dice.currentRoll has the result
 *   // dice.rolledValues.str has the final value
 * };
 *
 * // Roll all attributes at once
 * const handleRollAll = async () => {
 *   await dice.rollAllAttributes(['str', 'dex', 'int', 'con', 'cha']);
 *   // All values now in dice.rolledValues
 * };
 * ```
 */
export function useDiceRoll(animationTime: number = 600): UseDiceRollReturn {
  // ============ State ============

  /** Current roll object (for displaying animation) */
  const [currentRoll, setCurrentRoll] = useState<DiceRoll | null>(null);

  /** Map of attribute name -> rolled value (3-18) */
  const [rolledValues, setRolledValues] = useState<Record<string, number>>({});

  /** Set of attributes that have been rolled */
  const [rolledAttributes, setRolledAttributes] = useState<Set<string>>(
    new Set(),
  );

  /** Whether currently animating a roll */
  const [isRolling, setIsRolling] = useState(false);

  // ============ Methods ============

  /**
   * Roll a single attribute
   * Shows animation, then stores the result
   *
   * @param attributeName - Name of attribute to roll (e.g., 'str', 'dex')
   * @example
   * ```typescript
   * await dice.rollAttribute('str');
   * console.log(dice.rolledValues.str); // 3-18
   * ```
   */
  const rollAttribute = useCallback(
    async (attributeName: string): Promise<void> => {
      setIsRolling(true);

      // Perform the dice roll
      const roll = roll4d6DropLowest();
      setCurrentRoll(roll);

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, animationTime));

      // Store the rolled value
      setRolledValues((prev) => ({
        ...prev,
        [attributeName]: roll.sum,
      }));

      // Mark attribute as rolled
      setRolledAttributes((prev) => new Set(prev).add(attributeName));

      // Animation complete
      setIsRolling(false);
    },
    [animationTime],
  );

  /**
   * Roll all attributes in sequence
   *
   * @param attributeNames - Array of attribute names to roll
   * @example
   * ```typescript
   * await dice.rollAllAttributes(['str', 'dex', 'int', 'con', 'cha']);
   * ```
   */
  const rollAllAttributes = useCallback(
    async (attributeNames: string[]): Promise<void> => {
      // Roll each attribute sequentially
      for (const attrName of attributeNames) {
        // Check if  already rolled (skip if re-rolling)
        if (!rolledAttributes.has(attrName)) {
          await rollAttribute(attrName);
        }
      }
    },
    [rollAttribute, rolledAttributes],
  );

  /**
   * Re-roll a specific attribute (overwrites previous roll)
   *
   * @param attributeName - Attribute to re-roll
   * @example
   * ```typescript
   * // User doesn't like their STR roll
   * await dice.rerollAttribute('str');
   * // New value now in dice.rolledValues.str
   * ```
   */
  const rerollAttribute = useCallback(
    async (attributeName: string): Promise<void> => {
      await rollAttribute(attributeName);
    },
    [rollAttribute],
  );

  /**
   * Get the rolled value for an attribute
   *
   * @param attributeName - Attribute to look up
   * @returns Rolled value (3-18) or undefined if not rolled yet
   */
  const getRolledValue = useCallback(
    (attributeName: string): number | undefined => {
      return rolledValues[attributeName];
    },
    [rolledValues],
  );

  /**
   * Check if an attribute has been rolled
   *
   * @param attributeName - Attribute to check
   * @returns true if attribute has been rolled
   */
  const hasRolled = useCallback(
    (attributeName: string): boolean => {
      return rolledAttributes.has(attributeName);
    },
    [rolledAttributes],
  );

  /**
   * Reset all rolls to empty state
   * Used when user wants to start over or switch allocation methods
   */
  const resetRolls = useCallback((): void => {
    setCurrentRoll(null);
    setRolledValues({});
    setRolledAttributes(new Set());
    setIsRolling(false);
  }, []);

  // ============ Return ============
  return {
    currentRoll,
    rolledValues,
    rolledAttributes,
    isRolling,
    rollAnimationTime: animationTime,
    rollAttribute,
    rollAllAttributes,
    rerollAttribute,
    getRolledValue,
    hasRolled,
    resetRolls,
  };
}
