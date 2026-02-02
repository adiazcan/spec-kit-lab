import React from "react";
import { SceneDescription } from "./SceneDescription";
import { NarrativeDisplay } from "./NarrativeDisplay";
import { CharacterStatusSidebar } from "../CharacterStatus/CharacterStatusSidebar";
import { DiceRollAnimation } from "../DiceRoll/DiceRollAnimation";
import { CombatOverlay } from "../CombatUI/CombatOverlay";
import type { SceneData, NarrativeMessage } from "../../types/narrative";
import type { DiceRollResult } from "../../types/game";
import type { CombatState } from "../../types/combat";
import type { CharacterStatus } from "../../types/character";

/**
 * Main game layout container component.
 * Displays the game interface with scene, story, and character status.
 *
 * Layout:
 * - Top: Scene description
 * - Middle/Left: Narrative display (scrollable text area)
 * - Right: Character status sidebar
 * - Overlay: Dice roll animation (when active)
 * - Combat: Combat UI overlay (when in combat)
 *
 * @component
 */
interface GameScreenProps {
  /** Current scene information */
  scene: SceneData | null;

  /** Accumulated narrative messages */
  messages: NarrativeMessage[];

  /** Active character status */
  character: CharacterStatus | null;

  /** Current combat state (null if not in combat) */
  combat: CombatState | null;

  /** Whether data is currently loading */
  isLoading: boolean;

  /** Loading/error messages */
  status?: string;

  /** Currently displayed dice roll (null if not rolling) */
  currentDiceRoll?: DiceRollResult | null;

  /** Callback when dice animation completes */
  onDiceRollComplete?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  scene,
  messages,
  character,
  combat,
  isLoading,
  status,
  currentDiceRoll,
  onDiceRollComplete,
}) => {
  const isCombatActive = combat?.status === "active";

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Scene Description - Top Section */}
      <div className="flex-shrink-0 border-b border-gray-700">
        {scene ? (
          <SceneDescription
            title={scene.title}
            description={scene.description}
          />
        ) : (
          <div className="p-6 text-gray-400">
            {status || "Loading scene..."}
          </div>
        )}
      </div>

      {/* Main Game Area - Story + Status */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Narrative Display + Combat UI */}
        <div className="flex-1 overflow-hidden border-r border-gray-700 relative flex flex-col">
          {/* Combat UI Overlay (visible only when combat is active) */}
          {isCombatActive && combat && (
            <div className="flex-shrink-0 p-4 border-b border-gray-700">
              <CombatOverlay combat={combat} />
            </div>
          )}

          {/* Narrative Display */}
          <div className="flex-1 overflow-hidden relative">
            <NarrativeDisplay isLoading={isLoading} messages={messages} />

            {/* Dice Roll Animation Overlay */}
            {currentDiceRoll && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                <DiceRollAnimation
                  roll={currentDiceRoll}
                  onAnimationComplete={onDiceRollComplete}
                  className="max-w-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Character Status Sidebar */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          {character ? (
            <CharacterStatusSidebar character={character} />
          ) : (
            <div className="p-4 text-gray-400">Loading character...</div>
          )}
        </div>
      </div>
    </div>
  );
};
