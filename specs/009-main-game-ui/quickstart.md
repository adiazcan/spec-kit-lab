# Quickstart Guide: Main Game Interface

**Feature**: 009-main-game-ui  
**Date**: 2026-02-02  
**Status**: ✅ Complete

---

## Overview

This guide provides step-by-step instructions for implementing the main game interface UI components. Follow these steps in order to build a functional text adventure game screen.

---

## Prerequisites

- ✅ Frontend initialized with React 18.3, TypeScript 5.9, Vite 5.4
- ✅ TanStack React Query v5 installed and configured
- ✅ Tailwind CSS v4.1 configured
- ✅ OpenAPI types generated (`npm run generate:api`)
- ✅ Backend APIs available (Adventures, Characters, Combat)

---

## Implementation Steps

### Step 1: Setup Type Definitions

**File**: `frontend/src/types/game.ts`

```typescript
/**
 * Game-specific types that extend or compose generated API types.
 */
import type { AdventureDto, CharacterDto, CombatStateResponse } from "./api";

export interface GameState {
  adventureId: string;
  currentScene: SceneData | null;
  character: CharacterStatus | null;
  combat: CombatState | null;
  narrative: NarrativeMessage[];
  uiState: UIState;
}

export interface SceneData {
  sceneId: string;
  title: string;
  description: string;
  availableActions: string[];
  metadata?: {
    type: "exploration" | "combat" | "dialogue" | "puzzle";
    tags: string[];
  };
}

export interface NarrativeMessage {
  id: string;
  timestamp: Date;
  type: "scene" | "narration" | "action" | "combat" | "system" | "dialogue";
  content: string;
  metadata?: {
    diceRoll?: DiceRollResult;
    combatAction?: {
      attacker: string;
      target: string;
      damage?: number;
      hit: boolean;
    };
    speaker?: string;
  };
}

export interface DiceRollResult {
  rollType: "attack" | "damage" | "initiative" | "ability" | "generic";
  notation: string;
  baseRoll: number;
  modifiers: number;
  total: number;
  diceResults?: number[];
  context?: string;
  critical?: "success" | "failure" | null;
}

export interface CharacterStatus {
  characterId: string;
  name: string;
  currentHp: number;
  maxHp: number;
  equipment: EquippedItem[];
  conditions: ActiveCondition[];
  attributes?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

export interface EquippedItem {
  name: string;
  slot: "mainHand" | "offHand" | "armor" | "accessory";
  statImpact: string;
  icon?: string;
}

export interface ActiveCondition {
  name: string;
  turnsRemaining: number | null;
  type: "buff" | "debuff" | "neutral";
  icon?: string;
}

export interface CombatState {
  combatId: string;
  round: number;
  combatants: Combatant[];
  currentTurnIndex: number;
  status: "active" | "victory" | "defeat" | "fled";
  history: CombatLogEntry[];
}

export interface Combatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  status: "active" | "defeated" | "fled";
  conditions: ActiveCondition[];
}

export interface CombatLogEntry {
  id: string;
  round: number;
  message: string;
  timestamp: Date;
  diceRoll?: DiceRollResult;
}

export interface UIState {
  isLoading: boolean;
  inputEnabled: boolean;
  error: string | null;
  combatUIVisible: boolean;
  sidebarCollapsed: boolean;
  activeDiceRoll: DiceRollResult | null;
  quickActionsVisible: boolean;
}

export interface CommandInputState {
  currentInput: string;
  history: string[];
  historyIndex: number;
  savedInput: string;
  validationError: string | null;
  isSubmitting: boolean;
}
```

---

### Step 2: Create API Service Hooks

**File**: `frontend/src/services/gameApi.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AdventureDto,
  CharacterDto,
  CombatStateResponse,
} from "../types/api";

const API_BASE = "/api";

// Query key factories
export const queryKeys = {
  adventure: (adventureId: string) => ["adventure", adventureId] as const,
  character: (characterId: string) => ["character", characterId] as const,
  combat: (combatId: string) => ["combat", combatId] as const,
};

/**
 * Fetch adventure state
 */
export function useAdventure(adventureId: string) {
  return useQuery({
    queryKey: queryKeys.adventure(adventureId),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/Adventures/${adventureId}`);
      if (!response.ok) throw new Error("Failed to fetch adventure");
      return response.json() as Promise<AdventureDto>;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Fetch character status
 */
