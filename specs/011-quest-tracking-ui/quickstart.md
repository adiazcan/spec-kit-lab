# Quickstart: Quest Tracking UI Implementation

**Date**: 2026-02-03 | **Branch**: `011-quest-tracking-ui`

## Overview

This guide provides step-by-step instructions for implementing the quest tracking interface. The feature consists of 8 main components organized in a feature folder under `frontend/src/components/quest-tracking/`.

## Project Structure

```
frontend/src/
├── components/
│   └── quest-tracking/              # NEW: Quest tracking feature
│       ├── QuestList.tsx            # Main quest list with filter controls
│       ├── QuestListItem.tsx        # Individual quest card
│       ├── QuestDetail.tsx          # Detail panel with full objectives
│       ├── ObjectiveItem.tsx        # Individual objective with progress
│       ├── ProgressBar.tsx          # Reusable progress indicator
│       ├── QuestFilter.tsx          # Filter controls (status, search)
│       ├── CompletedQuests.tsx      # Separate section for completed/failed quests
│       └── index.ts                 # Barrel export
├── services/
│   └── questService.ts              # API client for quest endpoints
├── hooks/
│   └── useQuestTracking.ts         # Custom hook for quest state management
└── types/
    └── quest.ts                     # TypeScript types (copy from contracts/quest-types.ts)
```

## Implementation Steps

### Step 1: Copy Types and API Contract

1. **Copy TypeScript types** from `/specs/011-quest-tracking-ui/contracts/quest-types.ts` to `/frontend/src/types/quest.ts`
   - These are auto-generated from the OpenAPI spec and include type guards and utility functions

2. **Review API contract** from `/specs/011-quest-tracking-ui/contracts/quest-api.md`
   - Understand all endpoint paths and request/response formats
   - Note the performance SLAs: <50ms for list, <30ms for details

### Step 2: Create Quest Service (API Client)

**File**: `frontend/src/services/questService.ts`

```typescript
import axios, { AxiosError } from "axios";
import type {
  Quest,
  QuestProgress,
  PaginatedResponse,
  ListQuestsParams,
  AcceptQuestRequest,
  AbandonQuestRequest,
  ErrorResponse,
} from "@/types/quest";

const API_BASE = "/api";

/**
 * API client for quest management
 * Provides type-safe methods for all quest endpoints
 */
export const questService = {
  /**
   * List all quests for an adventure (paginated)
   * @param adventureId - Adventure ID
   * @param params - Pagination and filter parameters
   * @returns Paginated quest list
   */
  async listQuests(
    adventureId: string,
    params?: ListQuestsParams,
  ): Promise<PaginatedResponse<Quest>> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.difficulty) queryParams.append("difficulty", params.difficulty);

    const response = await axios.get<PaginatedResponse<Quest>>(
      `${API_BASE}/adventures/${adventureId}/quests?${queryParams}`,
    );
    return response.data;
  },

  /**
   * Get active quests for current player
   * @param adventureId - Adventure ID
   * @param playerId - Player ID
   * @returns Array of active quest progress objects
   */
  async getActiveQuests(
    adventureId: string,
    playerId: string,
  ): Promise<QuestProgress[]> {
    const response = await axios.get<QuestProgress[]>(
      `${API_BASE}/adventures/${adventureId}/players/${playerId}/quests/active`,
    );
    return response.data;
  },

  /**
   * Get detailed progress for a specific quest
   * @param adventureId - Adventure ID
   * @param questId - Quest ID
   * @param playerId - Player ID (optional)
   * @returns Full quest progress with objectives and stages
   */
  async getQuestProgress(
    adventureId: string,
    questId: string,
    playerId?: string,
  ): Promise<QuestProgress> {
    const params = playerId ? `?playerId=${playerId}` : "";
    const response = await axios.get<QuestProgress>(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/progress${params}`,
    );
    return response.data;
  },

  /**
   * Accept a quest for the current player
   * @param adventureId - Adventure ID
   * @param questId - Quest ID to accept
   * @param playerId - Player ID accepting the quest
   * @returns Updated quest progress after acceptance
   */
  async acceptQuest(
    adventureId: string,
    questId: string,
    playerId: string,
  ): Promise<QuestProgress> {
    const request: AcceptQuestRequest = { playerId };
    const response = await axios.post<QuestProgress>(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/accept`,
      request,
    );
    return response.data;
  },

  /**
   * Abandon an active quest
   * @param adventureId - Adventure ID
   * @param questId - Quest ID to abandon
   * @param playerId - Player ID abandoning the quest
   * @returns Void on success (204 No Content)
   */
  async abandonQuest(
    adventureId: string,
    questId: string,
    playerId: string,
  ): Promise<void> {
    const request: AbandonQuestRequest = { playerId };
    await axios.post(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/abandon`,
      request,
    );
  },

  /**
   * Get quest dependencies (prerequisites)
   * @param adventureId - Adventure ID
   * @param questId - Quest ID
   * @param playerId - Player ID (optional, for checking if prerequisites are met)
   */
  async getQuestDependencies(
    adventureId: string,
    questId: string,
    playerId?: string,
  ) {
    const params = playerId ? `?playerId=${playerId}` : "";
    const response = await axios.get(
      `${API_BASE}/adventures/${adventureId}/quests/${questId}/dependencies${params}`,
    );
    return response.data;
  },
};

