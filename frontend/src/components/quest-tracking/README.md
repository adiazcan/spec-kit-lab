# Quest Tracking Components Usage Guide

## Overview

The Quest Tracking UI feature provides a complete system for displaying, filtering, and managing player quests. This guide covers all components, their props, and usage patterns.

## Component Architecture

```
QuestTracking Feature (Top-level integration)
├── QuestList (Main container)
│   ├── QuestListItem (Individual quest in list)
│   │   └── ProgressBar (Visual progress indicator)
│   └── QuestFilter (Filter controls)
├── QuestDetail (Modal/Panel for quest details)
│   ├── ObjectiveItem (Individual objective display)
│   │   └── ProgressBar (objective progress)
│   └── RewardDisplay (Quest rewards list)
└── CompletedQuests (Quest history view)
    └── QuestListItem (Reuses list item component)
```

## Core Components

### QuestList

Main container component for displaying filtered quest list.

**Import:**

```typescript
import { QuestList } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface QuestListProps {
  quests: QuestProgress[]; // Quest data to display
  filters: QuestFilterState; // Current filter state
  onSelectQuest: (questId: string) => void; // Quest selection handler
  onAbandonQuest?: (questId: string) => void; // Quest abandon handler
  isLoading?: boolean; // Loading state indicator
  error?: string; // Error message
  onRetry?: () => void; // Retry callback
}
```

**Usage:**

```typescript
import { useQuestTracking } from "@/hooks/useQuestTracking";
import { QuestList } from "@/components/quest-tracking";

export function QuestTrackerPage() {
  const quest = useQuestTracking(adventureId, playerId);

  return (
    <QuestList
      quests={quest.filteredQuests}
      filters={quest.filters}
      onSelectQuest={quest.selectQuest}
      onAbandonQuest={(id) => quest.abandonQuest.mutate(id)}
      isLoading={quest.isLoadingQuests}
      error={quest.error}
    />
  );
}
```

**Features:**

- Displays filtered quest list
- Shows empty state when no quests
- Displays error message with retry button
- Shows loading spinner during fetch
- Keyboard accessible with proper ARIA labels
- Responsive layout

### QuestListItem

Individual quest item component displayed in the quest list.

**Import:**

```typescript
import { QuestListItem } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface QuestListItemProps {
  quest: QuestProgress; // Quest data
  onSelect: () => void; // Selection callback
  onAbandon?: () => void; // Abandon callback
}
```

**Usage:**

```typescript
<QuestListItem
  quest={questProgress}
  onSelect={() => selectQuest(questProgress.questProgressId)}
  onAbandon={() => abandonQuest(questProgress.questProgressId)}
/>
```

**Features:**

- Shows quest name, status badge, progress percentage
- Click to select for detail view
- Optional abandon button
- Keyboard navigable

### QuestDetail

Modal/panel component displaying full quest details and objectives.

**Import:**

```typescript
import { QuestDetail } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface QuestDetailProps {
  quest: QuestProgress | null; // Selected quest data
  isOpen: boolean; // Modal visibility
  onClose: () => void; // Close callback
  onAbandon?: () => void; // Abandon callback
}
```

**Usage:**

```typescript
<QuestDetail
  quest={quest.selectedQuest}
  isOpen={quest.selectedQuestId !== null}
  onClose={() => quest.selectQuest(null)}
  onAbandon={() => {
    quest.abandonQuest.mutate(quest.selectedQuestId);
  }}
/>
```

**Features:**

- Full quest details display
- All objectives with progress
- Multiple stages support
- Reward display
- Modal dialog with focus management
- Escape key closes modal
- Slide-out animation

### QuestFilter

Filter controls for filtering quests by status and search.

**Import:**

```typescript
import { QuestFilter } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface QuestFilterProps {
  filters: QuestFilterState; // Current filters
  onFiltersChange: (filters: QuestFilterState) => void; // Filter change handler
}
```

**Usage:**

```typescript
<QuestFilter
  filters={quest.filters}
  onFiltersChange={(newFilters) => {
    quest.setStatusFilter(newFilters.statusFilters);
    quest.setSearchText(newFilters.searchText || "");
  }}
/>
```

**Features:**

