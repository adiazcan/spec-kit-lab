# Data Model: Main Game Interface

**Feature**: 009-main-game-ui  
**Date**: 2026-02-02  
**Status**: ✅ Complete

---

## Overview

This document defines all frontend data structures, TypeScript interfaces, validation rules, and state management patterns for the main game interface. All types are designed to integrate with backend APIs via generated OpenAPI types.

---

## Core Domain Models

### 1. Game State

Represents the complete state of the game session.

```typescript
/**
 * Complete game state including scene, character, combat, and UI state.
 * This is the root state container for the game screen.
 */
interface GameState {
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
 * Validation Rules:
 * - adventureId: Must be valid UUID format
 * - character: Must exist (fetched from backend)
 * - narrative: Max 1000 messages in memory (older messages archived)
 * - combat: Non-null only when combat is active
 */
```

---

### 2. Scene Data

Represents the current game scene/location.

```typescript
/**
 * Current scene information including description and available actions.
 * Fetched from backend via Adventure API.
 */
interface SceneData {
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
 * Validation Rules:
 * - sceneId: Non-empty string
 * - title: 1-100 characters
 * - description: 1-5000 characters
 * - availableActions: 0-20 actions
 */
```

---

### 3. Narrative Message

Individual message displayed in the narrative feed.

```typescript
/**
 * Single narrative message entry.
 * Messages are accumulated in chronological order.
 */
interface NarrativeMessage {
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
type NarrativeMessageType =
  | "scene" // Scene description or transition
  | "narration" // Ambient story text
  | "action" // Player action result
  | "combat" // Combat log entry
  | "system" // System message (save, error, etc.)
  | "dialogue"; // NPC dialogue

/**
 * Optional metadata for rich message display.
 */
interface NarrativeMetadata {
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

/**
 * Validation Rules:
 * - id: UUID v4 format
 * - timestamp: Valid Date object, not future dated
 * - type: Must be one of NarrativeMessageType values
 * - content: 1-2000 characters
 */
```

---

### 4. Character Status

Character information for sidebar display.

```typescript
/**
 * Character status displayed in sidebar.
 * Retrieved from Characters API (/api/characters/{id}).
 */
interface CharacterStatus {
  /** Character unique ID */
  characterId: string;

  /** Character name */
  name: string;

  /** Current hit points */
  currentHp: number;

  /** Maximum hit points */
  maxHp: number;

  /** Equipped items */
  equipment: EquippedItem[];

  /** Active status effects/conditions */
  conditions: ActiveCondition[];

  /** Core attributes (for display, not modification) */
  attributes?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

/**
 * Equipped item summary for display.
 */
interface EquippedItem {
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
interface ActiveCondition {
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
 * Validation Rules:
 * - characterId: Valid UUID format
 * - name: 1-50 characters
 * - currentHp: >= 0, <= maxHp
 * - maxHp: > 0
 * - equipment: 0-10 items
 * - conditions: 0-20 conditions
 * - turnsRemaining: >= 0 or null
 */
```

---

### 5. Combat State

Active combat encounter state.

```typescript
/**
 * Combat state for UI display.
 * Retrieved from Combat API (/api/Combats/{id}).
 */
interface CombatState {
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
interface Combatant {
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
interface CombatLogEntry {
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
 * Validation Rules:
 * - combatId: Valid UUID format
 * - round: >= 1
 * - combatants: 2-20 combatants
 * - currentTurnIndex: >= 0, < combatants.length
 * - initiative: -10 to 40 (realistic range)
 * - currentHp: >= 0, <= maxHp
 * - armorClass: 1-30 (realistic D&D range)
 */
```

---

### 6. Dice Roll Result

Dice roll details for animation and display.

```typescript
/**
 * Dice roll result with animation metadata.
 */
interface DiceRollResult {
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
 * Validation Rules:
 * - notation: Valid dice notation regex /^\d+d\d+([+-]\d+)?$/
 * - baseRoll: >= 1
 * - modifiers: -20 to +20 (realistic range)
 * - total: baseRoll + modifiers
 * - diceResults: Length matches dice count in notation
 * - critical: null for non-d20 rolls
 */
```

