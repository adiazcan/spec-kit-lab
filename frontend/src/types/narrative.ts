/**
 * Narrative and Scene Types for Main Game Interface
 *
 * This file contains types related to narrative messages, scene descriptions,
 * and the story/text display components of the game.
 *
 * @fileoverview Narrative and scene data structures
 */

import type { DiceRollResult } from "./game";

/**
 * Current scene information including description and available actions.
 * Fetched from backend via Adventure API.
 */
export interface SceneData {
  /** Unique scene identifier */
  sceneId: string;

  /** Scene title (e.g., "Dark Cavern Entrance") */
  title: string;

  /** Rich text description of the scene */
  description: string;

  /** Available player choices/actions */
  availableActions: string[];

  /** Scene metadata (type, tags, etc.) */
  metadata?: {
    type: "exploration" | "combat" | "dialogue" | "puzzle";
    tags: string[];
  };
}

/**
 * Single narrative message entry.
 * Messages are accumulated in chronological order.
 */
export interface NarrativeMessage {
  /** Unique message ID (generated client-side) */
  id: string;

  /** Message timestamp */
  timestamp: Date;

  /** Message type determines formatting and icon */
  type: NarrativeMessageType;

  /** Message text content */
  content: string;

  /** Optional metadata (dice roll details, combat info, etc.) */
  metadata?: NarrativeMetadata;
}

/**
 * Message type classification.
 */
export type NarrativeMessageType =
  | "scene" // Scene description or transition
  | "narration" // Ambient story text
  | "action" // Player action result
  | "combat" // Combat log entry
  | "system" // System message (save, error, etc.)
  | "dialogue"; // NPC dialogue

/**
 * Optional metadata for rich message display.
 */
export interface NarrativeMetadata {
  /** Dice roll details if applicable */
  diceRoll?: DiceRollResult;

  /** Combat action details if applicable */
  combatAction?: {
    attacker: string;
    target: string;
    damage?: number;
    hit: boolean;
  };

  /** Associated character/NPC name */
  speaker?: string;
}
