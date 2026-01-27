# Data Model: Adventure Initialization System

**Feature**: 002-adventure-init  
**Status**: Phase 1 Complete  
**Date**: 2026-01-27

---

## Domain Entities

### Adventure (Aggregate Root)

**Namespace**: `DiceEngine.Domain.Entities`  
**Status**: Core entity for feature

**Purpose**: Represents a single text adventure instance and serves as the aggregate root for adventure state management.

**Fields**:

| Field | Type | Constraints | Purpose |
|-------|------|-----------|---------|
| **Id** | Guid | PK, Not Null | Unique identifier for adventure; generated server-side |
| **CurrentSceneId** | string | Not Null, Max 100 | Currently active scene identifier (e.g., "scene_forest_entrance") |
| **GameState** | JSONB | Not Null | Flexible JSON object containing inventory, progress flags, variables, story state |
| **CreatedAt** | DateTime | Not Null, UTC | Timestamp when adventure was initialized |
| **LastUpdatedAt** | DateTime | Not Null, UTC | Timestamp of last state modification |

**Relationships**:
- One-to-many implicit via GameState JSON (no foreign keys required)
- Scene references are by ID string, not object references (denormalized)
- User ID stored in context/claims, not in Adventure entity

**Validation Rules**:
- Id must be non-null and unique (enforced by database)
- CurrentSceneId cannot be null or empty
- CreatedAt cannot be modified after creation
- GameState cannot be null (minimum: empty JSON object `{}`)
- LastUpdatedAt must be >= CreatedAt

**State Transitions**:
```
Created [CreatedAt] → Active [any timestamp] → Deleted [via API DELETE]
Last Modified tracked in LastUpdatedAt on every update
```

**Example Instance**:
```csharp
{
  Id: Guid("550e8400-e29b-41d4-a716-446655440000"),
  CurrentSceneId: "scene_tavern_start",
  GameState: {
    inventory: ["dagger", "scroll"],
    health: 100,
    gold: 50,
    visited_scenes: ["scene_tavern_start", "scene_forest_entrance"],
    quest_flags: {
      "merchant_quest_accepted": true,
      "dragon_defeated": false
    }
  },
  CreatedAt: DateTime(2026-01-27T10:30:00Z),
  LastUpdatedAt: DateTime(2026-01-27T10:35:00Z)
}
```

---

### GameState (Value Object)

**Namespace**: `DiceEngine.Domain.ValueObjects`  
**Status**: Supports flexible game state model

**Purpose**: Encapsulates game state as an immutable structure. Stored as JSONB in database but typed in application layer.

