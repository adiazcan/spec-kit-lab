/**
 * Game State Management Hook
 *
 * Custom React hook for managing game state with session storage persistence.
 * Handles narrative messages, scene, character, combat state, and UI state.
 */

import { useState, useEffect, useCallback } from "react";
import type { NarrativeMessage } from "../types/narrative";
import type { UIState } from "../types/game";

const SESSION_STORAGE_KEY = "game-state";
const MAX_NARRATIVE_MESSAGES = 1000;

/**
 * Game session storage schema for persistence
 */
interface GameSessionData {
  adventureId: string;
  narrativeMessages: NarrativeMessage[];
  commandHistory: string[];
  lastSaved: string;
}

/**
 * Custom hook for managing game state with session persistence
 *
 * @param adventureId - Current adventure ID
 * @returns Object with game state, setters, and persistence methods
 *
 * Features:
 * - Loads narrative messages from session storage on init
 * - Saves narrative messages to session storage on change
 * - Limits in-memory narrative to MAX_NARRATIVE_MESSAGES (1000)
 * - Archives older messages to session storage
 * - Provides methods to add/clear messages
 */
export function useGameState(adventureId: string) {
  const [narrativeMessages, setNarrativeMessages] = useState<
    NarrativeMessage[]
  >([]);
  const [uiState, setUiState] = useState<UIState>({
    isLoading: true,
    inputEnabled: false,
    error: null,
    combatUIVisible: false,
    sidebarCollapsed: false,
    activeDiceRoll: null,
    quickActionsVisible: true,
  });

  // Load narrative messages from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (stored) {
      try {
        const data: GameSessionData = JSON.parse(stored);

        // Only restore if adventure ID matches
        if (data.adventureId === adventureId) {
          setNarrativeMessages(
            data.narrativeMessages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })) || [],
          );
        }
      } catch (error) {
        console.error(
          "Failed to restore game state from session storage:",
          error,
        );
      }
    }

    // Signal that initial load is complete
    setUiState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  }, [adventureId]);

  /**
   * Save current state to session storage
   */
  const saveStateToSession = useCallback(() => {
    try {
      const sessionData: GameSessionData = {
        adventureId,
        narrativeMessages,
        commandHistory: [],
        lastSaved: new Date().toISOString(),
      };

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error("Failed to save game state to session storage:", error);
    }
  }, [adventureId, narrativeMessages]);

  // Auto-save to session storage when messages change
  useEffect(() => {
    saveStateToSession();
  }, [narrativeMessages, saveStateToSession]);

  /**
   * Add a single narrative message
   *
   * @param message - NarrativeMessage to add
   *
   * Automatically enforces MAX_NARRATIVE_MESSAGES limit.
   */
  const addNarrativeMessage = useCallback((message: NarrativeMessage) => {
    setNarrativeMessages((prev) => {
      const updated = [...prev, message];

      // Enforce max message limit
      if (updated.length > MAX_NARRATIVE_MESSAGES) {
        // Keep only the last MAX_NARRATIVE_MESSAGES
        return updated.slice(updated.length - MAX_NARRATIVE_MESSAGES);
      }

      return updated;
    });
  }, []);

  /**
   * Add multiple narrative messages
   *
   * @param messages - Array of NarrativeMessage objects
   */
  const addNarrativeMessages = useCallback((messages: NarrativeMessage[]) => {
    setNarrativeMessages((prev) => {
      const updated = [...prev, ...messages];

      // Enforce max message limit
      if (updated.length > MAX_NARRATIVE_MESSAGES) {
        return updated.slice(updated.length - MAX_NARRATIVE_MESSAGES);
      }

      return updated;
    });
  }, []);

  /**
   * Clear all narrative messages
   */
  const clearNarrativeMessages = useCallback(() => {
    setNarrativeMessages([]);
  }, []);

  /**
   * Update UI state (loading, error, input enabled, etc.)
   *
   * @param partial - Partial UIState update
   */
  const updateUiState = useCallback((partial: Partial<UIState>) => {
    setUiState((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  /**
   * Set loading state
   *
   * @param loading - true if loading, false if complete
   */
  const setLoading = useCallback((loading: boolean) => {
    setUiState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  /**
   * Set input enabled state
   *
   * @param enabled - true if input should be enabled, false if disabled
   */
  const setInputEnabled = useCallback((enabled: boolean) => {
    setUiState((prev) => ({
      ...prev,
      inputEnabled: enabled,
    }));
  }, []);

  /**
   * Set error message
   *
   * @param error - Error message string or null
   */
  const setError = useCallback((error: string | null) => {
    setUiState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  /**
   * Set combat UI visibility
   *
   * @param visible - true if combat UI should be visible
   */
  const setCombatUIVisible = useCallback((visible: boolean) => {
    setUiState((prev) => ({
      ...prev,
      combatUIVisible: visible,
    }));
  }, []);

  /**
   * Set active dice roll for animation
   *
   * @param diceRoll - DiceRollResult or null
   */
  const setActiveDiceRoll = useCallback((diceRoll: any) => {
    setUiState((prev) => ({
      ...prev,
      activeDiceRoll: diceRoll,
    }));
  }, []);

  /**
   * Reset all state (for new adventure or logout)
   */
  const resetState = useCallback(() => {
    clearNarrativeMessages();
    setUiState({
      isLoading: true,
      inputEnabled: false,
      error: null,
      combatUIVisible: false,
      sidebarCollapsed: false,
      activeDiceRoll: null,
      quickActionsVisible: true,
    });
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, [clearNarrativeMessages]);

  return {
    // State
    narrativeMessages,
    uiState,

    // Narrative methods
    addNarrativeMessage,
    addNarrativeMessages,
    clearNarrativeMessages,

    // UI state methods
    updateUiState,
    setLoading,
    setInputEnabled,
    setError,
    setCombatUIVisible,
    setActiveDiceRoll,

    // Session methods
    saveStateToSession,
    resetState,
  };
}