/**
 * Error handling helper - extracts user-friendly message from API errors
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data as ErrorResponse | undefined;
    if (errorData?.detail) {
      return errorData.detail;
    }
    switch (error.response?.status) {
      case 404:
        return "Quest not found";
      case 409:
        return "Cannot perform this action on this quest";
      case 422:
        return "Quest prerequisites not met";
      default:
        return "Failed to load quest data";
    }
  }
  return "An unexpected error occurred";
}
```

### Step 3: Create Custom Hook for Quest State Management

**File**: `frontend/src/hooks/useQuestTracking.ts`

```typescript
import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  QuestProgress,
  QuestFilterState,
  QuestFilterType,
} from "@/types/quest";
import { questService, getErrorMessage } from "@/services/questService";
import {
  filterQuestsByStatus,
  filterQuestsBySearch,
  sortQuests,
} from "@/types/quest";

/**
 * Hook for managing quest tracking state and operations
 * Handles fetching quests, filtering, and quest actions (abandon, etc.)
 *
 * @param adventureId - Current adventure ID
 * @param playerId - Current player ID
 * @returns Quest tracking state and actions
 */
export function useQuestTracking(adventureId: string, playerId: string) {
  // Filter state
  const [filters, setFilters] = useState<QuestFilterState>({
    statusFilters: ["Active"],
    searchText: "",
  });

  // Fetch active quests with React Query caching
  const {
    data: questsData,
    isLoading: isQuestsLoading,
    error: questsError,
    refetch: refetchQuests,
  } = useQuery({
    queryKey: ["quests", adventureId, playerId],
    queryFn: () => questService.getActiveQuests(adventureId, playerId),
    staleTime: 5 * 60 * 1000, // 5 minutes - quests static
    refetchInterval: 10 * 60 * 1000, // Background sync every 10 minutes
  });

  // Fetch completed quests (optional - for completed section)
  // Note: Would need separate API endpoint or filter on local data
  const quests = questsData || [];

  // Apply filters and search
  const filteredQuests = filterQuestsBySearch(
    filterQuestsByStatus(quests, filters.statusFilters),
    filters.searchText || "",
  );

  // Sort quests
  const sortedQuests = sortQuests(filteredQuests, filters.sortBy);

  // Abandon quest mutation
  const abandonMutation = useMutation({
    mutationFn: async (questId: string) => {
      await questService.abandonQuest(adventureId, questId, playerId);
    },
    onSuccess: () => {
      // Invalidate and refetch quest list
      refetchQuests();
    },
  });

  // Update filter
  const updateFilters = useCallback((newFilters: Partial<QuestFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Toggle filter status
  const toggleFilterStatus = useCallback((status: QuestFilterType) => {
    setFilters((prev) => ({
      ...prev,
      statusFilters: prev.statusFilters.includes(status)
        ? prev.statusFilters.filter((s) => s !== status)
        : [...prev.statusFilters, status],
    }));
  }, []);

  return {
    // Data
    quests: sortedQuests,
    filters,

    // Loading states
    isLoading: isQuestsLoading,
    isAbandonLoading: abandonMutation.isPending,

    // Errors
    error: questsError ? getErrorMessage(questsError) : null,
    abandonError: abandonMutation.error
      ? getErrorMessage(abandonMutation.error)
      : null,

    // Actions
    updateFilters,
    toggleFilterStatus,
    setSearchText: (text: string) => updateFilters({ searchText: text }),
    setSortBy: (sort: "name" | "progress" | "dateAccepted") =>
      updateFilters({ sortBy: sort }),
    abandonQuest: (questId: string) => abandonMutation.mutate(questId),
    refetch: refetchQuests,
  };
}
```

### Step 4: Build Core Components (Recommended Order)

1. **ProgressBar.tsx** (Reusable, no dependencies)
   - Simple visual progress indicator
   - Props: `percentage: number`, `label?: string`, `showLabel?: boolean`
   - Keyboard accessible, WCAG AA contrast

2. **ObjectiveItem.tsx** (Uses ProgressBar)
   - Display single objective with progress
   - Props: `objective: ObjectiveProgress`
   - Visual checkmark when complete, progress bar otherwise

3. **QuestFilter.tsx** (Standalone, manages filter state)
   - Filter checkboxes for Active/Completed/Failed
   - Search text input
   - Keyboard accessible, proper labels

4. **QuestListItem.tsx** (Uses ProgressBar)
   - Individual quest card showing name, status, progress
   - Props: `quest: QuestProgress`, `onSelect: () => void`, `onAbandon?: () => void`
   - Clickable, keyboard navigable

5. **QuestList.tsx** (Uses QuestListItem, QuestFilter)
   - Main list view with filtering controls
   - Props: `quests: QuestProgress[]`, filter state, callbacks
   - Empty state for no quests
   - Pagination if 100+ quests (future enhancement)

6. **QuestDetail.tsx** (Uses ObjectiveItem, ProgressBar)
   - Expandable detail panel showing full quest info
   - Props: `quest: QuestProgress`, `onClose: () => void`, `onAbandon?: () => void`
   - Shows all objectives, stages, rewards
   - Slide-out panel animation (optional)

7. **CompletedQuests.tsx** (Optional, similar to QuestList)
   - Show completed/failed quests with completion dates
   - Summary display, not expandable view

8. **index.ts** (Barrel export)
   - Export all components for easy importing

### Step 5: Implement Accessibility Features

For all components:

- [ ] Use semantic HTML (`<button>`, `<label>`, proper form structure)
- [ ] Add `aria-label` to icon-only buttons: `aria-label="Abandon quest"`
- [ ] Add `aria-describedby` to progress indicators
- [ ] Implement keyboard navigation (Tab, Escape, Enter)
- [ ] Add visible focus rings using Tailwind: `focus:ring-2 focus:ring-blue-500`
- [ ] Minimum 44x44px touch targets
- [ ] WCAG AA color contrast (test with Tailwind colors)

### Step 6: Add Component Tests

For each component, create a test file with:

```typescript
// QuestList.test.tsx example
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestList } from "./QuestList";
import type { QuestProgress } from "@/types/quest";

describe("QuestList", () => {
  let mockQuests: QuestProgress[];

  beforeEach(() => {
    mockQuests = [
      {
        questProgressId: "q1",
        questId: "q1",
        playerId: "p1",
        questName: "Save the Village",
        questDescription: "...",
        currentStageNumber: 1,
        totalStages: 3,
        progressPercentage: 33,
        status: "Active",
        currentStage: { /* ... */ },
        acceptedAt: "2026-02-01T00:00:00Z",
        completedAt: null,
        failedAt: null,
        abandonedAt: null,
      },
    ];
  });

  it("should render quest list", () => {
    render(
      <QuestList
        quests={mockQuests}
        filters={{ statusFilters: ["Active"] }}
        onSelectQuest={() => {}}
        onAbandonQuest={() => {}}
      />
    );
    expect(screen.getByText("Save the Village")).toBeInTheDocument();
  });

  it("should call onAbandonQuest when abandon button clicked", async () => {
    const handleAbandon = vi.fn();
    const user = userEvent.setup();

    render(
      <QuestList
        quests={mockQuests}
        filters={{ statusFilters: ["Active"] }}
        onSelectQuest={() => {}}
        onAbandonQuest={handleAbandon}
      />
    );

    await user.click(screen.getByRole("button", { name: /abandon/i }));
    expect(handleAbandon).toHaveBeenCalledWith("q1");
  });

  it("should filter by status", () => {
    const completedQuest = { ...mockQuests[0], status: "Completed" as const };
    render(
      <QuestList
        quests={[...mockQuests, completedQuest]}
        filters={{ statusFilters: ["Active"] }}
        onSelectQuest={() => {}}
        onAbandonQuest={() => {}}
      />
    );

    expect(screen.getByText("Save the Village")).toBeInTheDocument();
    // Completed quest should not be visible
    expect(screen.queryByText("Save the Village")).toHaveLength(1);
  });
});
```

## Development Workflow

### Phase 1: Build Core Components

1. Implement ProgressBar (simplest)
2. Implement ObjectiveItem (uses ProgressBar)
3. Implement QuestListItem (uses ProgressBar)
4. Test each component in isolation

### Phase 2: Build Feature Containers

1. Implement QuestList (uses QuestListItem)
2. Implement QuestDetail (uses ObjectiveItem)
3. Implement QuestFilter
4. Integrate with useQuestTracking hook

### Phase 3: Polish & Accessibility

1. Add comprehensive tests
2. Verify keyboard navigation
3. Check WCAG AA compliance (color contrast, touch targets)
4. Add accessibility audit if using existing audit tools (see ACCESSIBILITY_AUDIT.md)

### Phase 4: Performance Optimization

1. Verify React Query caching works (5-minute stale time)
2. Add React.memo() to list items to prevent unnecessary re-renders
3. Use lazy loading for quest detail (only fetch when visible)
4. Profile with browser DevTools

## CSS/Styling

- Use Tailwind CSS classes (already configured)
- Color scheme: Align with existing game UI
- Responsive: Desktop-first (1024px+ target)
- Dark mode: If applicable (check existing app theme)
- Animations: Minimal, focus functional (slide-out panel maybe)

## Performance Targets

| Metric           | Target                        | Verify With                   |
| ---------------- | ----------------------------- | ----------------------------- |
| API calls        | <50ms (list), <30ms (details) | Browser DevTools Network tab  |
| Component render | <16ms (60 fps)                | React DevTools Profiler       |
| Quest list load  | <1s initial                   | Lighthouse                    |
| Filter switching | <300ms                        | Measure user interaction time |

## Testing Checklist

- [ ] All components render without errors
- [ ] Quest list displays active quests
- [ ] Filtering works (by status and search)
- [ ] Detail panel opens/closes
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Accessibility: Screen reader announces quests
- [ ] Mobile responsive: Works on 1024px mobile devices
- [ ] Error handling: Shows user-friendly messages
- [ ] Performance: Meets <300ms filter switch target

## Troubleshooting

**Issue**: React Query caching not working

- **Solution**: Check `staleTime` configuration, ensure `queryKey` is consistent

**Issue**: TypeScript errors on quest types

- **Solution**: Ensure `quest.ts` is copied from `contracts/quest-types.ts`

**Issue**: Keyboard focus not visible

- **Solution**: Add Tailwind focus ring classes: `focus:ring-2 focus:ring-blue-500`

**Issue**: API calls timing out

- **Solution**: Check backend is running, verify API base URL in questService.ts

## Next Steps

After implementing components:

1. Create integration test (full component flow)
2. Add to main game navigation/routes
3. Deploy to staging for testing
4. Gather user feedback on quest tracking UX