export function useCharacter(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.character(characterId || ""),
    queryFn: async () => {
      if (!characterId) return null;
      const response = await fetch(`${API_BASE}/characters/${characterId}`);
      if (!response.ok) throw new Error("Failed to fetch character");
      return response.json() as Promise<CharacterDto>;
    },
    enabled: !!characterId,
    staleTime: 10000,
    refetchInterval: 5000,
  });
}

/**
 * Fetch combat state
 */
export function useCombat(combatId: string | null) {
  return useQuery({
    queryKey: queryKeys.combat(combatId || ""),
    queryFn: async () => {
      if (!combatId) return null;
      const response = await fetch(`${API_BASE}/Combats/${combatId}`);
      if (!response.ok) throw new Error("Failed to fetch combat");
      return response.json() as Promise<CombatStateResponse>;
    },
    enabled: !!combatId,
    staleTime: 5000,
    refetchInterval: 2000,
  });
}

/**
 * Resolve player combat turn
 */
export function useResolveTurn(combatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      attackerId: string;
      targetId: string;
      action: string;
    }) => {
      const response = await fetch(`${API_BASE}/Combats/${combatId}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to resolve turn");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.combat(combatId), data);
    },
  });
}

/**
 * Resolve enemy combat turn
 */
export function useResolveEnemyTurn(combatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_BASE}/Combats/${combatId}/enemy-turn`,
        {
          method: "POST",
        },
      );
      if (!response.ok) throw new Error("Failed to resolve enemy turn");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.combat(combatId), data);
    },
  });
}
```

---

### Step 3: Create Utility Functions

**File**: `frontend/src/utils/narrativeFormatter.ts`

```typescript
import type { NarrativeMessage } from "../types/game";

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get icon for message type
 */
export function getMessageIcon(type: NarrativeMessage["type"]): string {
  const icons = {
    scene: "📍",
    narration: "📖",
    action: "⚡",
    combat: "⚔️",
    system: "⚙️",
    dialogue: "💬",
  };
  return icons[type];
}

/**
 * Get CSS class for message type
 */
export function getMessageClass(type: NarrativeMessage["type"]): string {
  const classes = {
    scene: "text-blue-300 font-semibold",
    narration: "text-gray-300",
    action: "text-green-300",
    combat: "text-red-300",
    system: "text-yellow-300",
    dialogue: "text-purple-300",
  };
  return classes[type];
}
```

**File**: `frontend/src/utils/diceAnimationHelper.ts`

```typescript
import type { DiceRollResult } from "../types/game";

/**
 * Generate random rotation angles for dice animation
 */
export function generateDiceRotation(): { x: number; y: number; z: number } {
  return {
    x: Math.random() * 720 - 360,
    y: Math.random() * 720 - 360,
    z: Math.random() * 720 - 360,
  };
}

/**
 * Format dice roll result for display
 */
export function formatDiceRoll(roll: DiceRollResult): string {
  if (roll.modifiers === 0) {
    return `🎲 ${roll.total}`;
  }
  const modStr =
    roll.modifiers > 0 ? `+${roll.modifiers}` : `${roll.modifiers}`;
  return `🎲 ${roll.total} (${roll.baseRoll} ${modStr})`;
}

/**
 * Determine if roll is critical (natural 20 or 1 on d20)
 */
export function checkCritical(
  roll: DiceRollResult,
): "success" | "failure" | null {
  if (roll.notation.startsWith("1d20")) {
    if (roll.baseRoll === 20) return "success";
    if (roll.baseRoll === 1) return "failure";
  }
  return null;
}
```

---

### Step 4: Create Custom Hooks

**File**: `frontend/src/hooks/useCommandInput.ts`

```typescript
import { useState, useCallback } from "react";
import type { CommandInputState } from "../types/game";

