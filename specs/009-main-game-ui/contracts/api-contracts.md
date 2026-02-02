# API Contracts: Main Game Interface

**Feature**: 009-main-game-ui  
**Date**: 2026-02-02  
**Status**: ✅ Complete

---

## Overview

This document specifies all REST API endpoints consumed by the main game interface, including request/response schemas, error handling, and caching strategies. All contracts reference the existing backend OpenAPI specification.

---

## API Endpoints

### 1. Get Adventure State

**Endpoint**: `GET /api/Adventures/{id}`  
**Purpose**: Retrieve current adventure state including scene reference  
**Authentication**: Required

#### Request

```http
GET /api/Adventures/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.diceengine.example
Authorization: Bearer <token>
```

**Path Parameters**:

- `id` (required): Adventure UUID

#### Response (200 OK)

```json
{
  "adventureId": "550e8400-e29b-41d4-a716-446655440000",
  "characterId": "660e8400-e29b-41d4-a716-446655440001",
  "currentSceneId": "scene_cavern_entrance",
  "gameState": {
    "inventory": ["torch", "rope"],
    "flags": ["met_wizard", "found_key"],
    "questProgress": {
      "mainQuest": 3,
      "sideQuests": ["rescue_villager"]
    }
  },
  "createdAt": "2026-02-02T10:00:00Z",
  "updatedAt": "2026-02-02T14:30:00Z"
}
```

**Response Schema**:

```typescript
interface AdventureDto {
  adventureId: string; // UUID
  characterId: string; // UUID
  currentSceneId: string; // Scene identifier
  gameState: object; // Arbitrary JSON game state
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}
```

#### Error Responses

**404 Not Found**:

```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Adventure with ID '550e8400-e29b-41d4-a716-446655440000' was not found."
}
```

**401 Unauthorized**:

```json
{
  "status": 401,
  "title": "Unauthorized",
  "detail": "Authentication required. Please provide a valid access token."
}
```

#### Frontend Integration

```typescript
import { useQuery } from "@tanstack/react-query";
import type { AdventureDto } from "../types/api";

function useAdventure(adventureId: string) {
  return useQuery({
    queryKey: ["adventure", adventureId],
    queryFn: async () => {
      const response = await fetch(`/api/Adventures/${adventureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch adventure");
      return response.json() as Promise<AdventureDto>;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}
```

---

### 2. Get Character Status

**Endpoint**: `GET /api/characters/{id}`  
**Purpose**: Retrieve character details for status sidebar  
**Authentication**: Required

#### Request

```http
GET /api/characters/660e8400-e29b-41d4-a716-446655440001 HTTP/1.1
Host: api.diceengine.example
Authorization: Bearer <token>
```

**Path Parameters**:

- `id` (required): Character UUID

#### Response (200 OK)

```json
{
  "characterId": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Aragorn",
  "currentHp": 25,
  "maxHp": 30,
  "attributes": {
    "strength": 16,
    "dexterity": 14,
    "constitution": 15,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 13
  },
  "equipment": [
    {
      "itemName": "Longsword",
      "slot": "mainHand",
      "damageBonus": 5,
      "armorClassBonus": 0
    },
    {
      "itemName": "Chain Mail",
      "slot": "armor",
      "damageBonus": 0,
      "armorClassBonus": 16
    }
  ],
  "conditions": [
    {
      "name": "Blessed",
      "turnsRemaining": 3,
      "type": "buff"
    }
  ],
  "armorClass": 18
}
```

**Response Schema**:

```typescript
interface CharacterDto {
  characterId: string;
  name: string;
  currentHp: number;
  maxHp: number;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  equipment: EquipmentItem[];
  conditions: Condition[];
  armorClass: number;
}

interface EquipmentItem {
  itemName: string;
  slot: string;
  damageBonus: number;
  armorClassBonus: number;
}