---

### 7. Command Input State

Command input and history management.

```typescript
/**
 * Command input state for text input component.
 */
interface CommandInputState {
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
 * Validation Rules:
 * - currentInput: 0-500 characters
 * - history: Max 50 entries, each 1-500 characters
 * - historyIndex: -1 to history.length - 1
 * - validationError: 0-200 characters
 */
```

---

### 8. UI State

Global UI state for loading, errors, and modals.

```typescript
/**
 * UI state management for game screen.
 */
interface UIState {
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
 * Validation Rules:
 * - error: 0-500 characters
 * - All boolean flags: true/false only
 */
```

---

## State Management Patterns

### React Query Keys

```typescript
/**
 * Query key factories for React Query.
 */
const queryKeys = {
  adventure: (adventureId: string) => ["adventure", adventureId] as const,
  character: (characterId: string) => ["character", characterId] as const,
  combat: (combatId: string) => ["combat", combatId] as const,
  combatHistory: (combatId: string) => ["combat", combatId, "history"] as const,
};
```

### Component State

```typescript
/**
 * Local component state for GameScreen.
 */
interface GameScreenState {
  /** Narrative messages (local state, not persisted) */
  narrativeMessages: NarrativeMessage[];

  /** Command input state */
  commandInput: CommandInputState;

  /** UI state */
  ui: UIState;
}
```

### Session Storage Schema

```typescript
/**
 * Session storage schema for persistence across refreshes.
 */
interface GameSessionStorage {
  /** Current adventure ID */
  adventureId: string;

  /** Narrative messages (last 100) */
  narrativeMessages: NarrativeMessage[];

  /** Command history */
  commandHistory: string[];

  /** Timestamp of last save */
  lastSaved: string;
}
```

---

## Data Flow Patterns

### 1. Initial Load

```
User navigates to /game/{adventureId}
  ↓
Fetch adventure state (React Query)
  ↓
Fetch character state (React Query)
  ↓
Check for active combat (if adventureId has combat ID)
  ↓
Restore narrative from session storage
  ↓
Render game screen with all data
```

### 2. Command Submission

```
User types command + presses Enter
  ↓
Validate command (non-empty, <500 chars)
  ↓
Add to command history
  ↓
Disable input (set isSubmitting = true)
  ↓
POST command to backend API
  ↓
Backend returns action result
  ↓
Generate narrative message from result
  ↓
Update game state (scene, combat, etc.)
  ↓
Re-enable input
  ↓
Auto-scroll narrative to bottom
```

### 3. Combat Turn Resolution

```
Player clicks "Attack" button
  ↓
Trigger dice roll animation (d20)
  ↓
POST /api/Combats/{id}/turns
  ↓
Backend returns combat state + action result
  ↓
Generate combat log narrative messages
  ↓
Update combat state (HP, turn index, etc.)
  ↓
If enemy turn next:
  ↓
  POST /api/Combats/{id}/enemy-turn
  ↓
  Repeat narrative + state update
  ↓
Update turn indicator UI
```

### 4. Dice Roll Animation

```
Backend action triggers dice roll
  ↓
Parse dice roll result from API response
  ↓
Set activeDiceRoll in UI state
  ↓
Render DiceRollAnimation component
  ↓
Play CSS animation (1.2s duration)
  ↓
Display final result with modifiers
  ↓
Clear activeDiceRoll after 2s delay
  ↓
Append result to narrative
```

---

## Validation Rules Summary

| Data Type         | Key Validations                                                  |
| ----------------- | ---------------------------------------------------------------- |
| GameState         | adventureId (UUID), character non-null, narrative max 1000 msgs  |
| SceneData         | sceneId non-empty, title 1-100 chars, description 1-5000 chars   |
| NarrativeMessage  | id (UUID), type enum, content 1-2000 chars, timestamp not future |
| CharacterStatus   | currentHp <= maxHp, maxHp > 0, name 1-50 chars                   |
| CombatState       | round >= 1, currentTurnIndex valid, combatants 2-20              |
| DiceRollResult    | notation regex, baseRoll >= 1, total = baseRoll + modifiers      |
| CommandInputState | currentInput <= 500 chars, history max 50 entries                |
| UIState           | error <= 500 chars, boolean flags only true/false                |