- Status filter checkboxes (Active, Completed, Failed)
- Visual indicator of active filters
- Keyboard accessible

### ObjectiveItem

Component displaying individual quest objective with progress.

**Import:**

```typescript
import { ObjectiveItem } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface ObjectiveItemProps {
  objective: ObjectiveProgress; // Objective data
}
```

**Usage:**

```typescript
{stage.currentStage.objectives.map((obj) => (
  <ObjectiveItem key={obj.objectiveId} objective={obj} />
))}
```

**Features:**

- Shows objective description
- Displays progress counter (e.g., "3/5")
- Visual progress bar
- Checkmark for completed objectives
- Color-coded by status

### ProgressBar

Reusable progress indicator component.

**Import:**

```typescript
import { ProgressBar } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface ProgressBarProps {
  percentage: number; // Progress 0-100
  label?: string; // Optional label
  showLabel?: boolean; // Show percentage text
  height?: "small" | "medium" | "large";
}
```

**Usage:**

```typescript
<ProgressBar
  percentage={questProgress.progressPercentage}
  label="Quest Progress"
  showLabel={true}
  height="medium"
/>
```

**Features:**

- Customizable percentage
- Optional label display
- Accessible with ARIA attributes
- Smooth animation
- Multiple size variants

### RewardDisplay

Component showing quest rewards.

**Import:**

```typescript
import { RewardDisplay } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface RewardDisplayProps {
  rewards?: Reward[]; // Reward data
  showIcons?: boolean; // Show reward type icons
}
```

**Usage:**

```typescript
<RewardDisplay
  rewards={questProgress.rewards}
  showIcons={true}
/>
```

**Features:**

- Shows reward type and amount
- Icon support for each reward type
- Color-coded by reward type
- Handles empty rewards gracefully
- Accessible text labels

### CompletedQuests

Component for displaying quest completion history.

**Import:**

```typescript
import { CompletedQuests } from "@/components/quest-tracking";
```

**Props:**

```typescript
interface CompletedQuestsProps {
  quests: QuestProgress[]; // Completed quests to display
  onSelectQuest?: (questId: string) => void; // Selection callback
}
```

**Usage:**

```typescript
<CompletedQuests
  quests={quest.filteredQuests.filter(q => q.status === "Completed")}
  onSelectQuest={quest.selectQuest}
/>
```

**Features:**

- Displays completed quests with completion dates
- Quest count
- Optional clickable to view details
- Sorted by completion date

## Hooks

### useQuestTracking

Main hook for managing quest tracking state.

**Import:**

```typescript
import { useQuestTracking } from "@/hooks/useQuestTracking";
```

**Usage:**

```typescript
const {
  // Data
  quests, // All fetched quests
  filteredQuests, // Quests after applying filters
  selectedQuestId, // Currently selected quest ID
  selectedQuest, // Full selected quest data

  // State
  isLoadingQuests, // Loading indicator
  isLoadingDetail, // Detail loading indicator
  error, // Quest list error
  detailError, // Quest detail error

  // Filters
  filters, // Current filter state
  setStatusFilter, // Update status filter
  setSearchText, // Update search text
  setSortBy, // Update sort order
  clearFilters, // Reset all filters

  // Actions
  selectQuest, // Select a quest
  abandonQuest, // Abandon quest mutation
} = useQuestTracking(adventureId, playerId);
```

**Features:**

- Fetches active quests using React Query
- 5-minute stale time for caching
- Manages filter state
- Handles quest selection and detail fetching
- Mutation for abandoning quests
- Automatic cache invalidation
- Error handling

### useQuestStats

Utility hook for calculating quest statistics.

**Import:**

```typescript
import { useQuestStats } from "@/hooks/useQuestTracking";
```

**Usage:**

```typescript
const stats = useQuestStats(filteredQuests);

// stats contains:
// - totalQuests: number
// - activeCount: number
// - completedCount: number
// - failedCount: number
// - abandonedCount: number
// - averageProgress: number (0-100)
```

## Common Patterns

### Full Quest Tracker Page

