# Frontend Inventory UI - API Contract

**Date**: 2026-02-02  
**Purpose**: Document the API contract expected by Frontend Inventory UI from the backend 004-inventory-system  
**Status**: Specification Phase 1  
**Backend Reference**: `/specs/004-inventory-system/contracts/openapi.yaml`

---

## API Endpoints Required

The Inventory UI frontend depends on the following REST endpoints from the backend 004-inventory-system API:

### Inventory Management

#### GET /api/adventures/{adventureId}/inventory

**Purpose**: Retrieve all inventory items for a given adventure

**Query Parameters**:

- `limit` (integer, optional): Number of items to return (default: 50, max: 100)
- `offset` (integer, optional): Pagination offset (default: 0)

**Response (200 OK)**:

```json
{
  "adventureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "entries": [
    {
      "id": "entry-id-1",
      "item": {
        "id": "item-id-1",
        "name": "Healing Potion",
        "description": "Restores 50 HP",
        "rarity": "Common",
        "itemType": "Stackable",
        "maxStackSize": 100
      },
      "quantity": 8,
      "addedAt": "2026-01-29T10:30:00Z"
    },
    {
      "id": "entry-id-2",
      "item": {
        "id": "item-id-2",
        "name": "Iron Longsword",
        "description": "A sturdy blade",
        "rarity": "Uncommon",
        "itemType": "Unique",
        "slotType": "MainHand",
        "modifiers": [
          {
            "statName": "Attack",
            "value": 2
          }
        ]
      },
      "quantity": 1,
      "addedAt": "2026-01-29T11:00:00Z"
    }
  ],
  "totalEntries": 2,
  "limit": 50,
  "offset": 0
}
```

**Frontend Usage**:

```typescript
const { data: inventory } = useQuery({
  queryKey: ["inventory", adventureId],
  queryFn: () => inventoryClient.getInventory(adventureId, 50, 0),
});
```

---

#### POST /api/adventures/{adventureId}/inventory

**Purpose**: Add an item to inventory (not typically called from UI, but provided for completeness)

**Request Body**:

```json
{
  "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quantity": 5
}
```

**Response (201 Created)**:

```json
{
  "entryId": "entry-id-3",
  "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quantity": 5,
  "merged": false
}
```

---

#### DELETE /api/adventures/{adventureId}/inventory/{entryId}

**Purpose**: Remove an item from inventory (used for drop functionality)

**Response (204 No Content)**: No body

**Frontend Usage**:

```typescript
const dropItemMutation = useMutation({
  mutationFn: (entryId) => inventoryClient.removeItem(adventureId, entryId),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
});
```

---

### Equipment Management

#### GET /api/adventures/{adventureId}/equipment

**Purpose**: Retrieve all currently equipped items for character

**Response (200 OK)**:

```json
{
  "adventureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "slots": {
    "Head": {
      "itemId": "helmet-id-1",
      "item": {
        "id": "helmet-id-1",
        "name": "Iron Helmet",
        "rarity": "Common",
        "itemType": "Unique",
        "slotType": "Head",
        "modifiers": [{ "statName": "Defense", "value": 1 }]
      },
      "equippedAt": "2026-01-29T12:00:00Z"
    },
    "Chest": null,
    "Hands": null,
    "Legs": null,
    "Feet": null,
    "MainHand": {
      "itemId": "sword-id-1",
      "item": {
        "id": "sword-id-1",
        "name": "Iron Longsword",
        "rarity": "Uncommon",
        "itemType": "Unique",
        "slotType": "MainHand",
        "modifiers": [{ "statName": "Attack", "value": 2 }]
      },
      "equippedAt": "2026-01-29T11:30:00Z"
    },
    "OffHand": null
  },
  "totalStatModifiers": {
    "Attack": 2,
    "Defense": 1
  }
}
```

**Frontend Usage**:

```typescript
const { data: equipment } = useQuery({
  queryKey: ["equipment", adventureId],
  queryFn: () => equipmentClient.getEquippedItems(adventureId),
});
```

---

#### PUT /api/adventures/{adventureId}/equipment/{slotType}

**Purpose**: Equip an item to a specific slot

**Path Parameters**:

- `slotType`: Head | Chest | Hands | Legs | Feet | MainHand | OffHand

**Request Body**:

```json
{
  "itemId": "armor-id-1"
}
```

**Response (200 OK)**:

```json
{
  "slotType": "Chest",
  "itemId": "armor-id-1",
  "item": {
    "id": "armor-id-1",
    "name": "Iron Chestplate",
    "rarity": "Uncommon",
    "itemType": "Unique",
    "slotType": "Chest",
    "modifiers": [{ "statName": "Defense", "value": 3 }]
  },
  "equippedAt": "2026-02-02T10:00:00Z",
  "previousItem": null,
  "statModifierDelta": { "Defense": 3 }
}
```

**Frontend Usage** (Drag-and-Drop):

```typescript
const equipMutation = useMutation({
  mutationFn: ({ itemId, slotType }) =>
    equipmentClient.equipItem(adventureId, itemId, slotType),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
  },
});
```

**Validation**: Backend MUST return 400 Bad Request if:

- Item is not equippable (itemType is Stackable)
- Item does not match slot type (e.g., weapon to Chest slot)
- Item is already equipped elsewhere (cannot equip same item twice)
- Inventory space issue when unequipping current item to inventory

---

#### DELETE /api/adventures/{adventureId}/equipment/{slotType}

**Purpose**: Unequip an item from a slot (reverse of PUT)

**Path Parameters**:

- `slotType`: Head | Chest | Hands | Legs | Feet | MainHand | OffHand

**Response (200 OK)**:

```json
{
  "slotType": "Chest",
  "previousItemId": "armor-id-1",
  "inventoryEntryId": "new-entry-id",
  "statModifierDelta": { "Defense": -3 }
}
```

**Frontend Usage** (Unequip Button):

```typescript
const unequipMutation = useMutation({
  mutationFn: (slotType) => equipmentClient.unequipItem(adventureId, slotType),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
  },
});
```

**Validation**: Backend MUST return 400 Bad Request if:

- Slot is empty (already unequipped)
- Inventory is full (no space to move item back to inventory)

---

### Item Usage (Consumables)

#### POST /api/adventures/{adventureId}/inventory/{entryId}/use

**Purpose**: Use a consumable item (potion, scroll, etc.)

**Request Body**: (empty or optional flags)

```json
{
  "count": 1
}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "itemName": "Healing Potion",
  "effectApplied": {
    "type": "HealCharacter",
    "value": 50,
    "characterId": "..."
  },
  "remainingQuantity": 7,
  "removedFromInventory": false
}
```

**Error Response (400 Bad Request)**:

```json
{
  "error": "Item requirements not met",
  "details": "Minimum level 10 required, current level 5"
}
```

**Frontend Usage**:

```typescript
const useItemMutation = useMutation({
  mutationFn: (entryId) => inventoryClient.useItem(adventureId, entryId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    // Character stats may have changed, optionally invalidate character query
  },
});
```

**Validation**: Backend MUST return 400 Bad Request if:

- Item is not consumable (itemType is not Stackable or has no use effect)
- Character does not meet requirements (level, class, quest completion)
- Character is in invalid state (dead, out of combat when usage requires combat, etc.)
- Stack quantity is 0 or invalid

---

## Real-Time Synchronization Patterns

### Option 1: Mutation-Based Invalidation (Current Implementation)

Frontend mutations trigger backend updates, then invalidate React Query cache:

```
User Action (drag item to slot)
  ↓
Mutation: equipItem(itemId, slotType)
  ↓
Backend: Update equipment slot + inventory
  ↓
Frontend: queryClient.invalidateQueries(['inventory']) + ['equipment']
  ↓
Auto-refresh: React Query fetches fresh data from GET endpoints
```

**Timing**: 50-100ms total (network + re-render within spec requirement)

### Option 2: WebSocket Events (Future Enhancement)

If real-time sync is needed for multiplayer or server-driven changes:

```
Backend emits event: InventoryChanged { adventureId, entryId, operation: 'added' | 'removed' }
Frontend WebSocket listener:
  Subscribe: ws://localhost:5000/events?adventureId={id}
  onMessage: Invalidate cache or update state directly
```