interface Condition {
  name: string;
  turnsRemaining: number | null;
  type: "buff" | "debuff" | "neutral";
}
```

#### Frontend Integration

```typescript
function useCharacter(characterId: string) {
  return useQuery({
    queryKey: ["character", characterId],
    queryFn: async () => {
      const response = await fetch(`/api/characters/${characterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch character");
      return response.json() as Promise<CharacterDto>;
    },
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 5000, // Refetch every 5 seconds during active gameplay
  });
}
```

---

### 3. Get Combat State

**Endpoint**: `GET /api/Combats/{id}`  
**Purpose**: Retrieve current combat encounter state  
**Authentication**: Required

#### Request

```http
GET /api/Combats/770e8400-e29b-41d4-a716-446655440002 HTTP/1.1
Host: api.diceengine.example
Authorization: Bearer <token>
```

**Path Parameters**:

- `id` (required): Combat UUID

#### Response (200 OK)

```json
{
  "combatId": "770e8400-e29b-41d4-a716-446655440002",
  "round": 3,
  "status": "active",
  "combatants": [
    {
      "combatantId": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Aragorn",
      "type": "player",
      "initiative": 18,
      "currentHp": 25,
      "maxHp": 30,
      "armorClass": 18,
      "status": "active",
      "conditions": [
        {
          "name": "Blessed",
          "turnsRemaining": 3,
          "type": "buff"
        }
      ]
    },
    {
      "combatantId": "880e8400-e29b-41d4-a716-446655440003",
      "name": "Goblin Warrior",
      "type": "enemy",
      "initiative": 12,
      "currentHp": 5,
      "maxHp": 10,
      "armorClass": 12,
      "status": "active",
      "conditions": []
    },
    {
      "combatantId": "890e8400-e29b-41d4-a716-446655440004",
      "name": "Goblin Archer",
      "type": "enemy",
      "initiative": 9,
      "currentHp": 0,
      "maxHp": 8,
      "armorClass": 11,
      "status": "defeated",
      "conditions": []
    }
  ],
  "currentTurnIndex": 0,
  "turnOrder": [
    "660e8400-e29b-41d4-a716-446655440001",
    "880e8400-e29b-41d4-a716-446655440003"
  ]
}
```

**Response Schema**:

```typescript
interface CombatStateResponse {
  combatId: string;
  round: number;
  status: "active" | "victory" | "defeat" | "fled";
  combatants: CombatantDto[];
  currentTurnIndex: number;
  turnOrder: string[]; // Array of combatant IDs
}

interface CombatantDto {
  combatantId: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  status: "active" | "defeated" | "fled";
  conditions: Condition[];
}
```

#### Frontend Integration

```typescript
function useCombat(combatId: string | null) {
  return useQuery({
    queryKey: ["combat", combatId],
    queryFn: async () => {
      if (!combatId) return null;
      const response = await fetch(`/api/Combats/${combatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch combat state");
      return response.json() as Promise<CombatStateResponse>;
    },
    enabled: !!combatId, // Only run if combatId exists
    staleTime: 5000,
    refetchInterval: 2000, // Refetch every 2 seconds during combat
  });
}
```

---

### 4. Resolve Player Turn

**Endpoint**: `POST /api/Combats/{id}/turns`  
**Purpose**: Execute player action during their combat turn  
**Authentication**: Required

#### Request

```http
POST /api/Combats/770e8400-e29b-41d4-a716-446655440002/turns HTTP/1.1
Host: api.diceengine.example
Authorization: Bearer <token>
Content-Type: application/json

{
  "attackerId": "660e8400-e29b-41d4-a716-446655440001",
  "targetId": "880e8400-e29b-41d4-a716-446655440003",
  "action": "attack"
}
```

**Request Schema**:

```typescript
interface ResolveTurnRequest {
  attackerId: string; // Player character ID
  targetId: string; // Target combatant ID
  action: "attack" | "flee" | "defend";
}
```

#### Response (200 OK)

```json
{
  "combatId": "770e8400-e29b-41d4-a716-446655440002",
  "round": 3,
  "status": "active",
  "combatants": [
    /* Updated combatant states */
  ],
  "currentTurnIndex": 1,
  "turnOrder": [
    /* Same as before */
  ],
  "actionResult": {
    "attackRoll": {
      "notation": "1d20+5",
      "baseRoll": 14,
      "modifiers": 5,
      "total": 19
    },
    "hit": true,
    "damageRoll": {
      "notation": "1d8+3",
      "baseRoll": 6,
      "modifiers": 3,
      "total": 9
    },
    "damageDealt": 9,
    "targetDefeated": false,
    "message": "Aragorn attacks Goblin Warrior. Attack roll: 19 (hit!). Damage: 9."
  }
}
```

**Response Schema**:

```typescript
interface CombatTurnResponse extends CombatStateResponse {
  actionResult: CombatActionResult;
}

interface CombatActionResult {
  attackRoll?: DiceRollDto;
  hit?: boolean;
  damageRoll?: DiceRollDto;
  damageDealt?: number;
  targetDefeated?: boolean;
  message: string;
}

interface DiceRollDto {
  notation: string;
  baseRoll: number;
  modifiers: number;
  total: number;
}
```

#### Error Responses

**400 Bad Request** (Not player's turn):

```json
{
  "status": 400,
  "title": "Invalid Turn",
  "detail": "It is not currently Aragorn's turn. Current turn: Goblin Warrior."
}
```

**400 Bad Request** (Invalid target):

```json
{
  "status": 400,
  "title": "Invalid Target",
  "detail": "Target combatant 'Goblin Archer' is already defeated."
}
```

#### Frontend Integration

```typescript
function useResolveTurn(combatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ResolveTurnRequest) => {
      const response = await fetch(`/api/Combats/${combatId}/turns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to resolve turn");
      }
      return response.json() as Promise<CombatTurnResponse>;
    },
    onSuccess: (data) => {
      // Update combat state cache
      queryClient.setQueryData(["combat", combatId], data);

      // Generate narrative message from action result
      const message: NarrativeMessage = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "combat",
        content: data.actionResult.message,
        metadata: {
          diceRoll: data.actionResult.attackRoll,
          combatAction: {
            attacker: "Player",
            target: "Enemy",
            damage: data.actionResult.damageDealt,
            hit: data.actionResult.hit ?? false,
          },
        },
      };

      // Add to narrative (via context or state)
      addNarrativeMessage(message);
    },
  });
}
```

---

### 5. Resolve Enemy Turn

**Endpoint**: `POST /api/Combats/{id}/enemy-turn`  
**Purpose**: Execute AI enemy action during their turn  
**Authentication**: Required

#### Request

```http
POST /api/Combats/770e8400-e29b-41d4-a716-446655440002/enemy-turn HTTP/1.1
Host: api.diceengine.example
Authorization: Bearer <token>
```

**No Request Body** (Backend determines enemy action via AI)

#### Response (200 OK)

Same as Resolve Player Turn response, but `actionResult` describes enemy action.

```json
{
  "combatId": "770e8400-e29b-41d4-a716-446655440002",
  "round": 3,
  "status": "active",
  "combatants": [
    /* Updated */
  ],
  "currentTurnIndex": 2,
  "turnOrder": [
    /* Same */
  ],
  "actionResult": {
    "attackRoll": {
      "notation": "1d20+2",
      "baseRoll": 11,
      "modifiers": 2,
      "total": 13
    },
    "hit": false,
    "message": "Goblin Warrior attacks Aragorn. Attack roll: 13 (miss!)."
  }
}
```

#### Frontend Integration

```typescript
function useResolveEnemyTurn(combatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/Combats/${combatId}/enemy-turn`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to resolve enemy turn");
      return response.json() as Promise<CombatTurnResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["combat", combatId], data);

      // Generate narrative for enemy action
      const message: NarrativeMessage = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "combat",
        content: data.actionResult.message,
        metadata: { diceRoll: data.actionResult.attackRoll },
      };

      addNarrativeMessage(message);
    },
  });
}
```

---

### 6. Get Combat History

**Endpoint**: `GET /api/Combats/{id}/actions`  
**Purpose**: Retrieve combat log/history for display  
**Authentication**: Required

#### Request

```http
GET /api/Combats/770e8400-e29b-41d4-a716-446655440002/actions?page=1&pageSize=20 HTTP/1.1
Host: api.diceengine.example
Authorization: Bearer <token>
```

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)

#### Response (200 OK)

```json
{
  "combatId": "770e8400-e29b-41d4-a716-446655440002",
  "actions": [
    {
      "actionId": "action_001",
      "round": 1,
      "actorName": "Aragorn",
      "targetName": "Goblin Warrior",
      "action": "attack",
      "result": "hit",
      "damage": 8,
      "timestamp": "2026-02-02T14:30:15Z"
    },
    {
      "actionId": "action_002",
      "round": 1,
      "actorName": "Goblin Warrior",
      "targetName": "Aragorn",
      "action": "attack",
      "result": "miss",
      "damage": 0,
      "timestamp": "2026-02-02T14:30:22Z"
    }
  ],
  "totalActions": 12,
  "page": 1,
  "pageSize": 20
}
```

**Response Schema**:

```typescript
interface CombatHistoryResponse {
  combatId: string;
  actions: CombatActionDto[];
  totalActions: number;
  page: number;
  pageSize: number;
}

