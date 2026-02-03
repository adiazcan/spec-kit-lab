# Quest API Contract

**Version**: 1.0 | **Status**: Documented from existing backend (QuestsController, ProgressController)

## REST API Endpoints

### 1. List Quests (Paginated)

**Endpoint**: `GET /api/adventures/{adventureId}/quests`

```
GET /api/adventures/adv-123/quests?skip=0&limit=20&difficulty=Medium
```

**Parameters**:

- `adventureId` (path, required, UUID): Adventure ID
- `skip` (query, optional, int): Pagination offset (default: 0)
- `limit` (query, optional, int): Items per page (default: 20, max: 50)
- `difficulty` (query, optional, string): Filter by difficulty level

**Response (200 OK)**:

```json
{
  "items": [
    {
      "questId": "q1-uuid",
      "questName": "Save the Village",
      "questDescription": "The village is under attack...",
      "questGiver": "Village Elder",
      "difficulty": "Medium",
      "estimatedDuration": 30
    }
  ],
  "totalCount": 42,
  "skip": 0,
  "limit": 20
}
```

**Error Responses**:

- `404 Not Found`: Adventure not found
- `400 Bad Request`: Invalid skip/limit values

---

### 2. Get Quest Progress (Details)

**Endpoint**: `GET /api/adventures/{adventureId}/quests/{questId}/progress`

```
GET /api/adventures/adv-123/quests/q1-uuid/progress?playerId=p1-uuid
```

**Parameters**:

- `adventureId` (path, required, UUID): Adventure ID
- `questId` (path, required, UUID): Quest ID
- `playerId` (query, optional, UUID): Player ID (current player if omitted)

**Response (200 OK)**:

```json
{
  "questProgressId": "qp1-uuid",
  "questId": "q1-uuid",
  "playerId": "p1-uuid",
  "questName": "Save the Village",
  "questDescription": "The village is under attack...",
  "currentStageNumber": 2,
  "totalStages": 3,
  "progressPercentage": 66.7,
  "status": "Active",
  "currentStage": {
    "stageNumber": 2,
    "title": "Defend the Town Square",
    "description": "Fight off the invaders...",
    "isCompleted": false,
    "objectives": [
      {
        "objectiveId": "o1-uuid",
        "description": "Defeat 5 enemies",
        "conditionType": "Defeat",
        "currentProgress": 3,
        "targetAmount": 5,
        "isCompleted": false,
        "progressPercentage": 60.0
      },
      {
        "objectiveId": "o2-uuid",
        "description": "Rescue 3 villagers",
        "conditionType": "Rescue",
        "currentProgress": 3,
        "targetAmount": 3,
        "isCompleted": true,
        "progressPercentage": 100.0
      }
    ]
  },
  "acceptedAt": "2026-02-01T14:30:00Z",
  "completedAt": null,
  "failedAt": null,
  "abandonedAt": null
}
```

**Error Responses**:

- `404 Not Found`: Adventure or quest not found
- `401 Unauthorized`: Player not authorized to view quest

---

### 3. Get Active Quests for Player

**Endpoint**: `GET /api/adventures/{adventureId}/players/{playerId}/quests/active`

```
GET /api/adventures/adv-123/players/p1-uuid/quests/active
```

**Parameters**:

- `adventureId` (path, required, UUID): Adventure ID
- `playerId` (path, required, UUID): Player ID

**Response (200 OK)**:

```json
[
  {
    "questProgressId": "qp1-uuid",
    "questId": "q1-uuid",
    "playerId": "p1-uuid",
    "questName": "Save the Village",
    "questDescription": "...",
    "currentStageNumber": 2,
    "totalStages": 3,
    "progressPercentage": 66.7,
    "status": "Active",
    "currentStage": {
      /* ... */
    },
    "acceptedAt": "2026-02-01T14:30:00Z",
    "completedAt": null,
    "failedAt": null,
    "abandonedAt": null
  },
  {
    /* Additional quests... */
  }
]
```

**Error Responses**:

- `404 Not Found`: Adventure or player not found
- `400 Bad Request`: Invalid player ID

---

### 4. Get Quest Dependencies

**Endpoint**: `GET /api/adventures/{adventureId}/quests/{questId}/dependencies`

```
GET /api/adventures/adv-123/quests/q1-uuid/dependencies?playerId=p1-uuid
```

**Parameters**:

- `adventureId` (path, required, UUID): Adventure ID
- `questId` (path, required, UUID): Quest ID
- `playerId` (query, optional, UUID): Player ID (to check if prerequisites met)

**Response (200 OK)**:

```json
{
  "questId": "q1-uuid",
  "prerequisites": [
    {
      "prerequisiteQuestId": "q0-uuid",
      "questName": "Meet the Elder",
      "dependencyType": "RequiredBefore",
      "playerStatus": "Completed"
    },
    {
      "prerequisiteQuestId": "q0-uuid",
      "questName": "Gather Supplies",
      "dependencyType": "UnlockedBy",
      "playerStatus": "Completed"
    }
  ],
  "allPrerequisitesMet": true
}
```

**Error Responses**:

- `404 Not Found`: Adventure or quest not found

---

### 5. Accept Quest

**Endpoint**: `POST /api/adventures/{adventureId}/quests/{questId}/accept`

```
POST /api/adventures/adv-123/quests/q1-uuid/accept
Content-Type: application/json

{
  "playerId": "p1-uuid"
}
```

**Request Body**:

```typescript
{
  playerId: string; // UUID of player accepting quest
}
```

**Response (201 Created)**:

```json
{
  "questProgressId": "qp1-uuid",
  "questId": "q1-uuid",
  "playerId": "p1-uuid",
  "questName": "Save the Village",
  "questDescription": "...",
  "currentStageNumber": 1,
  "totalStages": 3,
  "progressPercentage": 0.0,
  "status": "Active",
  "currentStage": {
    /* ... */
  },
  "acceptedAt": "2026-02-03T10:15:00Z",
  "completedAt": null,
  "failedAt": null,
  "abandonedAt": null
}
```

**Error Responses**:

- `400 Bad Request`: Invalid request or prerequisites not met
- `404 Not Found`: Adventure or quest not found
- `409 Conflict`: Quest already accepted by player
- `422 Unprocessable Content`: Business logic validation failed (e.g., max active quests reached)

---

### 6. Abandon Quest

**Endpoint**: `POST /api/adventures/{adventureId}/quests/{questId}/abandon`

```
POST /api/adventures/adv-123/quests/qp1-uuid/abandon
Content-Type: application/json

{
  "playerId": "p1-uuid"
}
```

**Request Body**:

```typescript
{
  playerId: string; // UUID of player abandoning quest
}
```

**Response (204 No Content)**:

- No response body on success

**Error Responses**:

- `404 Not Found`: Adventure, quest, or player's quest progress not found
- `409 Conflict`: Quest is not in Active state

---

## Error Response Format

All error responses follow this format:

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Quest Not Found",
  "status": 404,
  "detail": "Quest with ID 'invalid-id' not found in adventure 'adv-123'",
  "traceId": "0HLVFC1H0AB8D:00000001"
}
```

## Performance SLAs

| Endpoint          | P50  | P95  | P99   |
| ----------------- | ---- | ---- | ----- |
| List Quests       | 15ms | 45ms | 80ms  |
| Get Progress      | 10ms | 30ms | 50ms  |
| Get Active Quests | 12ms | 35ms | 60ms  |
| Get Dependencies  | 5ms  | 20ms | 35ms  |
| Accept Quest      | 20ms | 60ms | 100ms |
| Abandon Quest     | 15ms | 50ms | 80ms  |

**Target**: All endpoints <200ms P95 ✅

## Versioning

- **Current Version**: 1.0 (as of 2026-02-03)
- **Stability**: Stable - no breaking changes planned in next release
- **Deprecation Policy**: 6-month notice for any breaking changes
- **Backwards Compatibility**: Maintained for all current endpoint versions
