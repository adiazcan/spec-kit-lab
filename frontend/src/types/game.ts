/**
 * Game State Types for Main Game Interface
 *
 * This file contains the core game state types and interfaces used throughout
 * the main game UI components. These types define the structure of data
 * managed by the game state and passed between components.
 *
 * @fileoverview Core game state data structures
 */

import type { SceneData } from "./narrative";
import type { CharacterStatus } from "./character";
import type { CombatState } from "./combat";
import type { NarrativeMessage } from "./narrative";

/**
 * Complete game state including scene, character, combat, and UI state.
 * This is the root state container for the game screen.
 */
export interface GameState {
  /** Current adventure ID */
  adventureId: string;

  /** Currently loaded scene information */
  currentScene: SceneData | null;

  /** Active character in the adventure */
  character: CharacterStatus | null;

  /** Active combat encounter (null if not in combat) */
  combat: CombatState | null;

  /** Accumulated narrative messages for display */
  narrative: NarrativeMessage[];

  /** UI state (loading, input disabled, etc.) */
  uiState: UIState;
}

/**
 * UI state management for game screen.
 */
export interface UIState {
  /** Global loading state */
  isLoading: boolean;

  /** Input enabled/disabled state */
  inputEnabled: boolean;

  /** Current error message (null if no error) */
  error: string | null;

  /** Combat UI visibility */
  combatUIVisible: boolean;

  /** Sidebar collapsed state (mobile only) */
  sidebarCollapsed: boolean;

  /** Active dice animation */
  activeDiceRoll: DiceRollResult | null;

  /** Quick action buttons visible */
  quickActionsVisible: boolean;
}

/**
 * Dice roll result with animation metadata.
 */
export interface DiceRollResult {
  /** Roll type identifier */
  rollType: "attack" | "damage" | "initiative" | "ability" | "generic";

  /** Dice notation (e.g., "2d6+3", "1d20") */
  notation: string;

  /** Base roll result (before modifiers) */
  baseRoll: number;

  /** Applied modifiers */
  modifiers: number;

  /** Final total result */
  total: number;

  /** Individual die results (for multi-die rolls) */
  diceResults?: number[];

  /** Roll context (e.g., "Attack vs Goblin") */
  context?: string;

  /** Critical success/failure indicator */
  critical?: "success" | "failure" | null;
}

/**
 * Command input state for text input component.
 */
export interface CommandInputState {
  /** Current input text */
  currentInput: string;

  /** Command history (last 50 commands) */
  history: string[];

  /** History navigation index (-1 = current input, 0+ = history) */
  historyIndex: number;

  /** Saved current input (when navigating history) */
  savedInput: string;

  /** Input validation error (null if valid) */
  validationError: string | null;

  /** Loading state (disables input during API call) */
  isSubmitting: boolean;
}

/**
 * Session storage schema for persistence across refreshes.
 */
export interface GameSessionStorage {
  /** Current adventure ID */
  adventureId: string;

  /** Narrative messages (last 100) */
  narrativeMessages: NarrativeMessage[];

  /** Command history */
  commandHistory: string[];

  /** Timestamp of last save */
  lastSaved: string;
}

/**
 * Standard API error response structure.
 */
export interface APIError {
  /** HTTP status code */
  status: number;

  /** Error title */
  title: string;

  /** Detailed error message */
  detail: string;

  /** Error code for programmatic handling */
  code?: string;
}