interface CombatActionDto {
  actionId: string;
  round: number;
  actorName: string;
  targetName?: string;
  action: string;
  result: string;
  damage?: number;
  timestamp: string;
}
```

#### Frontend Integration

```typescript
function useCombatHistory(combatId: string) {
  return useQuery({
    queryKey: ["combat", combatId, "history"],
    queryFn: async () => {
      const response = await fetch(
        `/api/Combats/${combatId}/actions?page=1&pageSize=100`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Failed to fetch combat history");
      return response.json() as Promise<CombatHistoryResponse>;
    },
    staleTime: Infinity, // History doesn't change, cache indefinitely
  });
}
```

---

## Caching Strategy

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5000,
    },
  },
});
```

### Per-Endpoint Cache Settings

| Endpoint                          | Stale Time | Refetch Interval | Rationale                            |
| --------------------------------- | ---------- | ---------------- | ------------------------------------ |
| GET /api/Adventures/{id}          | 30s        | 60s              | Adventure state changes infrequently |
| GET /api/characters/{id}          | 10s        | 5s               | HP/conditions change during combat   |
| GET /api/Combats/{id}             | 5s         | 2s               | Combat state changes rapidly         |
| POST /api/Combats/{id}/turns      | N/A        | N/A              | Mutation, invalidates combat cache   |
| POST /api/Combats/{id}/enemy-turn | N/A        | N/A              | Mutation, invalidates combat cache   |
| GET /api/Combats/{id}/actions     | ∞          | None             | History is immutable                 |

---

## Error Handling

### Network Errors

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### User-Facing Error Messages

```typescript
function getErrorMessage(error: APIError): string {
  switch (error.status) {
    case 400:
      return error.detail || "Invalid request. Please try again.";
    case 401:
      return "Session expired. Please log in again.";
    case 404:
      return "Resource not found. It may have been deleted.";
    case 500:
      return "Server error. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}
```

---

## Type Safety

### Type Generation

```bash
npm run generate:api
```

Generated types are imported from:

```typescript
import type {
  AdventureDto,
  CharacterDto,
  CombatStateResponse,
  ResolveTurnRequest,
  CombatHistoryResponse,
} from "../types/api";
```

### Runtime Validation (Optional)

```typescript
import { z } from "zod";

const CombatStateSchema = z.object({
  combatId: z.string().uuid(),
  round: z.number().int().min(1),
  status: z.enum(["active", "victory", "defeat", "fled"]),
  combatants: z.array(
    z.object({
      combatantId: z.string().uuid(),
      name: z.string().min(1),
      currentHp: z.number().int().min(0),
      maxHp: z.number().int().min(1),
    }),
  ),
});

// Use at API boundary
const data = CombatStateSchema.parse(await response.json());
```

---

## Performance Monitoring

### API Call Logging

```typescript
const apiLogger = {
  logRequest: (endpoint: string, method: string) => {
    console.log(`[API] ${method} ${endpoint} - ${Date.now()}`);
  },
  logResponse: (endpoint: string, duration: number, status: number) => {
    console.log(`[API] Response ${status} - ${endpoint} - ${duration}ms`);
  },
};
```

### Response Time Tracking

```typescript
async function fetchWithTiming(url: string, options: RequestInit) {
  const start = Date.now();
  try {
    const response = await fetch(url, options);
    const duration = Date.now() - start;
    apiLogger.logResponse(url, duration, response.status);
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    apiLogger.logResponse(url, duration, 0);
    throw error;
  }
}
```

---

**API Contracts Status**: ✅ **COMPLETE** - All endpoints documented with schemas and integration examples.
