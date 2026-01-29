# Adventure Dashboard API Contracts

**Feature**: Adventure Dashboard  
**Phase**: Phase 1 Design  
**Version**: 1.0.0  
**Date**: 2026-01-29

## Overview

This directory contains the OpenAPI-compliant API contracts that the Adventure Dashboard frontend consumes from the backend. All endpoints follow RESTful conventions and return JSON responses.

## Base Configuration

| Property           | Value                                      |
| ------------------ | ------------------------------------------ |
| **API Base URL**   | `$VITE_API_URL` (environment variable)     |
| **Default**        | `http://localhost:5000` (development)      |
| **Content-Type**   | `application/json`                         |
| **Auth**           | Bearer token (JWT in Authorization header) |
| **Timeout**        | 30 seconds                                 |
| **Retry Strategy** | Exponential backoff (max 3 attempts)       |

## Endpoints

### 1. List Adventures

**Endpoint**: `GET /api/adventures`

**Purpose**: Retrieve all adventures for the authenticated player

**Query Parameters**:

```
status?: 'active' | 'completed' | 'archived'  // Filter by status (optional)
search?: string                                 // Search by name (optional)
page?: number                                   // Page number (default: 1)
pageSize?: number                               // Items per page (default: 50)
sortBy?: 'name' | 'createdAt' | 'lastPlayedAt' // Sort field (default: createdAt)
sortOrder?: 'asc' | 'desc'                      // Sort direction (default: desc)
```

**Request Example**:

```http
GET /api/adventures?status=active&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "The Lost Kingdom",
      "description": "A quest to find the legendary Lost Kingdom",
      "currentSceneId": "scene-001",
      "progress": 45,
      "status": "active",
      "createdAt": "2026-01-29T10:00:00Z",
      "updatedAt": "2026-01-29T14:30:00Z",
      "lastPlayedAt": "2026-01-29T14:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Dragon Slayer",
      "description": "Defeat the ancient dragon",
      "currentSceneId": "scene-final",
      "progress": 100,
      "status": "completed",
      "createdAt": "2026-01-15T09:00:00Z",
      "updatedAt": "2026-01-28T18:00:00Z",
      "lastPlayedAt": "2026-01-28T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "pageSize": 50,
    "hasMore": false
  }
}
```

**Error Response** (401 Unauthorized):

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

**Error Response** (500 Server Error):

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to fetch adventures. Please try again later."
  }
}
```

**Performance SLA**: < 200ms (for typical 50 adventures)

**Frontend Handling**:

- Show loading skeleton while fetching
- Display error message with retry button on failure
- Empty state when array is empty
- Handle network timeout (>30s) with user message

---

### 2. Get Adventure Details

**Endpoint**: `GET /api/adventures/{adventureId}`

**Purpose**: Retrieve detailed information for a specific adventure

**Path Parameters**:

```
adventureId: UUID  // Required: adventure identifier
```

**Request Example**:

```http
GET /api/adventures/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "The Lost Kingdom",
    "description": "A quest to find the legendary Lost Kingdom",
    "currentSceneId": "scene-001",
    "progress": 45,
    "completedObjectives": ["obj-001", "obj-003"],
    "status": "active",
    "createdAt": "2026-01-29T10:00:00Z",
    "updatedAt": "2026-01-29T14:30:00Z",
    "lastPlayedAt": "2026-01-29T14:30:00Z"
  }
}
```

**Error Response** (404 Not Found):

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Adventure not found",
    "details": {
      "adventureId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Error Response** (403 Forbidden):

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this adventure"
  }
}
```

---

### 3. Create Adventure

**Endpoint**: `POST /api/adventures`

**Purpose**: Create a new adventure for the authenticated player

**Request Body**:

```json
{
  "name": "The Lost Kingdom",
  "description": "Optional: A quest to find the legendary Lost Kingdom"
}
```

**Validation Rules**:

```
name:        Required, 1-100 characters, alphanumeric + spaces/hyphens
description: Optional, max 500 characters
```

**Request Example**:

```http
POST /api/adventures
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Dragon Quest",
  "description": "Battle a dragon to save the kingdom"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "Dragon Quest",
    "description": "Battle a dragon to save the kingdom",
    "currentSceneId": "scene-start",
    "progress": 0,
    "status": "active",
    "createdAt": "2026-01-29T15:00:00Z",
    "updatedAt": "2026-01-29T15:00:00Z",
    "lastPlayedAt": null
  }
}
```

**Error Response** (400 Bad Request - Invalid Name):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": [
        "Adventure name is required",
        "Name must not exceed 100 characters"
      ]
    }
  }
}
```

**Error Response** (409 Conflict - Duplicate Name):

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "An adventure with this name already exists",
    "details": {
      "name": ["Please choose a different name"]
    }
  }
}
```