```typescript
import { useState } from "react";
import { useQuestTracking } from "@/hooks/useQuestTracking";
import {
  QuestList,
  QuestFilter,
  QuestDetail,
  CompletedQuests,
} from "@/components/quest-tracking";

export function QuestTrackerPage() {
  const quest = useQuestTracking(adventureId, playerId);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const displayedQuests =
    activeTab === "active"
      ? quest.filteredQuests.filter((q) => q.status === "Active")
      : quest.filteredQuests.filter((q) => q.status === "Completed");

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Quest Tracker</h1>

      {/* Filter Controls */}
      <QuestFilter
        filters={quest.filters}
        onFiltersChange={(f) => {
          quest.setStatusFilter(f.statusFilters);
          quest.setSearchText(f.searchText || "");
        }}
      />

      {/* Tab Navigation */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("active")}
          className={activeTab === "active" ? "font-bold" : ""}
        >
          Active Quests
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={activeTab === "completed" ? "font-bold" : ""}
        >
          Completed Quests
        </button>
      </div>

      {/* Quest List */}
      {activeTab === "active" ? (
        <QuestList
          quests={displayedQuests}
          filters={quest.filters}
          onSelectQuest={quest.selectQuest}
          onAbandonQuest={(id) => quest.abandonQuest.mutate(id)}
          isLoading={quest.isLoadingQuests}
          error={quest.error}
        />
      ) : (
        <CompletedQuests
          quests={displayedQuests}
          onSelectQuest={quest.selectQuest}
        />
      )}

      {/* Detail Modal */}
      <QuestDetail
        quest={quest.selectedQuest}
        isOpen={quest.selectedQuestId !== null}
        onClose={() => quest.selectQuest(null)}
        onAbandon={() => {
          if (quest.selectedQuestId) {
            quest.abandonQuest.mutate(quest.selectedQuestId);
          }
        }}
      />
    </div>
  );
}
```

### Error Handling Pattern

```typescript
import { QuestList } from "@/components/quest-tracking";

export function SafeQuestList() {
  const quest = useQuestTracking(adventureId, playerId);

  return (
    <>
      {quest.error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{quest.error}</p>
          <button
            onClick={() => {
              // Refetch quests
              queryClient.invalidateQueries({
                queryKey: ["quests", "active", adventureId, playerId],
              });
            }}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}

      <QuestList
        quests={quest.filteredQuests}
        filters={quest.filters}
        onSelectQuest={quest.selectQuest}
        isLoading={quest.isLoadingQuests}
        error={quest.error}
      />
    </>
  );
}
```

## Performance Tips

1. **Memoization**: All components use React.memo() to prevent unnecessary re-renders
2. **Query Caching**: useQuestTracking uses React Query with 5-minute stale time
3. **Lazy Loading**: Quest details only fetch when a quest is selected
4. **Event Handlers**: Use useCallback for event handlers to maintain referential equality
5. **List Rendering**: Quest list uses efficient array mapping

## Accessibility

All components include:

- Proper ARIA labels and roles
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support
- Color contrast compliance (WCAG AA)
- Focus management
- Semantic HTML

## Type Safety

Import types for prop validation:

```typescript
import type {
  QuestProgress,
  QuestFilterState,
  ObjectiveProgress,
  Reward,
  QuestStatus,
  QuestFilterType,
} from "@/types/quest";
```

## Testing

All components have comprehensive tests:

```bash
# Run all quest tracking tests
npm test -- quest-tracking

# Run with coverage
npm test -- quest-tracking --coverage

# Watch mode
npm test -- quest-tracking --watch
```

## Troubleshooting

### Quests not loading

- Check that `adventureId` and `playerId` are valid
- Verify backend API is returning data
- Check browser console for network errors

### Filters not working

- Ensure `setStatusFilter` and `setSearchText` are called correctly
- Verify quest data has `status` and `questName`/`questDescription` fields

### Modal not closing

- Check `onClose` callback is properly connected
- Verify `isOpen` prop is wired to component state

### Accessibility issues

- Run automated audit: `npm run a11y:audit`
- Test with screen reader
- Verify keyboard navigation works

## Related Documentation

- [Quest Types](../types/quest.ts) - Type definitions
- [Quest Service](../services/questService.ts) - API client
- [Accessibility Audit](../../ACCESSIBILITY_AUDIT.md) - A11y details