export function useCommandInput() {
  const [state, setState] = useState<CommandInputState>({
    currentInput: "",
    history: [],
    historyIndex: -1,
    savedInput: "",
    validationError: null,
    isSubmitting: false,
  });

  const handleInputChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      currentInput: value,
      validationError: null,
    }));
  }, []);

  const handleHistoryNavigation = useCallback((direction: "up" | "down") => {
    setState((prev) => {
      if (prev.history.length === 0) return prev;

      let newIndex = prev.historyIndex;

      if (direction === "up") {
        if (newIndex === -1) {
          // Save current input before navigating
          newIndex = prev.history.length - 1;
          return {
            ...prev,
            savedInput: prev.currentInput,
            currentInput: prev.history[newIndex],
            historyIndex: newIndex,
          };
        } else if (newIndex > 0) {
          newIndex -= 1;
          return {
            ...prev,
            currentInput: prev.history[newIndex],
            historyIndex: newIndex,
          };
        }
      } else {
        // down
        if (newIndex === -1) return prev;
        if (newIndex < prev.history.length - 1) {
          newIndex += 1;
          return {
            ...prev,
            currentInput: prev.history[newIndex],
            historyIndex: newIndex,
          };
        } else {
          // Restore saved input
          return {
            ...prev,
            currentInput: prev.savedInput,
            historyIndex: -1,
            savedInput: "",
          };
        }
      }

      return prev;
    });
  }, []);

  const handleSubmit = useCallback(
    (onSubmit: (command: string) => Promise<void>) => {
      const trimmed = state.currentInput.trim();

      if (!trimmed) {
        setState((prev) => ({
          ...prev,
          validationError: "Command cannot be empty",
        }));
        return;
      }

      if (trimmed.length > 500) {
        setState((prev) => ({
          ...prev,
          validationError: "Command too long (max 500 characters)",
        }));
        return;
      }

      setState((prev) => ({ ...prev, isSubmitting: true }));

      onSubmit(trimmed)
        .then(() => {
          setState((prev) => ({
            currentInput: "",
            history: [...prev.history, trimmed].slice(-50), // Keep last 50
            historyIndex: -1,
            savedInput: "",
            validationError: null,
            isSubmitting: false,
          }));
        })
        .catch((error) => {
          setState((prev) => ({
            ...prev,
            validationError: error.message || "Command failed",
            isSubmitting: false,
          }));
        });
    },
    [state.currentInput],
  );

  return {
    state,
    handleInputChange,
    handleHistoryNavigation,
    handleSubmit,
  };
}
```

**File**: `frontend/src/hooks/useGameState.ts`

```typescript
import { useState, useEffect } from "react";
import type { GameState, NarrativeMessage } from "../types/game";

export function useGameState(adventureId: string) {
  const [narrative, setNarrative] = useState<NarrativeMessage[]>([]);

  // Load narrative from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(`game_${adventureId}_narrative`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNarrative(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        );
      } catch (e) {
        console.error("Failed to parse stored narrative", e);
      }
    }
  }, [adventureId]);

  // Save narrative to session storage on change
  useEffect(() => {
    if (narrative.length > 0) {
      sessionStorage.setItem(
        `game_${adventureId}_narrative`,
        JSON.stringify(narrative.slice(-100)), // Store last 100 messages
      );
    }
  }, [narrative, adventureId]);

  const addNarrativeMessage = (message: NarrativeMessage) => {
    setNarrative((prev) => [...prev, message].slice(-1000)); // Keep last 1000
  };

  const clearNarrative = () => {
    setNarrative([]);
    sessionStorage.removeItem(`game_${adventureId}_narrative`);
  };

  return {
    narrative,
    addNarrativeMessage,
    clearNarrative,
  };
}
```

---

### Step 5: Create Core Components

**File**: `frontend/src/components/GameScreen/NarrativeDisplay.tsx`

```typescript
import React, { useRef, useEffect } from 'react';
import type { NarrativeMessage } from '../../types/game';
import { formatTimestamp, getMessageIcon, getMessageClass } from '../../utils/narrativeFormatter';

