/**
 * Combat Formatting Utilities
 *
 * Utilities for formatting combat information for display:
 * - formatTurnInfo: Format current turn information
 * - calculateHpPercentage: Calculate HP as percentage for display
 * - formatCombatantStatus: Format combatant status for display
 */

import type { CombatState, Combatant, ActiveCondition } from "../types/combat";

/**
 * Format turn information for display in turn indicator
 *
 * @param combat - CombatState object
 * @returns Formatted string like "Round 2 - Aragorn's Turn" or "Round 1 - Goblin's Turn"
 */
export function formatTurnInfo(combat: CombatState): string {
  const currentCombatant = combat.combatants[combat.currentTurnIndex];

  if (!currentCombatant) {
    return `Round ${combat.round} - Unknown Turn`;
  }

  const turnType =
    currentCombatant.type === "player"
      ? "Your Turn"
      : `${currentCombatant.name}'s Turn`;
  return `Round ${combat.round} - ${turnType}`;
}

/**
 * Calculate HP percentage for progress bar display
 *
 * @param combatant - Combatant object
 * @returns HP percentage (0-100)
 *
 * Clamped to valid percentage range even if HP is invalid.
 */
export function calculateHpPercentage(combatant: Combatant): number {
  if (combatant.maxHp <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, (combatant.currentHp / combatant.maxHp) * 100),
  );
}

/**
 * Get color class for HP percentage
 *
 * @param percentage - HP percentage (0-100)
 * @returns Tailwind color class string
 *
 * Color gradient based on health:
 * - Green (>50%): healthy
 * - Yellow (25-50%): damaged
 * - Red (<25%): critical
 */
export function getHpColorClass(percentage: number): string {
  if (percentage > 50) {
    return "bg-green-500";
  }

  if (percentage > 25) {
    return "bg-yellow-500";
  }

  return "bg-red-500";
}

/**
 * Format HP display string
 *
 * @param combatant - Combatant object
 * @returns Formatted string like "25 / 30 HP" or "0 / 30 HP (Defeated)"
 */
export function formatHpDisplay(combatant: Combatant): string {
  const hp = `${combatant.currentHp} / ${combatant.maxHp}`;

  if (combatant.status === "defeated") {
    return `${hp} (Defeated)`;
  }

  if (combatant.status === "fled") {
    return `${hp} (Fled)`;
  }

  return hp;
}

/**
 * Format combatant status for display
 *
 * @param combatant - Combatant object
 * @returns Object with formatted properties for UI display
 */
export function formatCombatantStatus(combatant: Combatant) {
  const hpPercentage = calculateHpPercentage(combatant);

  return {
    ...combatant,
    hpPercentage,
    hpColorClass: getHpColorClass(hpPercentage),
    hpDisplay: formatHpDisplay(combatant),
    statusBadgeClass: getCombatantStatusClass(combatant.status),
  };
}

/**
 * Get CSS class for combatant status badge
 *
 * @param status - Combatant status
 * @returns Tailwind CSS class string
 */
export function getCombatantStatusClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-600 text-white";
    case "defeated":
      return "bg-red-600 text-white line-through";
    case "fled":
      return "bg-gray-600 text-white";
    default:
      return "bg-gray-700 text-white";
  }
}

/**
 * Format condition for display as badge
 *
 * @param condition - ActiveCondition object
 * @returns Formatted condition string with turn count
 *
 * Example: "Blessed (3 turns)" or "Poisoned (∞)"
 */
export function formatCondition(condition: ActiveCondition): string {
  if (condition.turnsRemaining === null) {
    return `${condition.name} (∞)`;
  }

  if (condition.turnsRemaining === 0) {
    return `${condition.name} (expired)`;
  }

  return `${condition.name} (${condition.turnsRemaining} turn${condition.turnsRemaining !== 1 ? "s" : ""})`;
}

/**
 * Get CSS class for condition type
 *
 * @param type - Condition type ("buff" | "debuff" | "neutral")
 * @returns Tailwind CSS class string
 */
export function getConditionClass(type: string): string {
  switch (type) {
    case "buff":
      return "bg-green-900 text-green-200 border border-green-700";
    case "debuff":
      return "bg-red-900 text-red-200 border border-red-700";
    case "neutral":
    default:
      return "bg-gray-700 text-gray-200 border border-gray-600";
  }
}

/**
 * Sort combatants by initiative for display
 *
 * @param combatants - Array of Combatant objects
 * @returns Sorted array (highest initiative first)
 */
export function sortByInitiative(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => b.initiative - a.initiative);
}

/**
 * Filter active combatants (exclude defeated/fled)
 *
 * @param combatants - Array of Combatant objects
 * @returns Array of active combatants only
 */
export function getActiveCombatants(combatants: Combatant[]): Combatant[] {
  return combatants.filter((c) => c.status === "active");
}

/**
 * Determine if a combatant is an enemy
 *
 * @param combatant - Combatant object
 * @returns true if combatant is an enemy, false otherwise
 */
export function isEnemy(combatant: Combatant): boolean {
  return combatant.type === "enemy";
}

/**
 * Format combatants for initiative order display
 *
 * @param combatants - Array of Combatant objects in initiative order
 * @param currentTurnIndex - Index of current turn
 * @returns Array of formatted combatants with display properties
 */
export function formatCombatantsForDisplay(
  combatants: Combatant[],
  currentTurnIndex: number,
) {
  return combatants.map((combatant, index) => ({
    ...formatCombatantStatus(combatant),
    isCurrentTurn: index === currentTurnIndex,
    initiativeRank: index + 1,
  }));
}
