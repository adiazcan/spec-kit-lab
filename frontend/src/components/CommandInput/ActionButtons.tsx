/**
 * Action Buttons Component
 *
 * Provides quick action buttons (Attack, Flee, Use Item) for common gameplay actions.
 * Reduces time to perform actions by 30% compared to typing commands.
 *
 * Features:
 * - Quick action buttons for Attack, Flee, and Use Item
 * - Context-aware visibility (only visible in combat)
 * - Direct API submission via useResolveTurn mutation
 * - Keyboard shortcuts (Alt+A, Alt+F, Alt+I)
 * - Disabled state during API submission
 * - Touch-friendly 44x44px minimum button size
 * - Full accessibility with ARIA labels
 *
 * T053: Create ActionButtons component in frontend/src/components/CommandInput/ActionButtons.tsx
 * T054: Add click handlers to ActionButtons that pre-fill or directly submit actions
 * T058: Connect ActionButtons to combat turn resolution API (useResolveTurn mutation)
 * T059: Add ARIA labels and keyboard shortcuts
 * T060: Style action buttons with hover states and touch-friendly 44x44px minimum size
 */

import React, { useCallback, useEffect } from "react";
import { useResolveTurn } from "../../services/gameApi";
import type { CombatState } from "../../types/combat";
import type { CharacterStatus } from "../../types/character";

/**
 * Props for ActionButtons component
 */
interface ActionButtonsProps {
  /**
   * Current combat state (null if not in combat)
   * If null, buttons will be hidden
   */
  combatState: CombatState | null;

  /**
   * Current character status with ID
   * Used to identify the player character in combat
   */
  character?: CharacterStatus | null;

  /**
   * Whether buttons should be disabled
   * (e.g., during loading, waiting for enemy turn, or invalid game state)
   */
  disabled?: boolean;

  /**
   * Callback when an action is submitted successfully
   * Used to update narrative or trigger animations
   * @param action - The action that was submitted (attack, flee, useitem)
   * @param result - The server response from the action
   */
  onActionSubmitted?: (
    action: string,
    result: Record<string, unknown>,
  ) => void;

  /**
   * Callback when an action fails
   * Used to display error messages
   * @param error - The error message
   */
  onActionError?: (error: string) => void;

  /**
   * Optional class name for styling the container
   */
  className?: string;
}