interface NarrativeDisplayProps {
  messages: NarrativeMessage[];
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = React.memo(({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900 rounded-lg"
      role="log"
      aria-live="polite"
      aria-label="Game narrative"
    >
      {messages.length === 0 && (
        <p className="text-gray-500 italic">No messages yet. The adventure begins...</p>
      )}

      {messages.map((message) => (
        <div key={message.id} className="flex gap-2">
          <span className="text-gray-500 text-sm shrink-0">
            {formatTimestamp(message.timestamp)}
          </span>
          <span className="shrink-0">{getMessageIcon(message.type)}</span>
          <p className={getMessageClass(message.type)}>
            {message.content}
          </p>
        </div>
      ))}
    </div>
  );
});

NarrativeDisplay.displayName = 'NarrativeDisplay';
```

**File**: `frontend/src/components/CommandInput/CommandInput.tsx`

```typescript
import React from 'react';
import { useCommandInput } from '../../hooks/useCommandInput';

interface CommandInputProps {
  onSubmit: (command: string) => Promise<void>;
  disabled?: boolean;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onSubmit, disabled }) => {
  const { state, handleInputChange, handleHistoryNavigation, handleSubmit } = useCommandInput();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleHistoryNavigation('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleHistoryNavigation('down');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onSubmit);
    } else if (e.key === 'Escape') {
      handleInputChange('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={state.currentInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          disabled={disabled || state.isSubmitting}
          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          aria-label="Command input"
          autoComplete="off"
        />
        <button
          onClick={() => handleSubmit(onSubmit)}
          disabled={disabled || state.isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          aria-label="Submit command"
        >
          {state.isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </div>

      {state.validationError && (
        <p className="text-red-400 text-sm" role="alert">
          {state.validationError}
        </p>
      )}

      <p className="text-gray-500 text-xs">
        Press ↑/↓ to navigate command history, Enter to submit, Esc to clear
      </p>
    </div>
  );
};
```

**File**: `frontend/src/components/CharacterStatus/CharacterStatusSidebar.tsx`

```typescript
import React from 'react';
import type { CharacterStatus } from '../../types/game';

interface CharacterStatusSidebarProps {
  character: CharacterStatus;
}

export const CharacterStatusSidebar: React.FC<CharacterStatusSidebarProps> = ({ character }) => {
  const hpPercentage = (character.currentHp / character.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <aside className="w-80 bg-gray-800 p-4 space-y-4 rounded-lg" aria-label="Character status">
      {/* Character Name */}
      <div>
        <h2 className="text-xl font-bold text-white">{character.name}</h2>
      </div>

      {/* Health Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-300">HP</span>
          <span className="text-white font-semibold">
            {character.currentHp} / {character.maxHp}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
          <div
            className={`h-full ${hpColor} transition-all duration-300`}
            style={{ width: `${hpPercentage}%` }}
            role="progressbar"
            aria-valuenow={character.currentHp}
            aria-valuemin={0}
            aria-valuemax={character.maxHp}
            aria-label="Character health"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">
          {Math.round(hpPercentage)}%
        </p>
      </div>

      {/* Equipment */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">⚔️ Equipped</h3>
        <ul className="space-y-1">
          {character.equipment.length === 0 && (
            <li className="text-gray-500 text-sm italic">No equipment</li>
          )}
          {character.equipment.map((item, idx) => (
            <li key={idx} className="text-sm text-gray-300">
              {item.icon} {item.name} <span className="text-blue-400">({item.statImpact})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Conditions */}
      {character.conditions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">🔮 Active Conditions</h3>
          <ul className="space-y-1">
            {character.conditions.map((condition, idx) => {
              const colorClass = condition.type === 'buff' ? 'text-green-400' : condition.type === 'debuff' ? 'text-red-400' : 'text-gray-400';
              return (
                <li key={idx} className={`text-sm ${colorClass}`}>
                  {condition.icon} {condition.name}
                  {condition.turnsRemaining !== null && ` (${condition.turnsRemaining} turns)`}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
};
```

---

### Step 6: Create Combat Components

**File**: `frontend/src/components/CombatUI/TurnIndicator.tsx`

```typescript
import React from 'react';
import type { CombatState } from '../../types/game';

interface TurnIndicatorProps {
  combat: CombatState;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ combat }) => {
  const currentCombatant = combat.combatants[combat.currentTurnIndex];
  const isPlayerTurn = currentCombatant?.type === 'player';

  return (
    <div
      className={`px-6 py-3 rounded-lg font-bold text-center ${
        isPlayerTurn ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Combat turn indicator"
    >
      <div className="flex items-center justify-between">
        <span className="text-lg">
          {isPlayerTurn ? '🗡️ YOUR TURN' : `⏳ ${currentCombatant?.name}'s Turn`}
        </span>
        <span className="text-sm">
          Round {combat.round}
        </span>
      </div>
    </div>
  );
};
```

**File**: `frontend/src/components/CombatUI/CombatantsList.tsx`

```typescript
import React from 'react';
import type { Combatant } from '../../types/game';

interface CombatantsListProps {
  combatants: Combatant[];
  currentTurnIndex: number;
}

export const CombatantsList: React.FC<CombatantsListProps> = ({ combatants, currentTurnIndex }) => {
  return (
    <div className="space-y-2">
      {combatants.map((combatant, idx) => {
        const isCurrentTurn = idx === currentTurnIndex;
        const hpPercentage = (combatant.currentHp / combatant.maxHp) * 100;
        const isDead = combatant.status === 'defeated';

        return (
          <div
            key={combatant.id}
            className={`p-3 rounded-lg border ${
              isCurrentTurn ? 'border-green-500 bg-gray-800' : 'border-gray-700 bg-gray-900'
            } ${isDead ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isCurrentTurn && <span className="text-green-500">▶️</span>}
                <span className={`font-semibold ${isDead ? 'line-through text-gray-500' : 'text-white'}`}>
                  {combatant.type === 'player' ? '[YOU] ' : '[ENEMY] '}
                  {combatant.name}
                </span>
              </div>
              <span className="text-gray-400 text-sm">AC {combatant.armorClass}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm ${hpPercentage < 30 ? 'text-red-400' : 'text-gray-300'}`}>
                ❤️ {combatant.currentHp}/{combatant.maxHp}
              </span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-full rounded-full ${
                    hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
            </div>

            {combatant.conditions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {combatant.conditions.map((condition, condIdx) => (
                  <span
                    key={condIdx}
                    className={`text-xs px-2 py-1 rounded ${
                      condition.type === 'buff' ? 'bg-green-900 text-green-300' :
                      condition.type === 'debuff' ? 'bg-red-900 text-red-300' :
                      'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {condition.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

---

### Step 7: Create Main Game Page

**File**: `frontend/src/pages/GamePage.tsx`

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAdventure, useCharacter, useCombat } from '../services/gameApi';
import { useGameState } from '../hooks/useGameState';
import { NarrativeDisplay } from '../components/GameScreen/NarrativeDisplay';
import { CommandInput } from '../components/CommandInput/CommandInput';
import { CharacterStatusSidebar } from '../components/CharacterStatus/CharacterStatusSidebar';
import { TurnIndicator } from '../components/CombatUI/TurnIndicator';
import { CombatantsList } from '../components/CombatUI/CombatantsList';

export const GamePage: React.FC = () => {
  const { adventureId } = useParams<{ adventureId: string }>();

  if (!adventureId) {
    return <div>Adventure ID missing</div>;
  }

  const { data: adventure, isLoading: adventureLoading } = useAdventure(adventureId);
  const { data: character, isLoading: characterLoading } = useCharacter(adventure?.characterId || null);
  const { data: combat } = useCombat(adventure?.gameState?.combatId || null);

  const { narrative, addNarrativeMessage } = useGameState(adventureId);

  const handleCommandSubmit = async (command: string) => {
    // Add command to narrative
    addNarrativeMessage({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: 'action',
      content: `> ${command}`,
    });

    // TODO: Send command to backend API
    // For now, just add a mock response
    await new Promise(resolve => setTimeout(resolve, 500));

    addNarrativeMessage({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: 'narration',
      content: `You ${command}.`,
    });
  };

  if (adventureLoading || characterLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading adventure...</p>
        </div>
      </div>
    );
  }

  if (!adventure || !character) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400">Failed to load adventure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main Game Area */}
      <main className="flex-1 flex flex-col p-4 gap-4">
        {/* Combat UI (if in combat) */}
        {combat && (
          <div className="space-y-3 bg-gray-800 p-4 rounded-lg">
            <TurnIndicator combat={combat} />
            <CombatantsList
              combatants={combat.combatants}
              currentTurnIndex={combat.currentTurnIndex}
            />
          </div>
        )}

        {/* Narrative Display */}
        <NarrativeDisplay messages={narrative} />

        {/* Command Input */}
        <CommandInput onSubmit={handleCommandSubmit} disabled={false} />
      </main>

      {/* Character Status Sidebar */}
      <CharacterStatusSidebar character={character} />
    </div>
  );
};
```

---

### Step 8: Add Routing

**File**: `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GamePage } from './pages/GamePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/game/:adventureId" element={<GamePage />} />
          {/* Other routes */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

### Step 9: Add CSS Animations

**File**: `frontend/src/index.css` (append)

```css
/* Dice roll animation */
@keyframes roll-dice {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    opacity: 0.8;
  }
  50% {
    transform: rotateX(720deg) rotateY(540deg) rotateZ(360deg);
    opacity: 1;
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    opacity: 1;
  }
}

.dice-roll {
  animation: roll-dice 1.2s ease-out;
}

/* HP bar animation */
.hp-bar-transition {
  transition: width 0.3s ease-out;
}

/* Fade in animation for new messages */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.narrative-message {
  animation: fade-in 0.3s ease-out;
}
```

---

### Step 10: Testing

**File**: `frontend/tests/components/CommandInput.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandInput } from '../../src/components/CommandInput/CommandInput';

describe('CommandInput', () => {
  it('renders input field and submit button', () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CommandInput onSubmit={mockSubmit} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('submits command on Enter key', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CommandInput onSubmit={mockSubmit} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'look around' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockSubmit).toHaveBeenCalledWith('look around');
  });

  it('navigates command history with arrow keys', () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<CommandInput onSubmit={mockSubmit} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;

    // Submit a few commands
    fireEvent.change(input, { target: { value: 'first command' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Wait for history to update
    rerender(<CommandInput onSubmit={mockSubmit} />);

    // Press up arrow
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(input.value).toBe('first command');
  });
});
```

---

## Troubleshooting

### Issue: Narrative not auto-scrolling

**Solution**: Check that `scrollRef.current` exists and `useEffect` dependency includes `messages`.

### Issue: Command history not working

**Solution**: Verify `historyIndex` logic and ensure `ArrowUp`/`ArrowDown` events are prevented from default behavior.

### Issue: Combat state not updating

**Solution**: Check React Query cache invalidation after mutations. Ensure `onSuccess` callbacks update query cache.

### Issue: Types not matching API

**Solution**: Re-run `npm run generate:api` to regenerate types from OpenAPI spec.

---

## Next Steps

After implementing the core components:

1. **Add Dice Roll Animation Component** (P2)
2. **Implement Action Buttons** (Attack, Flee, Use Item)
3. **Add Error Boundaries** for graceful error handling
4. **Implement Loading Skeletons** for better UX
5. **Add Unit Tests** for all components (>90% coverage target)
6. **Run Accessibility Audit** (WCAG AA compliance)
7. **Performance Testing** (ensure 60fps animations, <100ms input)

---

**Quickstart Status**: ✅ **COMPLETE** - Implementation guide ready for development.