**Structure** (C# class):
```csharp
public class GameState
{
    public Dictionary<string, object> State { get; private set; }
    
    public GameState(Dictionary<string, object> state = null)
    {
        State = state ?? new Dictionary<string, object>();
    }
    
    public object GetValue(string key) => State?.ContainsKey(key) ?? false ? State[key] : null;
    public void SetValue(string key, object value) => State[key] = value;
}
```

**Common Fields** (conventions, not enforced):
- `inventory` (List<string>) - player items
- `health` (int) - hitpoints or health status
- `gold` (int) - currency
- `level` (int) - character level
- `experience` (int) - accumulated experience
- `visited_scenes` (List<string>) - scene history
- `flags` (Dictionary<string, bool>) - quest/story progression flags
- `variables` (Dictionary<string, object>) - game-specific variables

**Notes**:
- No schema validation enforced at entity level
- Game designers define valid fields per adventure type
- Can evolve independently without database migrations
- Supports arbitrary nesting (objects, arrays, primitives)

---

## Database Schema

### Adventure Table

```sql
CREATE TABLE adventures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_scene_id VARCHAR(100) NOT NULL,
    game_state JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit/indexing
    CONSTRAINT current_scene_id_not_empty CHECK (length(current_scene_id) > 0),
    CONSTRAINT game_state_not_null CHECK (game_state IS NOT NULL)
);

-- Indexes for common queries
CREATE INDEX idx_adventures_created_at ON adventures(created_at DESC);
CREATE INDEX idx_adventures_last_updated_at ON adventures(last_updated_at DESC);
CREATE INDEX idx_adventures_current_scene_id ON adventures(current_scene_id);

-- JSONB index for potential future queries on game state
CREATE INDEX idx_adventures_game_state_gin ON adventures USING GIN(game_state);
```

**Rationale for Design**:
- UUID primary key for distributed/federation scenarios
- JSONB chosen for flexibility and queryability
- Temporal indexes support common sorting operations
- GIN index on JSONB allows future field-specific queries
- Constraints ensure data integrity at database level

---

## Entity Lifecycle

### Adventure Creation (New)
1. Client sends POST `/api/adventures` with optional initial GameState
2. Service generates new Guid for Id
3. Server sets CreatedAt to current UTC timestamp
4. Service initializes default GameState if none provided:
   ```json
   {
     "inventory": [],
     "health": 100,
     "visited_scenes": ["scene_start"],
     "flags": {},
     "variables": {}
   }
   ```
5. CurrentSceneId set to default (e.g., "scene_tavern_start" or configurable)
6. Repository persists to database
7. Response includes full Adventure object with generated Id and timestamps

### Adventure Retrieval
1. Client sends GET `/api/adventures/{id}`
2. Service queries repository by Id
3. If found: Return Adventure with all state
4. If not found: Return 404 Not Found

### Adventure Update
1. Client sends PUT `/api/adventures/{id}` with updated CurrentSceneId and/or GameState
2. Service loads existing Adventure
3. Service updates only provided fields (merge with existing GameState, not replace)
4. Service sets LastUpdatedAt to current UTC timestamp
5. Repository persists changes
6. Response includes updated Adventure

### Adventure Deletion
1. Client sends DELETE `/api/adventures/{id}`
2. Service verifies Adventure exists (404 if not)
3. Service deletes record from database (hard delete)
4. Response: 204 No Content

### Adventure List
1. Client sends GET `/api/adventures?page=1&limit=20`
2. Service queries database with pagination
3. Returns paginated result with count and hasMore flag
4. Each adventure includes all fields

---

## Concurrency Strategy

**Optimistic Concurrency Control** (future enhancement):

Current design uses no concurrency control (last-write-wins). For stronger consistency:

1. Add `RowVersion` column to Adventure:
   ```sql
   ALTER TABLE adventures ADD COLUMN row_version BIGINT DEFAULT 0;
   ```

2. On UPDATE, include row_version in WHERE clause:
   ```sql
   UPDATE adventures 
   SET game_state = $1, last_updated_at = NOW(), row_version = row_version + 1
   WHERE id = $2 AND row_version = $3
   ```

3. If no rows affected → 409 Conflict (stale data)
4. Client retries with fresh Adventure data

**Rationale**: Prevents lost updates in high-concurrency scenarios. Can be added after MVP if needed.

---

## Validation Rules (Entity Level)

| Rule | Trigger | Consequence |
|------|---------|-------------|
| CurrentSceneId empty | Create or Update | 400 Bad Request |
| GameState null | Create or Update | 400 Bad Request |
| GameState exceeds 1MB | Create or Update | 413 Payload Too Large |
| Id not Guid format | Any operation | 400 Bad Request |
| CreatedAt modified | Update attempt | 400 Bad Request (read-only) |

---

## Migration Strategy

**Phase 1 (Current)**: 
- Create adventures table with schema above
- No migrations needed if this is initial feature

**Phase 2+ (Future)**:
- If GameState schema becomes too rigid, consider extracting frequently-queried fields to top-level columns
- If adventure count exceeds 10M, consider sharding by created_at ranges
- If concurrent updates become issue, implement optimistic locking

---

## References

- See [spec.md](./spec.md) for functional requirements driving this model
- See [research.md](./research.md) for design decisions and alternatives
- See [contracts/openapi.yaml](./contracts/openapi.yaml) for API request/response schemas