---

## Error Handling Patterns

### API Error Response

```typescript
/**
 * Standard API error response structure.
 */
interface APIError {
  /** HTTP status code */
  status: number;

  /** Error title */
  title: string;

  /** Detailed error message */
  detail: string;

  /** Error code for programmatic handling */
  code?: string;
}
```

### Error Display Strategy

| Error Type       | User Message                                         | Action                |
| ---------------- | ---------------------------------------------------- | --------------------- |
| Network Error    | "Unable to connect. Check your internet connection." | Show retry button     |
| 400 Bad Request  | Display `detail` from API response                   | Show inline error     |
| 401 Unauthorized | "Session expired. Please log in again."              | Redirect to login     |
| 404 Not Found    | "Adventure not found. It may have been deleted."     | Redirect to dashboard |
| 500 Server Error | "Something went wrong. Please try again later."      | Show retry button     |

---

## Type Generation

All backend API types are generated from OpenAPI spec:

```bash
npm run generate:api
```

Output: `/frontend/src/types/api.ts`

Frontend-specific types extend or compose generated types:

```typescript
import type { AdventureDto, CharacterDto, CombatStateResponse } from "./api";

// Example: Extend backend type with frontend-specific fields
interface EnrichedCharacterStatus extends CharacterDto {
  // Frontend-computed fields
  hpPercentage: number;
  isDead: boolean;
  mainHandWeapon: string | null;
}
```

---

## Performance Considerations

### Memory Management

- Limit narrative messages to 1000 in memory (archive older to session storage)
- Remove defeated combatants from active combat list (move to "defeated" section)
- Debounce command input validation to reduce CPU usage

### Render Optimization

- Use `React.memo()` on `NarrativeMessage` component
- Virtual scrolling for narrative (render only visible messages)
- Memoize character HP percentage calculation
- Throttle combat state polling to 2s intervals

---

## Testing Strategy

### Unit Tests

```typescript
describe('NarrativeMessage', () => {
  it('validates message content length', () => {
    const longMessage = 'a'.repeat(2001);
    expect(() => validateNarrativeMessage({ content: longMessage })).toThrow();
  });

  it('prevents future-dated timestamps', () => {
    const futureDate = new Date('2030-01-01');
    expect(() => validateNarrativeMessage({ timestamp: futureDate })).toThrow();
  });
});

describe('CharacterStatus', () => {
  it('calculates HP percentage correctly', () => {
    const character: CharacterStatus = { currentHp: 15, maxHp: 30, ... };
    expect(calculateHpPercentage(character)).toBe(50);
  });

  it('validates currentHp <= maxHp', () => {
    const invalid: CharacterStatus = { currentHp: 35, maxHp: 30, ... };
    expect(() => validateCharacterStatus(invalid)).toThrow();
  });
});
```

### Integration Tests

```typescript
describe('Game Flow', () => {
  it('loads game state and renders narrative', async () => {
    const { getByRole, getByText } = render(<GameScreen adventureId="..." />);

    // Wait for API calls
    await waitFor(() => expect(getByText('Dark Cavern')).toBeInTheDocument());

    // Verify character status displayed
    expect(getByText('HP: 25 / 30')).toBeInTheDocument();

    // Verify input enabled
    expect(getByRole('textbox')).toBeEnabled();
  });

  it('submits command and updates narrative', async () => {
    const { getByRole, getByText } = render(<GameScreen adventureId="..." />);

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'look around' } });
    fireEvent.submit(input);

    // Wait for API response
    await waitFor(() => expect(getByText(/You look around/)).toBeInTheDocument());
  });
});
```

---

**Data Model Status**: ✅ **COMPLETE** - All frontend data structures defined and validated.
