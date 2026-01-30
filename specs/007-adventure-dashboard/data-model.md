# Data Model: Adventure Dashboard

**Feature**: Adventure Dashboard  
**Phase**: Phase 1 Design  
**Date**: 2026-01-29  
**Status**: Complete

## Overview

This document defines the data entities, schemas, relationships, and validation rules for the Adventure Dashboard frontend. All types are derived from the backend OpenAPI specification.

---

## Core Entity: Adventure

The `Adventure` entity represents a player's saved game session with metadata about progression and timestamps.

### Entity Definition

```typescript
interface Adventure {
  // Unique identifier
  id: string; // UUID format

  // Player context
  playerId: string; // UUID of owning player

  // Adventure metadata
  name: string; // 1-100 characters, user-defined
  description?: string; // Optional adventure description

  // Progression state
  currentSceneId: string; // Current location in game world
  progress: number; // 0-100, percentage of completion
  completedObjectives?: string[]; // Array of objective IDs

  // Timestamps
  createdAt: ISO8601String; // RFC3339 format
  updatedAt: ISO8601String; // RFC3339 format
  lastPlayedAt?: ISO8601String; // Optional: when player last played

  // Status indicator
  status: "active" | "completed" | "archived";
}
```

### Validation Rules

| Field            | Constraints                             | Error Message                                                        |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `name`           | Required; 1-100 chars                   | "Adventure name is required" / "Name must be 100 characters or less" |
| `currentSceneId` | Required; valid UUID                    | "Invalid scene reference"                                            |
| `progress`       | Integer; 0-100                          | "Progress must be between 0 and 100"                                 |
| `playerId`       | UUID format; matches authenticated user | "Unauthorized: adventure belongs to different player"                |
| `createdAt`      | ISO8601; UTC timezone                   | "Invalid timestamp format"                                           |

---

## Component Data Flow

### AdventureList Component

**Input Props**:

```typescript
interface AdventureListProps {
  isLoading?: boolean;
  error?: Error | null;
  adventures: Adventure[];
  onSelectAdventure: (adventure: Adventure) => void;
  onDeleteAdventure: (adventureId: string) => void;
  onCreateAdventure: () => void;
}
```

**Local State**:

```typescript
interface AdventureListState {
  filter: "all" | "active" | "completed" | "archived";
  sortBy: "name" | "createdAt" | "lastPlayedAt";
  searchQuery: string;
  selectedAdventures: Set<string>; // Multi-select (future enhancement)
}
```

**Output Events**:

- `onSelectAdventure(adventure)` → Navigate to game with adventure loaded
- `onDeleteAdventure(id)` → Remove adventure from list (after confirmation)
- `onCreateAdventure()` → Open create form modal

---

### AdventureCard Component

**Input Props**:

```typescript
interface AdventureCardProps {
  adventure: Adventure;
  isLoading?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}
```

**Displays**:

- Adventure name
- Created date (formatted as "Jan 29, 2026")
- Progress bar (0-100%)
- Last played timestamp (if available)
- Hover/focus indicators for interactive elements

---

### CreateAdventureForm Component

**Input Props**:

```typescript
interface CreateAdventureFormProps {
  isLoading: boolean;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}
```

**Form Fields**:

```typescript
interface CreateAdventureFormData {
  name: string; // User input (1-100 chars)
  // description?: string; // Future: optional description
}
```

**Validation**:

- Real-time validation on blur
- Submit button disabled if form invalid or loading
- Clear error messages beneath each field

**Output Events**:

- `onSubmit(name)` → Call create API, close form on success
- `onCancel()` → Close form without changes

---

### ConfirmDialog Component

**Input Props**:

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // Default: "Confirm"
  cancelText?: string; // Default: "Cancel"
  isDangerous?: boolean; // Red color if true (delete operation)
  isLoading: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

**Example Usage** (Delete Adventure):