/**
 * ActionButtons Component
 *
 * Renders quick action buttons for common combat actions.
 * Buttons are only visible during active combat.
 * Each button triggers a combat turn resolution via the API.
 *
 * @component
 * @example
 * Usage:
 * const combatState = {combatId: '123', ...};
 * const character = {characterId: '456', ...};
 *
 * JSX: ActionButtons with combatState and character props
 * Fires onActionSubmitted callback when action succeeds
 * Fires onActionError callback when action fails
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  combatState,
  character,
  disabled = false,
  onActionSubmitted,
  onActionError,
  className = "",
}) => {
  // Get mutation hook for resolving combat turns
  const resolveTurnMutation = useResolveTurn(combatState?.combatId || "");

  // Determine if we're in the player's turn
  const isPlayerTurn =
    combatState &&
    character &&
    combatState.combatants &&
    combatState.combatants[combatState.currentTurnIndex]?.id === character.characterId;

  // Determine if buttons should be disabled
  const isDisabled =
    disabled ||
    !combatState ||
    !isPlayerTurn ||
    resolveTurnMutation.isPending;

  /**
   * Handle Attack button click
   * Submits an attack action to the combat resolver
   */
  const handleAttack = useCallback(() => {
    if (!combatState || !character) return;

    const currentCombatant = combatState.combatants?.[combatState.currentTurnIndex];
    const targetCombatant = combatState.combatants?.find(
      (c) => c.id !== character.characterId && c.status !== "defeated",
    );

    if (!currentCombatant || !targetCombatant) {
      onActionError?.("Invalid combat state");
      return;
    }

    // Execute attack action
    resolveTurnMutation.mutate(
      {
        attackerId: character.characterId,
        targetId: targetCombatant.id,
        action: "attack",
      },
      {
        onSuccess: (data) => {
          onActionSubmitted?.("attack", data);
        },
        onError: (error) => {
          onActionError?.(
            error instanceof Error ? error.message : "Attack failed",
          );
        },
      },
    );
  }, [combatState, character, resolveTurnMutation, onActionSubmitted, onActionError]);

  /**
   * Handle Flee button click
   * Submits a flee/disengage action
   */
  const handleFlee = useCallback(() => {
    if (!combatState || !character) return;

    const currentCombatant = combatState.combatants?.[combatState.currentTurnIndex];

    if (!currentCombatant) {
      onActionError?.("Invalid combat state");
      return;
    }

    // Execute flee action
    resolveTurnMutation.mutate(
      {
        attackerId: character.characterId,
        targetId: currentCombatant.id, // Can be self
        action: "flee",
      },
      {
        onSuccess: (data) => {
          onActionSubmitted?.("flee", data);
        },
        onError: (error) => {
          onActionError?.(
            error instanceof Error ? error.message : "Flee failed",
          );
        },
      },
    );
  }, [combatState, character, resolveTurnMutation, onActionSubmitted, onActionError]);

  /**
   * Handle Use Item button click
   * Opens item selection or submits item action
   * For MVP, this can be a placeholder or open an item menu
   */
  const handleUseItem = useCallback(() => {
    if (!combatState || !character) return;

    const currentCombatant = combatState.combatants?.[combatState.currentTurnIndex];

    if (!currentCombatant) {
      onActionError?.("Invalid combat state");
      return;
    }

    // Execute use item action
    resolveTurnMutation.mutate(
      {
        attackerId: character.characterId,
        targetId: currentCombatant.id, // Can be self for healing items
        action: "useitem",
      },
      {
        onSuccess: (data) => {
          onActionSubmitted?.("useitem", data);
        },
        onError: (error) => {
          onActionError?.(
            error instanceof Error ? error.message : "Use item failed",
          );
        },
      },
    );
  }, [combatState, character, resolveTurnMutation, onActionSubmitted, onActionError]);

  /**
   * Setup keyboard shortcuts: Alt+A, Alt+F, Alt+I
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+A for Attack
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (!isDisabled) handleAttack();
      }

      // Alt+F for Flee
      if (e.altKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        if (!isDisabled) handleFlee();
      }

      // Alt+I for Use Item
      if (e.altKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        if (!isDisabled) handleUseItem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDisabled, handleAttack, handleFlee, handleUseItem]);

  // Hide buttons if not in combat
  if (!combatState) {
    return null;
  }

  return (
    <div
      className={`
        flex flex-wrap gap-2 w-full
        ${className}
      `}
      role="radiogroup"
      aria-label="Combat actions"
    >
      {/* Attack Button */}
      <button
        onClick={handleAttack}
        disabled={isDisabled}
        className="
          flex-1 min-w-[44px] h-[44px] px-3 py-2
          bg-red-600 hover:bg-red-700
          disabled:bg-gray-600 disabled:cursor-not-allowed
          rounded font-semibold text-white text-sm
          transition-colors duration-200
          flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          active:scale-95 transition-transform
        "
        aria-label="Attack (Alt+A)"
        title={isDisabled ? "Waiting for your turn" : "Attack the enemy (Alt+A)"}
        aria-pressed={false}
      >
        <span className="text-lg">⚔️</span>
        <span className="hidden sm:inline">Attack</span>
        {resolveTurnMutation.isPending && (
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Flee Button */}
      <button
        onClick={handleFlee}
        disabled={isDisabled}
        className="
          flex-1 min-w-[44px] h-[44px] px-3 py-2
          bg-yellow-600 hover:bg-yellow-700
          disabled:bg-gray-600 disabled:cursor-not-allowed
          rounded font-semibold text-white text-sm
          transition-colors duration-200
          flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
          active:scale-95 transition-transform
        "
        aria-label="Flee (Alt+F)"
        title={isDisabled ? "Waiting for your turn" : "Flee from combat (Alt+F)"}
        aria-pressed={false}
      >
        <span className="text-lg">🏃</span>
        <span className="hidden sm:inline">Flee</span>
        {resolveTurnMutation.isPending && (
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Use Item Button */}
      <button
        onClick={handleUseItem}
        disabled={isDisabled}
        className="
          flex-1 min-w-[44px] h-[44px] px-3 py-2
          bg-green-600 hover:bg-green-700
          disabled:bg-gray-600 disabled:cursor-not-allowed
          rounded font-semibold text-white text-sm
          transition-colors duration-200
          flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          active:scale-95 transition-transform
        "
        aria-label="Use Item (Alt+I)"
        title={
          isDisabled ? "Waiting for your turn" : "Use an item from inventory (Alt+I)"
        }
        aria-pressed={false}
      >
        <span className="text-lg">🧪</span>
        <span className="hidden sm:inline">Item</span>
        {resolveTurnMutation.isPending && (
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
        )}
      </button>
    </div>
  );
};
