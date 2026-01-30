# API Contracts: Character Management Interface

**Feature**: 008-char-mgmt-ui  
**Date**: January 30, 2026  
**Spec Ref**: `/specs/008-char-mgmt-ui/spec.md`

---

## Overview

These contracts define the HTTP API interactions between the frontend character management interface and the backend character service (feature 003-character-management).

All endpoints follow REST conventions and are documented in `/swagger-openapi.json`. Frontend types are generated via:

```bash
npm run generate:api
# Generates: frontend/src/types/api.ts
```

---

## Endpoints

### 1. Create Character

**Request**:

```
POST /api/characters
Content-Type: application/json
```

**Payload** (from CharacterFormData):

```json
{
  "name": "Gandalf",
  "adventureId": "550e8400-e29b-41d4-a716-446655440000",
  "attributes": {
    "str": 10,
    "dex": 12,
    "int": 18,
    "con": 14,
    "cha": 16
  }
}
```

**Validation** (Backend):

- `name`: Required, 1-50 characters, non-whitespace
- `adventureId`: Must reference existing adventure
- Each attribute: Integer 3-18

**Response** (201 Created):

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Gandalf",
  "adventureId": "550e8400-e29b-41d4-a716-446655440000",
  "attributes": {
    "str": 10,
    "dex": 12,
    "int": 18,
    "con": 14,
    "cha": 16
  },
  "modifiers": {
    "str": 0,
    "dex": 1,
    "int": 4,
    "con": 2,
    "cha": 3
  },
  "createdAt": "2026-01-30T10:30:00Z",
  "updatedAt": "2026-01-30T10:30:00Z"
}
```

**Error Responses**:

- 400 Bad Request: Validation failed (see `errors` object)
- 404 Not Found: Adventure doesn't exist
- 409 Conflict: Character name not unique in adventure (if enforced)

**Frontend Mapping**:

- Input: `CharacterFormData`
- Output: `Character`
- Components: CharacterForm onSubmit
- API Client: `characterApi.createCharacter(data)`

---

### 2. Get Character

**Request**:

```
GET /api/characters/{characterId}
```

**Path Parameters**:

- `characterId`: UUID of character to retrieve

**Response** (200 OK):

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Gandalf",
  "adventureId": "550e8400-e29b-41d4-a716-446655440000",
  "attributes": {
    "str": 10,
    "dex": 12,
    "int": 18,
    "con": 14,
    "cha": 16
  },
  "modifiers": {
    "str": 0,
    "dex": 1,
    "int": 4,
    "con": 2,
    "cha": 3
  },
  "createdAt": "2026-01-30T10:30:00Z",
  "updatedAt": "2026-01-30T10:30:00Z"
}
```

**Error Responses**:

- 404 Not Found: Character doesn't exist

**Frontend Mapping**:

- Output: `Character`
- Components: CharacterSheet page (on load)
- API Client: `characterApi.getCharacter(characterId)`

---

### 3. Update Character

**Request**:

```
PUT /api/characters/{characterId}
Content-Type: application/json
```

**Path Parameters**:

- `characterId`: UUID of character to update

**Payload** (same structure as create):

```json
{
  "name": "Gandalf the Grey",
  "adventureId": "550e8400-e29b-41d4-a716-446655440000",
  "attributes": {
    "str": 10,
    "dex": 12,
    "int": 18,
    "con": 14,
    "cha": 16
  }
}
```

**Validation** (Backend):

- Same as create endpoint
- `characterId` must exist

**Response** (200 OK):

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Gandalf the Grey",
  "adventureId": "550e8400-e29b-41d4-a716-446655440000",
  "attributes": {
    "str": 10,
    "dex": 12,
    "int": 18,
    "con": 14,
    "cha": 16
  },
  "modifiers": {
    "str": 0,
    "dex": 1,
    "int": 4,
    "con": 2,
    "cha": 3
  },
  "createdAt": "2026-01-30T10:30:00Z",
  "updatedAt": "2026-01-30T10:35:00Z"
}
```

**Error Responses**:

- 400 Bad Request: Validation failed
- 404 Not Found: Character doesn't exist
- 409 Conflict: Adventure doesn't exist

**Frontend Mapping**:

- Input: `CharacterFormData`
- Output: `Character`
- Components: CharacterForm (edit mode) onSubmit
- API Client: `characterApi.updateCharacter(characterId, data)`

---

### 4. Delete Character

**Request**:

```
DELETE /api/characters/{characterId}
```

**Path Parameters**:

- `characterId`: UUID of character to delete

**Response** (204 No Content):

```
(empty body)
```

**Error Responses**:

- 404 Not Found: Character doesn't exist

**Frontend Mapping**:

- Components: CharacterSheet (delete button), CharacterList (delete action)
- API Client: `characterApi.deleteCharacter(characterId)`

---

### 5. List Adventure Characters

**Request**:

```
GET /api/adventures/{adventureId}/characters
```

**Path Parameters**:

- `adventureId`: UUID of adventure

**Query Parameters** (optional):

- `skip`: Number of characters to skip (pagination, default 0)
- `take`: Number of characters to return (pagination, default 100)

**Response** (200 OK):

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Gandalf",
    "adventureId": "550e8400-e29b-41d4-a716-446655440000",
    "attributes": {
      "str": 10,
      "dex": 12,
      "int": 18,
      "con": 14,
      "cha": 16
    },
    "modifiers": {
      "str": 0,
      "dex": 1,
      "int": 4,
      "con": 2,
      "cha": 3
    },
    "createdAt": "2026-01-30T10:30:00Z",
    "updatedAt": "2026-01-30T10:30:00Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440111",
    "name": "Frodo",
    "adventureId": "550e8400-e29b-41d4-a716-446655440000",
    "attributes": {
      "str": 8,
      "dex": 14,
      "int": 12,
      "con": 12,
      "cha": 14
    },
    "modifiers": {
      "str": -1,
      "dex": 2,
      "int": 1,
      "con": 1,
      "cha": 2
    },
    "createdAt": "2026-01-30T10:35:00Z",
    "updatedAt": "2026-01-30T10:35:00Z"
  }
]
```

