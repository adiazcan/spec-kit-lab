import { useMemo } from "react";
import type { CombatState, Combatant } from "../types/combat";

/**
 * Custom hook for managing combat state and derived values.
 * Provides helper functions and computed properties for combat UI.
 *
 * @param combat - Current combat state
 * @returns Combat state helpers and computed values
 *
 * @example
 * ```tsx
 * const {
 *   currentCombatant,
 *   isPlayerTurn,
 *   activeCombatants,
 *   defeatedCombatants
 * } = useCombatState(combat);
 * ```
 */
export function useCombatState(combat: CombatState | null) {
  /**
   * Get the currently active combatant.
   */
  const currentCombatant = useMemo<Combatant | null>(() => {
    if (!combat || !combat.combatants.length) return null;
    return combat.combatants[combat.currentTurnIndex] || null;
  }, [combat]);

  /**
   * Check if it's currently the player's turn.
   */
  const isPlayerTurn = useMemo<boolean>(() => {
    return currentCombatant?.type === "player";
  }, [currentCombatant]);

  /**
   * Get list of active (non-defeated) combatants.
   */
  const activeCombatants = useMemo<Combatant[]>(() => {
    if (!combat) return [];
    return combat.combatants.filter((c: Combatant) => c.status === "active");
  }, [combat]);

  /**
   * Get list of defeated combatants.
   */
  const defeatedCombatants = useMemo<Combatant[]>(() => {
    if (!combat) return [];
    return combat.combatants.filter((c: Combatant) => c.status === "defeated");
  }, [combat]);

  /**
   * Check if combat is currently active.
   */
  const isCombatActive = useMemo<boolean>(() => {
    return combat?.status === "active";
  }, [combat]);

  /**
   * Get the player combatant.
   */
  const playerCombatant = useMemo<Combatant | null>(() => {
    if (!combat) return null;
    return (
      combat.combatants.find((c: Combatant) => c.type === "player") || null
    );
  }, [combat]);

  /**
   * Get all enemy combatants.
   */
  const enemyCombatants = useMemo<Combatant[]>(() => {
    if (!combat) return [];
    return combat.combatants.filter((c: Combatant) => c.type === "enemy");
  }, [combat]);

  /**
   * Get the next combatant in turn order.
   */
  const nextCombatant = useMemo<Combatant | null>(() => {
    if (!combat || !combat.combatants.length) return null;
    const nextIndex = (combat.currentTurnIndex + 1) % combat.combatants.length;
    return combat.combatants[nextIndex] || null;
  }, [combat]);

  /**
   * Calculate turn progress percentage (for progress bar if needed).
   */
  const turnProgress = useMemo<number>(() => {
    if (!combat || !combat.combatants.length) return 0;
    return ((combat.currentTurnIndex + 1) / combat.combatants.length) * 100;
  }, [combat]);

  return {
    // Core state
    combat,
    currentCombatant,
    isPlayerTurn,
    isCombatActive,

    // Combatant lists
    activeCombatants,
    defeatedCombatants,
    playerCombatant,
    enemyCombatants,

    // Navigation
    nextCombatant,
    turnProgress,
  };
}

export default useCombatState;