**Not required for MVP**, but architecture can support it by adding WebSocket listener to hooks.

---

## Error Handling Contract

All error responses follow standard REST error format:

### Error Response Schema

```json
{
  "statusCode": 400,
  "message": "Item is not equippable",
  "details": "Item type 'Stackable' cannot be equipped to slots",
  "traceId": "0HN1GJ1234567:0"
}
```

### Expected Status Codes

| Code | Scenario     | Frontend Action                                      |
| ---- | ------------ | ---------------------------------------------------- |
| 200  | Success      | Invalidate cache, show success toast                 |
| 201  | Created      | Invalidate cache, refresh data                       |
| 204  | No content   | Operation succeeded, cache invalidation sufficient   |
| 400  | Bad request  | Parse error details, show user-friendly message      |
| 401  | Unauthorized | Redirect to login (shouldn't happen in same session) |
| 404  | Not found    | Item/adventure doesn't exist, show error message     |
| 500  | Server error | Show generic error message, log to monitoring        |

**Frontend Error Handling**:

```typescript
const equipMutation = useMutation({
  mutationFn: ...,
  onError: (error) => {
    if (error.statusCode === 400) {
      showErrorToast(`Cannot equip: ${error.details}`);
    } else if (error.statusCode === 404) {
      showErrorToast('Item no longer available');
    } else {
      showErrorToast('Server error. Please try again.');
    }
  }
});
```

---

## Performance Requirements

| Operation                          | Max Duration | Target | Notes                              |
| ---------------------------------- | ------------ | ------ | ---------------------------------- |
| GET /inventory                     | 200ms        | <100ms | Includes network roundtrip         |
| GET /equipment                     | 200ms        | <100ms | Includes network roundtrip         |
| PUT /equipment/{slot} (equip)      | 200ms        | <100ms | Backend + frontend UI update       |
| DELETE /equipment/{slot} (unequip) | 200ms        | <100ms | Backend + frontend UI update       |
| POST /inventory/{entry}/use        | 200ms        | <100ms | Effect resolution + backend update |
| Sort/Filter (100 items)            | 200ms        | <200ms | Client-side; no network            |

---

## Type Contracts (TypeScript Interfaces)

Generated and maintained by `npm run generate:api` (OpenAPI → TypeScript):

```typescript
// File: src/types/api.ts (auto-generated)

export interface InventoryResponse {
  adventureId: string;
  entries: InventoryEntry[];
  totalEntries: number;
  limit: number;
  offset: number;
}

export interface InventoryEntry {
  id: string;
  item: Item;
  quantity: number;
  addedAt: Date;
}

export type Item = StackableItem | UniqueItem;

export interface StackableItem {
  id: string;
  name: string;
  description?: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  itemType: "Stackable";
  maxStackSize: number;
}

export interface UniqueItem {
  id: string;
  name: string;
  description?: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  itemType: "Unique";
  slotType?:
    | "Head"
    | "Chest"
    | "Hands"
    | "Legs"
    | "Feet"
    | "MainHand"
    | "OffHand";
  modifiers?: StatModifier[];
}

export interface StatModifier {
  statName: string;
  value: number;
}

// Equipment response
export interface EquipmentResponse {
  adventureId: string;
  slots: Record<SlotType, EquippedItem | null>;
  totalStatModifiers: Record<string, number>;
}

export interface EquippedItem {
  itemId: string;
  item: UniqueItem;
  equippedAt: Date;
}

export type SlotType =
  | "Head"
  | "Chest"
  | "Hands"
  | "Legs"
  | "Feet"
  | "MainHand"
  | "OffHand";
export type ItemRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
```

---

## Breaking Changes & Versioning

If backend 004-inventory-system API changes:

1. Update OpenAPI schema in `/specs/004-inventory-system/contracts/openapi.yaml`
2. Run `npm run generate:api` in frontend to update types
3. TypeScript compilation will catch incompatibilities
4. Frontend updates types automatically, tests validate compatibility

For backward compatibility, backend MUST:

- Support `limit` and `offset` query parameters (pagination)
- Return complete Item object in all responses (no partial objects)
- Always return `totalStatModifiers` in Equipment response
- Maintain SlotType and ItemRarity enum values
