/**
 * Combat System Types for Main Game Interface
 *
 * This file contains types specific to combat encounters, combatants,
 * turn order, and combat state management.
 *
 * @fileoverview Combat-specific data structures
 */

import type { DiceRollResult } from "./game";

/**
 * Equipped item summary for display.
 */
export interface EquippedItem {
  /** Item name */
  name: string;

  /** Equipment slot */
  slot: "mainHand" | "offHand" | "armor" | "accessory";

  /** Item stat impact (e.g., "+5 damage", "AC 12") */
  statImpact: string;

  /** Optional item icon/emoji */
  icon?: string;
}

/**
 * Active status condition.
 */
export interface ActiveCondition {
  /** Condition name (e.g., "Blessed", "Poisoned") */
  name: string;

  /** Turns remaining (null if permanent) */
  turnsRemaining: number | null;

  /** Condition type affects display color */
  type: "buff" | "debuff" | "neutral";

  /** Optional condition icon/emoji */
  icon?: string;
}

/**
 * Combat state for UI display.
 * Retrieved from Combat API (/api/Combats/{id}).
 */
export interface CombatState {
  /** Combat encounter ID */
  combatId: string;

  /** Current round number (1-indexed) */
  round: number;

  /** All combatants in initiative order */
  combatants: Combatant[];

  /** Index of currently active combatant */
  currentTurnIndex: number;

  /** Combat status */
  status: "active" | "victory" | "defeat" | "fled";

  /** Combat history/log */
  history: CombatLogEntry[];
}

/**
 * Individual combatant in combat.
 */
export interface Combatant {
  /** Combatant unique ID */
  id: string;

  /** Combatant name */
  name: string;

  /** Combatant type */
  type: "player" | "enemy" | "ally";

  /** Initiative roll result */
  initiative: number;

  /** Current hit points */
  currentHp: number;

  /** Maximum hit points */
  maxHp: number;

  /** Armor class */
  armorClass: number;

  /** Combatant status */
  status: "active" | "defeated" | "fled";

  /** Active conditions */
  conditions: ActiveCondition[];
}

/**
 * Combat log entry for history display.
 */
export interface CombatLogEntry {
  /** Log entry ID */
  id: string;

  /** Combat round number */
  round: number;

  /** Log message */
  message: string;

  /** Entry timestamp */
  timestamp: Date;

  /** Associated dice roll if any */
  diceRoll?: DiceRollResult;
}

/**
 * Request payload for resolving a player's combat turn.
 */
export interface ResolveTurnRequest {
  /** Player character ID */
  attackerId: string;

  /** Target combatant ID */
  targetId: string;

  /** Action type */
  action: "attack" | "flee" | "defend";
}

/**
 * Combat action result from turn resolution.
 */
export interface CombatActionResult {
  /** Attack roll details */
  attackRoll?: DiceRollResult;

  /** Whether the attack hit */
  hit?: boolean;

  /** Damage roll details */
  damageRoll?: DiceRollResult;

  /** Actual damage dealt */
  damageDealt?: number;

  /** Whether target was defeated */
  targetDefeated?: boolean;

  /** Result message for narrative */
  message: string;
}

/**
 * Response from combat turn resolution API.
 */
export interface CombatTurnResponse extends CombatState {
  /** Action result details */
  actionResult: CombatActionResult;
}