```typescript
<ConfirmDialog
  isOpen={showDeleteConfirm}
  title="Delete Adventure"
  message={`Are you sure you want to delete "${adventure.name}"? This action cannot be undone.`}
  confirmText="Delete"
  isDangerous={true}
  isLoading={isDeleting}
  onConfirm={handleConfirmDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

### LoadingSkeleton Component

**Input Props**:

```typescript
interface LoadingSkeletonProps {
  count?: number; // Number of skeleton cards (default: 3)
  variant?: "card" | "list" | "form";
  className?: string; // Additional Tailwind classes
}
```

**Skeleton Layouts**:

- **card**: Skeleton of adventure card (name, date, progress bar)
- **list**: Multiple card skeletons in grid
- **form**: Loading skeleton for form fields

---

## API Response Schemas

### List Adventures Response

```typescript
interface ListAdventuresResponse {
  success: boolean;
  data: Adventure[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    nextCursor?: string; // For cursor-based pagination
  };
}
```

### Create Adventure Request/Response

**Request**:

```typescript
interface CreateAdventureRequest {
  name: string; // 1-100 characters
}
```

**Response** (201 Created):

```typescript
interface CreateAdventureResponse {
  success: boolean;
  data: Adventure;
}
```

### Delete Adventure Response

**Request**: DELETE `/api/adventures/{id}`

**Response** (200 OK):

```typescript
interface DeleteAdventureResponse {
  success: boolean;
  message: string;
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // e.g., "VALIDATION_ERROR", "NOT_FOUND", "CONFLICT"
    message: string; // User-friendly message
    details?: {
      // Optional: field-level validation errors
      [field: string]: string[];
    };
  };
}
```

---

## State Management with TanStack Query

### Query Keys

Standardized query key structure for cache invalidation:

```typescript
const adventureKeys = {
  all: ["adventures"] as const,
  lists: () => [...adventureKeys.all, "list"] as const,
  list: (filters: FilterParams) =>
    [...adventureKeys.lists(), { filters }] as const,
  detail: (id: string) => [...adventureKeys.all, "detail", id] as const,
};
```

### Cache Invalidation Strategy

| Operation        | Invalidate                     | Reason                 |
| ---------------- | ------------------------------ | ---------------------- |
| Create Adventure | `['adventures', 'list']`       | New item added to list |
| Delete Adventure | `['adventures', 'list']`       | Item removed from list |
| Update Adventure | `['adventures', 'detail', id]` | Item fields changed    |
| Select Adventure | None (no list change)          | Only navigates to game |

### Optimistic Updates

**Delete Adventure**:

```typescript
// Optimistically remove from cache before API responds
setQueryData(["adventures"], (old) => old.filter((a) => a.id !== deletedId));

// Rollback on error
// TanStack Query handles this automatically with mutation
```

**Create Adventure**:

```typescript
// Optimistically add new adventure to cache
setQueryData(["adventures"], (old) => [
  ...old,
  {
    id: tempId,
    name: newName,
    status: "active",
    progress: 0,
    currentSceneId: startingSceneId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);
```

---

## Filter & Sort Options

### Filtering

```typescript
type FilterParams = {
  status?: "active" | "completed" | "archived";
  search?: string; // Searches name and description
};
```

**Implementation**:

- Client-side filtering for simplicity (adventures list typically < 100 items)
- Server-side filtering via query params if backend supports

### Sorting

```typescript
type SortOption = "name" | "createdAt" | "lastPlayedAt" | "progress";
type SortOrder = "asc" | "desc";
```

**Default**: Sort by `createdAt` descending (newest first)

---

## Empty States & Error Handling

### Empty State

**Condition**: No adventures available for the player

**Display**:

```
┌─────────────────────────────────────┐
│  📖 No Adventures Yet               │
│                                      │
│  Create your first adventure to     │
│  begin exploring!                    │
│                                      │
│  [Create Adventure]                  │
└─────────────────────────────────────┘
```

### Error States

| Error Type       | User Message                                                         | Action                   |
| ---------------- | -------------------------------------------------------------------- | ------------------------ |
| Network error    | "Unable to connect. Check your internet connection."                 | Show retry button        |
| 404 Not Found    | "Adventure no longer exists."                                        | Remove from list         |
| 409 Conflict     | "An adventure with this name already exists."                        | Suggest alternative name |
| 500 Server error | "Something went wrong. Please try again later."                      | Show retry button        |
| Validation error | Field-specific message (e.g., "Name must be 100 characters or less") | Highlight field          |
| Loading timeout  | "Taking longer than usual. Please wait or retry."                    | Show retry button        |

---

## Performance Considerations

### Data Size Limits

- **Adventure list size**: Support 100+ adventures without pagination (stretch goal: 1000+)
- **Adventure name length**: 100 characters max
- **Progress percentage**: Integer 0-100
- **Avatar/thumbnail images**: Future enhancement (out of scope for MVP)

### Caching & Prefetching

- **Cache duration**: 5 minutes (stale time), 10 minutes (garbage collection)
- **Prefetch**: Load adventure data on page mount via TanStack Query
- **Background refetch**: Automatic every 5 minutes if tab is active
- **Pagination strategy**: Cursor-based for 100+ items (infinite scroll or "Load more")

### Rendering Optimization

- Memoize adventure cards with `React.memo`
- Use virtual scrolling if list exceeds 50 items
- Lazy load images (future enhancement)

---

## Type Safety & Code Generation

### OpenAPI-Generated Types

All interfaces below are **auto-generated** from the backend OpenAPI specification using `openapi-typescript`:

```bash
npx openapi-typescript ../../swagger-openapi.json -o src/types/api.ts
```

**Manual Type Files** (not auto-generated):

- `src/types/components.ts` - Component prop interfaces
- `src/types/forms.ts` - Form data structures
- `src/types/state.ts` - Query/cache state types

**Type Usage**:

```typescript
import { paths } from "./types/api";

// Extract Adventure type from OpenAPI spec
type Adventure =
  paths["/adventures/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
```

---

## Next Steps (Phase 2)

- [ ] Implement component interfaces from this data model
- [ ] Generate TypeScript types from backend OpenAPI spec
- [ ] Create API service layer wrapping generated types
- [ ] Implement TanStack Query hooks based on cache invalidation strategy
- [ ] Add comprehensive unit tests for data transformations
- [ ] Validate form inputs match constraints
- [ ] Test error handling with mock API failures

---

**Status**: Ready for contract generation (API schemas, component contracts)