**Error Response** (500 Server Error):

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to create adventure. Please try again later."
  }
}
```

**Frontend Handling**:

- Validate name length before submission
- Show loading indicator during API call
- Display field-specific errors from response
- Close modal and refresh list on success
- Show toast notification: "Adventure created successfully!"
- Handle concurrent submissions (disable button while loading)

---

### 4. Update Adventure

**Endpoint**: `PUT /api/adventures/{adventureId}`

**Purpose**: Update an existing adventure (progress, current scene, etc.)

**Path Parameters**:

```
adventureId: UUID  // Required: adventure identifier
```

**Request Body**:

```json
{
  "name": "Updated Name", // Optional
  "description": "Updated desc", // Optional
  "currentSceneId": "scene-002", // Optional
  "progress": 50, // Optional
  "status": "active" // Optional: 'active', 'completed', 'archived'
}
```

**Request Example**:

```http
PUT /api/adventures/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentSceneId": "scene-002",
  "progress": 50,
  "updatedAt": "2026-01-29T15:30:00Z"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "The Lost Kingdom",
    "currentSceneId": "scene-002",
    "progress": 50,
    "status": "active",
    "updatedAt": "2026-01-29T15:30:00Z",
    "lastPlayedAt": "2026-01-29T15:30:00Z"
  }
}
```

**Note**: Dashboard may not directly call this endpoint - the game screen does. Included for completeness.

---

### 5. Delete Adventure

**Endpoint**: `DELETE /api/adventures/{adventureId}`

**Purpose**: Permanently delete an adventure

**Path Parameters**:

```
adventureId: UUID  // Required: adventure identifier to delete
```

**Request Example**:

```http
DELETE /api/adventures/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Adventure deleted successfully"
}
```

**Error Response** (404 Not Found):

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Adventure not found or already deleted"
  }
}
```

**Error Response** (403 Forbidden):

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to delete this adventure"
  }
}
```

**Error Response** (409 Conflict - Cannot Delete):

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Adventure cannot be deleted while in progress",
    "details": {
      "state": "active"
    }
  }
}
```

**Frontend Handling**:

- Show confirmation dialog before deletion
- Display adventure name in dialog: "Are you sure you want to delete 'The Lost Kingdom'? This action cannot be undone."
- Show loading indicator on delete button during API call
- Remove from list on success
- Show toast notification: "Adventure deleted successfully"
- Show error message on failure with retry option
- Restore adventure from optimistic update if deletion fails

---

## HTTP Status Codes & General Error Handling

| Code    | Scenario                             | Frontend Response                              |
| ------- | ------------------------------------ | ---------------------------------------------- |
| **200** | Successful GET/PUT/DELETE            | Display data, close forms                      |
| **201** | Resource created (POST)              | Show success toast, refresh list               |
| **400** | Invalid request/validation error     | Show field-level error messages                |
| **401** | Unauthorized (token expired/missing) | Redirect to login page                         |
| **403** | Forbidden (no permission)            | Show "Access denied" message                   |
| **404** | Resource not found                   | Show "Not found" message, remove from list     |
| **409** | Conflict (duplicate, invalid state)  | Show specific conflict message                 |
| **500** | Server error                         | Show generic message, retry button             |
| **503** | Service unavailable                  | Show "Service temporarily unavailable" message |

## Rate Limiting & Throttling

| Scenario         | Limit              | Frontend Handling                |
| ---------------- | ------------------ | -------------------------------- |
| List adventures  | 60 requests/minute | Cache with 5-min stale time      |
| Create adventure | 10 requests/minute | Disable button during submission |
| Delete adventure | 10 requests/minute | Disable button during deletion   |
| Select adventure | No limit           | Just navigate                    |

**Rate Limit Headers**:

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**Frontend**: Show user-friendly message if 429 (Too Many Requests) received

---

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

**Token Management**:

- Frontend obtains JWT from login API (handled by authentication module)
- Token stored in memory or secure HttpOnly cookie
- Refresh token mechanism for token rotation (handled by auth module)
- Automatic logout on 401 response

---

## Pagination Strategy

**Cursor-Based Pagination** (for 100+ adventures):

```json
{
  "success": true,
  "data": [...adventures...],
  "pagination": {
    "total": 250,
    "pageSize": 50,
    "hasMore": true,
    "nextCursor": "eyJpZCI6IjU1MGU4NDAwIiwic29ydCI6ImNyZWF0ZWRBdCJ9"
  }
}
```

**Frontend Implementation**:

- Load first page on dashboard mount
- Use "Load More" button or infinite scroll for next pages
- Pass `cursor` query parameter for subsequent requests
- Avoid offset-based pagination (doesn't handle deletions well)

---

## Next Steps (Phase 2)

- [ ] Generate OpenAPI TypeScript types using `openapi-typescript` tool
- [ ] Create API service layer (`src/services/api.ts`) wrapping these contracts
- [ ] Implement TanStack Query hooks based on these endpoints
- [ ] Add error handling/retry logic for network failures
- [ ] Test API mocking with `msw` (Mock Service Worker) in unit tests
- [ ] Integrate with real backend and validate contracts match

---

**Alignment**: All contracts follow REST principles and constitution requirement for user-friendly error messages (no technical jargon). Ready for implementation phase.
