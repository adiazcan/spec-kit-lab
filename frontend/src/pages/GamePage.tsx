/**
 * Game Page - Main game interface container
 *
 * This page serves as the root component for the game screen.
 * It manages the layout with:
 * - Narrative display area (center-left)
 * - Character status sidebar (right)
 * - Command input area (bottom)
 * - Combat UI overlay (when combat active)
 * - Dice roll animations (when rolls occur)
 *
 * T013: Create base GamePage routing with route parameter for adventureId
 * T024: Connect GameScreen to useAdventure and useCharacter API hooks
 *
 * NOTE: Phase 3 implementation - Main game screen with real component rendering
 */

import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  useAdventure,
  useSubmitCommand,
  useCombat,
} from "../services/gameApi";
import { useGameState } from "../hooks/useGameState";
import { useGameplayDiceRoll } from "../hooks/useGameplayDiceRoll";
import { GameScreen } from "../components/GameScreen/GameScreen";
import { CommandInput } from "../components/CommandInput/CommandInput";
import { ActionButtons } from "../components/CommandInput/ActionButtons";
import type { SceneData } from "../types/narrative";
import type { CharacterStatus } from "../types/character";

/**
 * GamePage component - Main game interface entry point
 *
 * Features:
 * - Loads adventure state and character data from backend using React Query
 * - Initializes game state with session storage persistence
 * - Displays loading states and errors
 * - Manages combat UI visibility
 * - Transforms API responses into component-compatible types
 * - Integrates CommandInput component for player command submission
 * - Handles command submission via useSubmitCommand mutation
 * - Generates narrative messages from command results
 *
 * Route: /game/:adventureId
 */
export default function GamePage() {
  const { adventureId } = useParams<{ adventureId: string }>();
  const navigate = useNavigate();

  // Validate adventureId
  if (!adventureId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Invalid</h1>
          <p className="text-gray-600 mb-4">No adventure ID provided</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fetch adventure state (gets character ID from adventure)
  const adventureQuery = useAdventure(adventureId);

  // Fetch combat state if in combat (use null for now as combatId comes from adventure state)
  // TODO: Extract combatId from adventureQuery.data when available
  const combatQuery = useCombat(null);

  // Game state management (narrative messages, UI state)
  const gameState = useGameState(adventureId);

  // Dice roll display management
  const diceRoll = useGameplayDiceRoll();

  // Command submission mutation hook
  const submitCommandMutation = useSubmitCommand(adventureId);

  // Update loading state based on queries
  useEffect(() => {
    const isLoading = adventureQuery.isLoading;
    gameState.setLoading(isLoading);
  }, [adventureQuery.isLoading, gameState]);

  // Handle errors
  useEffect(() => {
    if (adventureQuery.error) {
      gameState.setError(
        adventureQuery.error instanceof Error
          ? adventureQuery.error.message
          : "Failed to load adventure",
      );
    } else {
      gameState.setError(null);
    }
  }, [adventureQuery.error, gameState]);

  // Enable input once data is loaded and no submission in progress
  useEffect(() => {
    const isLoaded = adventureQuery.data;
    gameState.setInputEnabled(!!isLoaded && !submitCommandMutation.isPending);
  }, [adventureQuery.data, submitCommandMutation.isPending, gameState]);

  /**
   * Handle command submission from CommandInput component
   *
   * T031: Connect CommandInput to game action submission API
   * T033: Add disabled state to CommandInput during API submission
   * T034: Generate narrative messages from command submission results
   */
  const handleCommandSubmit = async (command: string) => {
    try {
      // Add player command to narrative immediately
      gameState.addNarrativeMessage({
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type: "action",
        content: `> ${command}`,
      });

      // Submit command to API
      const result = await submitCommandMutation.mutateAsync(command);

      // Handle success response
      if (result.success) {
        // Add game response message to narrative
        gameState.addNarrativeMessage({
          id: `msg-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: "narration",
          content: result.message,
        });

        // If there are narrative messages in the response, add them
        if (
          result.narrativeMessages &&
          Array.isArray(result.narrativeMessages)
        ) {
          result.narrativeMessages.forEach((msg) => {
            gameState.addNarrativeMessage({
              id: msg.id || `msg-${Date.now()}-${Math.random()}`,
              timestamp: new Date(msg.timestamp),
              type: (msg.type as any) || "narration",
              content: msg.content,
              metadata: (msg as any).metadata,
            });
          });
        }
      } else {
        // Add error message to narrative
        gameState.addNarrativeMessage({
          id: `msg-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          type: "system",
          content: result.message || "Command could not be executed.",
        });
      }
    } catch (error) {
      // Add error message to narrative
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit command";
      gameState.addNarrativeMessage({
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type: "system",
        content: `Error: ${errorMessage}`,
      });
    }
  };

  // Transform API response to SceneData type
  const sceneData: SceneData | null = adventureQuery.data
    ? {
        sceneId: adventureQuery.data.currentSceneId || "unknown",
        title: "Adventure Scene",
        description:
          adventureQuery.data.currentSceneId ||
          "You stand at the beginning of an adventure. The world awaits your exploration.",
        availableActions: [],
      }
    : null;

  // For now, provide placeholder character data
  // In Phase 4+, this will be fetched from the character API
  const characterStatus: CharacterStatus | null = adventureQuery.data
    ? {
        characterId: adventureId,
        name: "You",
        currentHp: 10,
        maxHp: 10,
        equipment: [],
        conditions: [],
        attributes: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
      }
    : null;

  // Loading state
  if (gameState.uiState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
          </div>
          <p className="mt-4 text-gray-300">Loading adventure...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (gameState.uiState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{gameState.uiState.error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main game screen with GameScreen component
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Game Screen - Main Content Area */}
      <GameScreen
        scene={sceneData}
        messages={gameState.narrativeMessages}
        character={characterStatus}
        isLoading={gameState.uiState.isLoading}
        status={gameState.uiState.error || undefined}
        currentDiceRoll={diceRoll.currentRoll}
        onDiceRollComplete={diceRoll.clearRoll}
      />

      {/* Command Input Area - Bottom */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800 p-4">
        {/* Quick Action Buttons (only visible in combat) */}
        <div className="mb-3">
          <ActionButtons
            combatState={combatQuery.data || null}
            character={characterStatus}
            disabled={!gameState.uiState.inputEnabled}
            onActionSubmitted={(action, result) => {
              // Add action result to narrative
              gameState.addNarrativeMessage({
                id: `msg-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                type: "combat",
                content: `Performed action: ${action}`,
                metadata: { combatAction: result as any },
              });
            }}
            onActionError={(error) => {
              // Add error message to narrative
              gameState.addNarrativeMessage({
                id: `msg-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                type: "system",
                content: `Action failed: ${error}`,
              });
            }}
          />
        </div>

        {/* Command Input */}
        <CommandInput
          onSubmit={handleCommandSubmit}
          disabled={!gameState.uiState.inputEnabled}
        />
      </div>

      {/* Exit Button */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800 px-4 py-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold text-white transition-colors text-sm"
        >
          Exit to Dashboard
        </button>
      </div>
    </div>
  );
}