**Error Responses**:

- 404 Not Found: Adventure doesn't exist

**Frontend Mapping**:

- Output: `Character[]` (convert to `CharacterListItem[]`)
- Components: CharacterList, CharacterSelector
- API Client: `characterApi.getAdventureCharacters(adventureId)`

---

## Type Definitions

Frontend TypeScript types (generated from OpenAPI):

```typescript
// Request types
interface CreateCharacterRequest {
  name: string;
  adventureId: string;
  attributes: {
    str: number;
    dex: number;
    int: number;
    con: number;
    cha: number;
  };
}

interface UpdateCharacterRequest extends CreateCharacterRequest {}

// Response types
interface CharacterResponse {
  id: string;
  name: string;
  adventureId: string;
  attributes: {
    str: number;
    dex: number;
    int: number;
    con: number;
    cha: number;
  };
  modifiers: {
    str: number;
    dex: number;
    int: number;
    con: number;
    cha: number;
  };
  createdAt: string;
  updatedAt: string;
}

type CharacterListResponse = CharacterResponse[];

// Error response
interface ErrorResponse {
  error: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
```

---

## HTTP Status Codes & Error Handling

| Status | Meaning            | Frontend Handling                                   |
| ------ | ------------------ | --------------------------------------------------- |
| 200    | Success (GET, PUT) | Parse response, update state                        |
| 201    | Created (POST)     | Parse response, navigate to sheet                   |
| 204    | Success (DELETE)   | Confirm deletion, refresh list                      |
| 400    | Validation failed  | Display field-level errors in form                  |
| 404    | Not found          | Show "Character not found" error                    |
| 409    | Conflict           | Show "Name already exists" or "Adventure not found" |
| 500    | Server error       | Show generic "Something went wrong" message         |

**Error Display**:

```typescript
interface ApiError {
  statusCode: number;
  message: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

// Frontend displays user-friendly messages:
// 400 → Display field errors in form
// 404 → "Character not found. Please try again."
// 500 → "Something went wrong. Please try again later."
```

---

## Request/Response Timing

| Operation        | Target | Typical | P95    |
| ---------------- | ------ | ------- | ------ |
| Create           | <200ms | ~150ms  | <300ms |
| Get              | <200ms | ~100ms  | <250ms |
| Update           | <200ms | ~150ms  | <300ms |
| Delete           | <200ms | ~50ms   | <150ms |
| List (10 chars)  | <200ms | ~100ms  | <250ms |
| List (100 chars) | <200ms | ~150ms  | <350ms |

**Frontend SLA**: All API calls complete within 2 seconds (including network latency), with loading indicators displayed after 500ms.

---

## API Client Implementation

The frontend API client is implemented in `frontend/src/services/characterApi.ts`:

```typescript
export class CharacterApiService {
  async createCharacter(data: CreateCharacterRequest): Promise<Character> {}
  async getCharacter(characterId: string): Promise<Character> {}
  async updateCharacter(
    characterId: string,
    data: UpdateCharacterRequest,
  ): Promise<Character> {}
  async deleteCharacter(characterId: string): Promise<void> {}
  async getAdventureCharacters(adventureId: string): Promise<Character[]> {}
}

// Used with React Query for caching and state management
export const useCharacterQuery = new useQuery<Character>({
  queryKey: ["character", characterId],
  queryFn: () => api.getCharacter(characterId),
  staleTime: 5 * 60 * 1000, // 5 minute cache
});
```

---

## Caching Strategy

| Endpoint                                     | Cache Duration | Invalidation                                |
| -------------------------------------------- | -------------- | ------------------------------------------- |
| GET /api/characters/{id}                     | 5 minutes      | On update/delete of that character          |
| GET /api/adventures/{adventureId}/characters | 1 minute       | On create/update/delete any character       |
| POST /api/characters                         | No cache       | Adds new entry, invalidates list cache      |
| PUT /api/characters/{id}                     | No cache       | Updates cached item, invalidates list cache |
| DELETE /api/characters/{id}                  | No cache       | Removes from cache, invalidates list cache  |

---

**API Contracts Complete**  
**Ready for Component Implementation**
