# Tasks: Quest Tracking Interface

**Input**: Design documents from `/specs/011-quest-tracking-ui/`
**Features**: plan.md ✓ | spec.md ✓ | research.md ✓ | data-model.md ✓ | contracts/ ✓ | quickstart.md ✓

**Platform**: Web application (React frontend + existing .NET backend)
**Tech Stack**: React 18.x, TypeScript 5.x, Tailwind CSS, Vitest, React Testing Library, React Query, Axios

---

## Format: `- [ ] [TaskID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, etc.) for traceability
- File paths: `frontend/src/components/quest-tracking/`, `frontend/src/services/`, `frontend/src/hooks/`, `frontend/src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, type definitions, and API client setup

**Details**: Copy existing type definitions from design contracts, create API service layer, establish custom hooks for state management.

- [x] T001 Copy TypeScript quest types from `/specs/011-quest-tracking-ui/contracts/quest-types.ts` to `frontend/src/types/quest.ts`
- [x] T002 Create quest API service in `frontend/src/services/questService.ts` with all endpoints (list, details, active, dependencies, accept, abandon)
- [x] T003 Create barrel export for types in `frontend/src/types/index.ts` to include quest types
- [x] T004 Create barrel export for services in `frontend/src/services/index.ts` to include questService

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities and hooks that ALL user stories depend on

**⚠️ CRITICAL**: No component work can begin until this phase is complete

- [x] T005 Create custom hook `useQuestTracking` in `frontend/src/hooks/useQuestTracking.ts` for:
  - Fetching active quests via React Query (5-min stale time)
  - Managing filter state (status filters, search text, sort)
  - Handling abandon quest mutation with error handling
  - Returning quest data, filter state, and action handlers
- [x] T006 Create barrel export for hooks in `frontend/src/hooks/index.ts` to include useQuestTracking
- [x] T007 Create quest tracking components directory: `frontend/src/components/quest-tracking/`
- [x] T008 Create barrel export for quest-tracking components in `frontend/src/components/quest-tracking/index.ts`

**Checkpoint**: Foundation ready - component implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Active Quests List (Priority: P1) 🎯 MVP Core

**Goal**: Players can see all their active quests in a list view, understanding their quest commitments at a glance. This is the essential entry point for the quest tracking feature.

**Independent Test**: Navigate to quest tracker, verify all active quests display with name and status. Empty state shows when no quests exist.

### Tests for User Story 1

> **NOTE: Write these tests FIRST using TDD approach, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Create unit test for QuestList component in `frontend/tests/components/quest-tracking/QuestList.test.tsx` covering:
  - Rendering list of quests with quest names
  - Empty state when no quests provided
  - Rendering correct number of quest items
  - Click handlers for quest selection
  - Proper accessibility: role="list", role="listitem", keyboard navigation
- [x] T010 [P] [US1] Create unit test for QuestListItem component in `frontend/tests/components/quest-tracking/QuestListItem.test.tsx` covering:
  - Displaying quest name and status badge
  - Showing progress percentage
  - Click callback invoked when quest selected
  - Keyboard accessibility: Tab navigation, Enter key activation
- [x] T011 [US1] Create integration test for active quests flow in `frontend/tests/integration/activeQuestsList.test.tsx`:
  - Fetch active quests via questService mock
  - Display list with proper data mapping
  - Verify error message if API fails

### Implementation for User Story 1

- [x] T012 [P] [US1] Create QuestListItem component in `frontend/src/components/quest-tracking/QuestListItem.tsx`:
  - Props: `quest: QuestProgress`, `onSelect: () => void`, `onAbandon?: () => void`
  - Display: quest name, status badge (Active/Completed/Failed), progress percentage
  - Accessibility: role="button" or `<button>` element, aria-label, focus ring
  - Style: Tailwind CSS, consistent with existing game UI
- [x] T013 [P] [US1] Create ProgressBar component in `frontend/src/components/quest-tracking/ProgressBar.tsx`:
  - Props: `percentage: number`, `label?: string`, `showLabel?: boolean`
  - Display: Visual progress bar (HTML progress element or div bar)
  - Accessibility: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
  - Used by: QuestListItem, ObjectiveItem, and other progress displays
- [x] T014 [US1] Create QuestList component in `frontend/src/components/quest-tracking/QuestList.tsx`:
  - Props: `quests: QuestProgress[]`, `filters: QuestFilterState`, `onSelectQuest: (questId: string) => void`, `onAbandonQuest?: (questId: string) => void`, `isLoading?: boolean`, `error?: string`
  - Display: List of QuestListItem components using map()
  - Empty state: "No active quests" message when array empty
  - Error state: Display error message with retry option
  - Loading state: Skeleton loaders or spinner while loading
  - Accessibility: role="list", aria-label="Active quests", proper heading structure
  - Performance: Use React.memo() to prevent unnecessary re-renders
- [x] T015 [US1] Update quest tracker page/route in existing game UI to:
  - Import QuestList and useQuestTracking
  - Call useQuestTracking hook with adventureId and playerId
  - Pass quest data, filters, and handlers to QuestList component
  - Display loading/error states appropriately
  - Verify responsive layout (1024px+ width target)

**Checkpoint**: User Story 1 complete - players can view active quests list independently. Test all acceptance scenarios from spec.md.

---

## Phase 4: User Story 2 - View Quest Details with Objectives (Priority: P1) 🎯 MVP Core

**Goal**: Players can click a quest to see full details including all objectives they must complete. This enables quest understanding and planning.

**Independent Test**: Select any quest from US1 list, verify detail panel shows quest title, description, all objectives listed, and close button works.

### Tests for User Story 2

> **NOTE: Write these tests FIRST using TDD approach, ensure they FAIL before implementation**

- [x] T016 [P] [US2] Create unit test for QuestDetail component in `frontend/tests/components/quest-tracking/QuestDetail.test.tsx` covering:
  - Rendering quest title and description
  - Displaying all objectives from currentStage
  - Showing quest stages (if multi-stage)
  - Close button callback invoked on click
  - Accessibility: role="dialog", aria-modal="true", aria-labelledby, focus management (autoFocus on open), Escape key closes
- [x] T017 [P] [US2] Create unit test for ObjectiveItem component in `frontend/tests/components/quest-tracking/ObjectiveItem.test.tsx` covering:
  - Displaying objective description
  - Showing progress (e.g., "3/5")
  - Visual checkmark for completed objectives
  - Progress bar for in-progress objectives
  - Accessibility: Clear description, percentage announcement
- [x] T018 [US2] Create integration test for quest details flow in `frontend/tests/integration/questDetails.test.tsx`:
  - Fetch quest progress via questService mock
  - Display details with nested objectives
  - Verify all nested data properly rendered
  - Test error handling if fetch fails

### Implementation for User Story 2

- [x] T019 [P] [US2] Create ObjectiveItem component in `frontend/src/components/quest-tracking/ObjectiveItem.tsx`:
  - Props: `objective: ObjectiveProgress`
  - Display: Description, current/target counter (e.g., "3/5"), progress percentage
  - Visual: Checkmark icon if completed, progress bar if in-progress
  - Accessibility: aria-label for completion status, progress bar role/attributes
  - Color: Use Tailwind to distinguish completed (gray) from in-progress (highlight)
- [x] T020 [P] [US2] Create RewardDisplay component (optional, for preparing US6) in `frontend/src/components/quest-tracking/RewardDisplay.tsx`:
  - Props: `rewards?: Reward[]`
  - Display: List of rewards with type (Experience, Item, Currency, Achievement) and amount
  - Icons: Use existing game UI icons for reward types
  - Fallback: Show "No rewards" if rewards array empty or undefined
- [x] T021 [US2] Create QuestDetail component in `frontend/src/components/quest-tracking/QuestDetail.tsx`:
  - Props: `quest: QuestProgress | null`, `isOpen: boolean`, `onClose: () => void`, `onAbandon?: () => void`
  - Display: Quest title (large), full description, quest giver, accepted date
  - Stages section: Show currentStage and other stages (if multi-stage)
  - Objectives: Map over currentStage.objectives using ObjectiveItem component
  - Rewards: Include RewardDisplay component (prepare for US6)
  - Buttons: Close button (top-right X), optional Abandon button
  - Accessibility: role="dialog", aria-modal="true", aria-labelledby="quest-detail-title", focus lock (trap focus within modal), Escape key closes
  - Styling: Slide-out panel (from right) or modal overlay, use Tailwind animations
  - Performance: Only render if isOpen=true or use lazy loading
- [x] T022 [US2] Update quest tracker page/route to display quest details:
  - Add state management for selectedQuestId (useState or URL param)
  - Fetch quest progress when selectedQuestId changes (useEffect + questService)
  - Display QuestDetail component with fetched data
  - Pass selectedQuestId to QuestList for highlighting selected quest
  - Handle loading/error states for detail fetch
  - Implement onClose handler to clear selectedQuestId

**Checkpoint**: User Stories 1 AND 2 complete - players can view active quests and click to see full details. Test all acceptance scenarios from spec.md.

---

## Phase 5: User Story 3 - View Progress Indicators for Each Stage (Priority: P1) 🎯 MVP Core

**Goal**: Progress indicators (percentages, progress bars, counters) clearly show objective completion status. This provides visual feedback on quest advancement.

**Independent Test**: View any quest with multiple objectives, verify each shows progress bar and counter (e.g., "3/5"). Completed objectives show as 100% or checkmark.

### Tests for User Story 3

> **NOTE: Write these tests FIRST using TDD approach, ensure they FAIL before implementation**

- [x] T023 [P] [US3] Create unit test for ProgressBar component in `frontend/tests/components/quest-tracking/ProgressBar.test.tsx` covering:
  - Rendering progress bar that fills to percentage value
  - Displaying percentage text if showLabel=true
  - Accessibility: role="progressbar", aria-valuenow updated, aria-valuemin/max set correctly
  - Boundary values: 0%, 50%, 100%
- [x] T024 [P] [US3] Extend ObjectiveItem tests (created in T017) to cover progress display:
  - Progress counter displays correctly (currentProgress/targetAmount)
  - Progress percentage calculated correctly (currentProgress/targetAmount \* 100)
  - Visual progress bar fills to percentage
  - Completed objective shown at 100% with checkmark
  - In-progress objective shows visual fill matching percentage

### Implementation for User Story 3

- [x] T025 [US3] No new components needed - progress indicators already implemented in:
  - ProgressBar component (T013) used in QuestListItem and ObjectiveItem
  - ObjectiveItem component (T019) shows counter and progress bar
  - QuestListItem component (T012) shows overall quest progress
- [x] T026 [US3] Verify progress calculation accuracy in ObjectiveItem component:
  - Calculate progressPercentage: `(currentProgress / targetAmount) * 100`
  - Round to nearest integer for display
  - Handle edge case: currentProgress === targetAmount (show 100%)
  - Document formula in component JSDoc
- [x] T027 [US3] Add detailed progress display in QuestDetail component:
  - Show quest progress bar with percentage (from data.progressPercentage)
  - Show current stage info: "Stage 2 of 3"
  - Show objectives with individual progress bars
  - Add stage-level progress if available (average of objectives in stage)
  - Accessibility: Each progress bar has aria-label describing what's being tracked

**Checkpoint**: User Stories 1, 2, AND 3 complete - quest tracking shows full progress visibility. This is the MVP core. Test all acceptance scenarios from spec.md.

---

## Phase 6: User Story 4 - Filter Quests by Status (Priority: P2)

**Goal**: Players can filter the quest list to show only Active, Completed, or Failed quests. This improves usability for players with many quests.

**Independent Test**: Toggle between filter options (Active/Completed/Failed), verify list updates to show only selected status quests. No filter shows all quests.

### Tests for User Story 4

> **NOTE: Write these tests FIRST using TDD approach, ensure they FAIL before implementation**

- [x] T028 [P] [US4] Create unit test for QuestFilter component in `frontend/tests/components/quest-tracking/QuestFilter.test.tsx` covering:
  - Rendering filter checkboxes for Active, Completed, Failed
  - Checkbox changes invoke onChange callback with updated filters
  - Multiple filters can be selected together
  - Accessibility: Each checkbox has associated <label>, aria-label for clarity
  - Visual indicator shows which filters are active
- [x] T029 [US4] Extend QuestList tests (created in T009) to cover filtering:
  - When statusFilters=["Active"], only active quests displayed
  - When statusFilters=["Completed", "Failed"], only non-active quests displayed
  - When statusFilters=[], all quests displayed
  - Filter changes update visible list immediately

### Implementation for User Story 4

- [x] T030 [P] [US4] Create QuestFilter component in `frontend/src/components/quest-tracking/QuestFilter.tsx`:
  - Props: `filters: QuestFilterState`, `onFiltersChange: (filters: QuestFilterState) => void`
  - Display: Three checkboxes (Active, Completed, Failed) or toggle buttons
  - Behavior: Each checkbox toggles status in statusFilters array
  - Optional: Add search text input (`<input type="text">`) for quest name search
  - Accessibility: Each checkbox has `<label>` associated via htmlFor, proper aria-label
  - Styling: Tailwind CSS, align with existing game UI
  - Performance: Memoize with React.memo() to prevent unnecessary re-renders
- [x] T031 [US4] Integrate QuestFilter into quest tracker page/route:
  - Display QuestFilter component above or next to QuestList
  - Pass filters state from useQuestTracking hook to QuestFilter
  - Connect onFiltersChange to updateFilters action from hook
  - Verify QuestList receives updated filters and displays correctly
  - Add visual indicator showing which filters are active
- [x] T032 [US4] Update QuestList component to handle filter display:
  - Add filter badge/indicator showing active filters (e.g., "Showing: Active & Completed")
  - Show count of displayed quests vs. total quests
  - Update empty state message to reflect filters (e.g., "No completed quests found")
- [x] T033 [US4] Add filter state persistence (optional enhancement):
  - Save filter state to localStorage or URL params
  - Restore filter state on page reload
  - Document implementation in component comments

**Checkpoint**: User Stories 1-4 complete - players can track and filter quests by status. Test all acceptance scenarios from spec.md.

---

## Phase 7: User Story 5 - View Completed Quests History (Priority: P2)

**Goal**: Players can review their completed quests and see when they were finished. This provides achievement recognition and progression tracking.

**Independent Test**: Filter to show "Completed" quests, verify list shows completed quests with completion dates. Can view details of completed quest.

### Tests for User Story 5

> **NOTE: Write these tests FIRST using TDD approach, ensure they FAIL before implementation**

- [x] T034 [P] [US5] Create unit test for CompletedQuests component in `frontend/tests/components/quest-tracking/CompletedQuests.test.tsx` covering:
  - Rendering list of completed quests
  - Displaying completion dates in consistent format
  - Showing count of completed quests
  - Optional: Pagination controls for large quest lists
  - Accessibility: Properly announced as list, dates accessible
- [x] T035 [US5] Create integration test for completed quests history flow in `frontend/tests/integration/completedQuestsHistory.test.tsx`:
  - Fetch completed quests via questService mock
  - Display history with proper date formatting
  - Verify quest detail can be opened from history

### Implementation for User Story 5

- [x] T036 [P] [US5] Create CompletedQuests component in `frontend/src/components/quest-tracking/CompletedQuests.tsx`:
  - Props: `quests: QuestProgress[]`, `onSelectQuest?: (questId: string) => void`
  - Display: List of completed quests with completion date (formatted, e.g., "Jan 15, 2026")
  - Optional: Sort by completion date (newest first)
  - Optional: Pagination if quest list is large (100+ quests)
  - Accessibility: role="list", dates in readable format with time zone, clickable to view details
  - Styling: Similar to QuestList but with completion date column
- [x] T037 [US5] Update quest tracker page/route to display completed quests:
  - Use existing filter state (show completed quests when "Completed" filter active)
  - Or create separate tab/section for completed quests history
  - Pass completed quests to CompletedQuests component
  - Optional: Use infinite scroll or pagination for large histories
- [x] T038 [US5] Add historical quest detail view:
  - When viewing completed quest detail, show completion date prominently
  - Show final quest status (Completed vs. Failed vs. Abandoned)
  - Show any completion rewards earned (from QuestProgress data if available)
  - Add "Return to History" or back button

**Checkpoint**: User Stories 1-5 complete - players can track active quests and review completion history. Test all acceptance scenarios from spec.md.

---

## Phase 8: User Story 6 - View Quest Rewards Display (Priority: P2)

**Goal**: Players see what rewards they'll receive or did receive from quests. This motivates quest engagement and clarifies benefits.

**Independent Test**: View any quest (active or completed), verify rewards section displays with types (Experience, Item, Currency, Achievement) and amounts clearly labeled.

### Tests for User Story 6

> **NOTE: Write these tests FIRST using TDD approach, ensure they FAIL before implementation**

- [x] T039 [P] [US6] Create unit test for RewardDisplay component in `frontend/tests/components/quest-tracking/RewardDisplay.test.tsx` covering:
  - Rendering reward for each reward type (Experience, Item, Currency, Achievement)
  - Displaying reward amount/quantity with label
  - Empty state when no rewards provided
  - Optional: Icons for each reward type render correctly
  - Accessibility: Each reward clearly labeled, types announced
- [x] T040 [US6] Extend QuestDetail tests (created in T016) to cover rewards section:
  - When quest has rewards, RewardDisplay component renders
  - All reward types displayed correctly
  - Rewards visible in quest detail panel

### Implementation for User Story 6

- [x] T041 [P] [US6] Update RewardDisplay component (created in T020):
  - Add icon support for each reward type (use existing game icons if available)
  - Display icon + type + amount (e.g., "⭐ 100 Experience", "🎁 Sword of Legend")
  - Color-code by reward type or add visual distinction
  - Accessibility: aria-label for icon-only elements, type clearly labeled in text
  - Handle optional rewards (some quests may have no rewards)
- [x] T042 [US6] Integrate rewards display into QuestDetail component:
  - Add rewards section prominently (after objectives or in dedicated row)
  - Heading: "Rewards" or "Quest Rewards"
  - Use RewardDisplay component to render all rewards
  - Show both offered rewards (before completion) and actual rewards (after completion)
  - Accessibility: Separate rewards from other quest info with clear heading
- [x] T043 [US6] Update quest data fetching to include rewards:
  - Verify questService returns reward data in QuestProgress response
  - If rewards not in backend response, prepare for future integration
  - Add TypeScript type checking for rewards array (Reward[] | undefined)
- [x] T044 [US6] Add rewards styling:
  - Use Tailwind CSS classes for consistent reward display
  - Icons: Size 20-24px, align vertically with text
  - Spacing: Adequate padding between reward items
  - Color: Match game UI theme for reward types
  - Responsive: Wrap rewards on mobile if needed

**Checkpoint**: User Stories 1-6 complete - quest tracking feature fully functional with all required user stories. Test all acceptance scenarios from spec.md.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting entire quest tracking feature

### Accessibility & WCAG AA Compliance

- [x] T045 [P] Run accessibility audit on entire quest tracking feature:
  - Use existing accessibility tools (see `frontend/ACCESSIBILITY_AUDIT.md`)
  - Focus: Keyboard navigation (Tab, Shift+Tab, Arrow keys, Enter, Escape)
  - Verify: All interactive elements reachable and operable via keyboard
  - Check: Screen reader announcements for lists, progress, status changes
  - Test: Color contrast WCAG AA (4.5:1 for text, 3:1 for icons/components)
  - Verify: ARIA labels/descriptions accurate and non-redundant
- [x] T046 [P] Keyboard navigation testing:
  - Tab through quest list items (enters QuestListItem, focus visible)
  - Tab switches between QuestList and QuestFilter
  - Escape closes QuestDetail modal when open
  - Enter/Space activates quest selection
  - Arrow keys navigate quest list items (optional advanced feature)
  - Document keyboard shortcuts in component JSDoc comments
- [x] T047 [P] Screen reader testing (with NVDA or JAWS):
  - Quest list announced as list with item count
  - Each quest item announced with name, status, progress percentage
  - Progress bar percentages announced
  - Filter checkboxes announced with current state
  - Modal dialog announced when QuestDetail opens
  - Completion status clearly announced
- [x] T048 Color contrast verification:
  - Test all text colors against background: 4.5:1 ratio minimum
  - Test button/component borders: 3:1 ratio minimum
  - Use Tailwind colors or WebAIM contrast checker
  - Document compliant color combinations in Tailwind config if custom

### Documentation & Type Safety

- [x] T049 [P] Add comprehensive JSDoc to all components:
  - Each component: description, features list, accessibility notes, @example
  - Each prop: description, type, default value, required status
  - Each function: description, parameters, return value
  - Reference: research.md "Component Documentation Patterns" section
- [x] T050 [P] Add TypeScript strict mode checks:
  - Verify tsconfig.json has "strict": true
  - All props interfaces properly typed
  - No `any` types used
  - All returns properly typed
  - Run tsc --noEmit to verify compilation
- [x] T051 [P] Update types in `frontend/src/types/quest.ts`:
  - Verify all types match API contract (quest-types.ts)
  - Add utility functions for type guards if not already present
  - Document type relationships and invariants
- [x] T052 Create component usage guide in `frontend/src/components/quest-tracking/README.md`:
  - Import paths for each component
  - Props/interface for each component
  - Usage examples (code snippets)
  - Common patterns and anti-patterns
  - Performance tips (memoization, lazy loading)

### Performance Optimization

- [x] T053 [P] Performance monitoring setup:
  - Add performance marks around component renders
  - Measure: quest list load time, detail fetch time, filter response time
  - Log metrics to console or monitoring service
  - Target: <1s list load, <500ms detail load, <300ms filter switch
  - Use: Performance Monitor (see research.md "Backend API Performance")
- [x] T054 [P] React optimization:
  - Verify React.memo() applied to QuestListItem, QuestCard, ObjectiveItem
  - Verify useCallback() used for event handlers within hooks
  - Verify useMemo() used if complex calculations in components
  - Profile with React DevTools Profiler to identify slow renders
- [x] T055 [P] React Query optimization:
  - Verify staleTime and cacheTime settings (5 min default for quests)
  - Implement background refetch for progress updates (10 min interval)
  - Set proper enabled conditions (e.g., only fetch if IDs available)
  - Document cache invalidation strategy (e.g., on abandon, on create)
- [x] T056 API request optimization:
  - Verify questService uses Axios with proper timeout (30s)
  - Implement error retry logic with exponential backoff (optional)
  - Add request logging for debugging (optional)
  - Test API response times meet SLA (<200ms P95)

### Testing Coverage

- [x] T057 [P] Component integration tests:
  - Test complete user flows (list → select → view detail → abandon)
  - Test error scenarios (API failure, invalid quest, no permissions)
  - Test empty states (no quests, no objectives, no rewards)
  - Test edge cases (very long quest names, many objectives, max quests)
- [x] T058 [P] Service unit tests (questService.test.ts):
  - Mock API responses for each endpoint
  - Test error handling (network errors, API errors, invalid responses)
  - Test parameter validation (skip/limit bounds, UUID format)
  - Verify error messages are user-friendly
- [x] T059 [P] Hooks unit tests (useQuestTracking.test.ts):
  - Test hook returns correct initial state
  - Test filter state updates work correctly
  - Test abandon quest mutation works
  - Test error states propagate correctly
- [x] T060 Run test suite and achieve target coverage:
  - Run: `npm test` to execute all Vitest tests
  - Target: 80%+ coverage for components, 90%+ for services
  - If coverage below target: Add tests for uncovered code paths
  - Document: Create `frontend/tests/quest-tracking-coverage.md` with results

### Responsive Design & Mobile

- [x] T061 [P] Responsive layout testing (1024px+ widths):
  - Test on desktop (1920px, 1440px, 1024px breakpoints)
  - Test on tablet landscape (1024px width)
  - Verify: No horizontal scrolling on standard resolutions
  - Verify: Text readable, buttons clickable at all sizes
  - Use: Browser DevTools responsive mode or physical devices
- [x] T062 [P] Touch target verification:
  - Minimum 44x44px for all buttons and interactive elements
  - Verify with DevTools "Show paint rectangles"
  - Add padding if needed (e.g., `p-2` or higher)
  - Test: All buttons easily clickable without zooming
- [x] T063 [P] Dark mode support (if game UI uses dark mode):
  - Verify Tailwind dark mode classes if applicable
  - Test: Quest list, detail, filters in dark mode
  - Verify: Text contrast still meets WCAG AA in dark mode
  - Document: Color variables if custom values needed

### Bug Fixes & Edge Cases

- [x] T064 [P] Handle edge cases from spec.md:
  - Quests with no objectives: Show "No objectives" or similar
  - Quests with no rewards: Don't render RewardDisplay if empty
  - Very long quest names: Test text wrapping and truncation
  - Quests with 100+ objectives: Test pagination or virtualization
  - Quest status changes mid-view: Decide on auto-update vs. manual refresh
  - Failed quests: Verify displayed correctly with distinct styling
- [x] T065 [P] API error handling:
  - 404 errors: Show "Quest not found" user-friendly message
  - 409 errors: Show "Quest already accepted" or similar
  - 422 errors: Show "Prerequisites not met" or "Max quests reached"
  - Network errors: Show retry button and clear error message
  - Timeout errors: Show user can try again, suggest connection check

### Deployment & Final Validation

- [x] T066 Update main game navigation to include quest tracker:
  - Add link/button in main game menu to quest tracker
  - Route setup: `frontend/src/src/routes.tsx` or App routing config
  - Ensure quest tracker accessible during gameplay
- [x] T067 Run quickstart.md validation:
  - Follow quickstart.md implementation steps
  - Verify each component loads and works independently
  - Test complete user flow start-to-end
  - Verify all acceptance scenarios from spec.md pass
- [x] T068 [P] Final documentation:
  - Update `frontend/README.md` to mention quest tracking feature
  - Document new files/directories added in this feature
  - Link to `frontend/src/components/quest-tracking/README.md`
  - Update `IMPLEMENTATION_SUMMARY.md` with completion notes
- [x] T069 Code cleanup and final review:
  - Remove any debug console.log statements
  - Check for commented-out code and remove
  - Ensure consistent code formatting (ESLint + Prettier)
  - Run: `npm run lint` and fix any issues
  - Run: `npm run build` to verify production build succeeds
- [x] T070 Accessibility audit final pass:
  - Run full accessibility audit using tools
  - Create or update `frontend/ACCESSIBILITY_AUDIT_REPORT.md`
  - Verify: WCAG AA compliance on all components
  - Verify: No keyboard traps, all controls reachable
  - Verify: Screen reader announces all content

**Checkpoint**: Quest tracking feature complete, tested, documented, and ready for production!

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-8)**: All depend on Foundational completion
  - Can proceed sequentially (P1 → P2) or in parallel if staffed
  - MVP = Phases 1-5 (US1-3 complete)
  - Full feature = Phases 1-8 (all user stories)
- **Polish (Phase 9)**: Depends on user stories to be feature-complete

### Critical Path (MVP - Fastest to Value)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008)
3. Complete Phase 3: User Story 1 (T009-T015)
4. Complete Phase 4: User Story 2 (T016-T022)
5. Complete Phase 5: User Story 3 (T023-T027)
6. **STOP AND VALIDATE**: MVP achieved - players can track active quests with progress
7. Optional: Continue with Phases 6-8 for additional features (filters, history, rewards)
8. Optional: Phase 9 for polish and optimization

### User Story Dependencies

- **US1**: Depends on Phase 2 only - independent, can start immediately after Foundational
- **US2**: Depends on Phase 2 + US1 foundation (needs QuestList working)
- **US3**: Depends on Phase 2 + US1/US2 (adds progress display to existing components)
- **US4**: Depends on Phase 2 (independent filter feature, enhances US1)
- **US5**: Depends on Phase 2 (independent history feature)
- **US6**: Depends on Phase 2 (independent rewards display, enhances US2)

### Within Each User Story

1. Write tests FIRST (TDD approach) - ensure they FAIL before implementation
2. Implement components bottom-up:
   - Base/reusable components first (ProgressBar)
   - Then composite components (ObjectiveItem, QuestListItem)
   - Then containers (QuestList, QuestDetail)
   - Then integration (page/route updates)
3. Test each component in isolation
4. Verify user story complete per acceptance scenarios

### Parallel Opportunities

#### Phase 1 (Setup) - All marked [P] can run in parallel:

- T001: Copy types (one person)
- T002: Create questService (one person)
- T003: Create type barrel export (one person)
- T004: Create service barrel export (one person)

#### Phase 2 (Foundational) - All marked [P] can run in parallel:

- T005: Create useQuestTracking hook (one person)
- T006-T008: Create directory structure and barrel exports (one person)

#### Phase 3 (User Story 1) - Tests and components can parallelize:

```bash
# Tests (T009-T011) - all can run together if shared test fixtures:
T009: QuestList tests
T010: QuestListItem tests
T011: Integration tests

# Components (T012-T015) - reusable components first, then dependent ones:
# Parallel batch 1 (independent):
T012: QuestListItem component
T013: ProgressBar component

# Then sequence:
T014: QuestList (depends on T012, T013)
T015: Page integration (depends on T014)
```

#### Phase 4 (User Story 2) - Similar parallelization:

```bash
# Tests:
T016: QuestDetail tests
T017: ObjectiveItem tests
T018: Integration tests

# Components - parallel:
T019: ObjectiveItem (depends on T013 ProgressBar)
T020: RewardDisplay (independent)

# Then sequence:
T021: QuestDetail (depends on T019, T020)
T022: Page integration (depends on T021)
```

#### Phase 5 (User Story 3) - Mostly parallel, minimal new work:

```bash
# Tests - all can run together:
T023: ProgressBar tests
T024: ObjectiveItem progress tests (extends T017)

# Implementation - mostly updates to existing components:
T025-T027: Updates/verification of existing components
```

#### Phase 6-9 (Remaining work) - Can parallelize by developer:

- Developer A: US4 (Filter)
- Developer B: US5 (History)
- Developer C: US6 (Rewards)
- Developer D: Phase 9 polish (accessibility, performance, docs)

### Recommended Team Allocation

**Single Developer** (sequential):

1. Complete Phases 1-5 to MVP (T001-T027, ~3-4 weeks)
2. Add US4-6 if time permits (T028-T044, ~2 weeks)
3. Polish as needed (T045-T070, ~1 week)

**Two Developers**:

1. Both complete Phases 1-2 together (T001-T008, ~2 days)
2. Developer A: Phase 3 (US1, T009-T015)
3. Developer B: Phase 4 (US2, T016-T022) in parallel
4. Both: Phase 5 (US3, T023-T027)
5. Developer A: Phase 6 (US4, T028-T033)
6. Developer B: Phase 7 (US5, T034-T038)
7. For US6: Whoever finishes first picks up (T039-T044)
8. Both: Phase 9 polish (T045-T070)

**Three+ Developers**:

1. All: Phases 1-2 (T001-T008)
2. Parallel: Dev A (US1-2), Dev B (US3-4), Dev C (US5-6)
3. All: Phase 9 polish if time allows

---

## Parallel Example: Phase 3 (User Story 1)

### Parallel Test Development (T009-T011)

```bash
# Developer 1: QuestList component tests
Task T009: frontend/tests/components/quest-tracking/QuestList.test.tsx
- Rendering list
- Empty state
- Click handlers
- Accessibility (role, keyboard)

# Developer 2: QuestListItem component tests
Task T010: frontend/tests/components/quest-tracking/QuestListItem.test.tsx
- Quest name/status
- Progress display
- Click callback
- Keyboard navigation

# Developer 1 or 2: Integration test
Task T011: frontend/tests/integration/activeQuestsList.test.tsx
- Full user flow
```

### Parallel Component Development (T012-T015)

```bash
# Batch 1 (T012-T013): Base components - can develop in parallel
# Developer 1:
Task T012: frontend/src/components/quest-tracking/QuestListItem.tsx
- Reusable quest card item
- No dependencies

# Developer 2:
Task T013: frontend/src/components/quest-tracking/ProgressBar.tsx
- Reusable progress indicator
- No dependencies

# Batch 2 (Sequential, needs T012 + T013):
# Whoever finishes first takes T014:
Task T014: frontend/src/components/quest-tracking/QuestList.tsx
- Uses QuestListItem (T012) + ProgressBar (T013)

# Then:
Task T015: Update quest tracker page
- Uses QuestList (T014)
```

---

## Implementation Strategy

### Recommended Approach: MVP-First, Incremental Delivery

#### Week 1: Foundation & MVP Core

- Phases 1-2: Setup & Foundational (T001-T008) - 3-4 days
- Phase 3-5: User Stories 1-3 (T009-T027) - 4-5 days
- **RESULT**: MVP complete - players can see active quests with progress
- **Deploy**: To staging for initial testing

#### Week 2+: Extended Features

- Phase 6: User Story 4 - Filtering (T028-T033) - 1-2 days
- Phase 7: User Story 5 - History (T034-T038) - 1-2 days
- Phase 8: User Story 6 - Rewards (T039-T044) - 1-2 days
- **RESULT**: Full feature complete
- **Deploy**: To staging/production after Phase 5 validation passes

#### Week 3+: Polish

- Phase 9: Accessibility, performance, docs (T045-T070) - 2-3 days
- **RESULT**: Production-ready with full WCAG AA compliance
- **Deploy**: To production

### TDD Approach (Test-Driven Development)

Each user story follows TDD workflow:

1. **RED**: Write tests for feature (T009-T011 for US1, etc.)
   - Ensure all tests FAIL before implementation
   - Tests verify acceptance scenarios from spec.md

2. **GREEN**: Implement minimum code to make tests pass (T012-T015)
   - Focus on passing the tests
   - Don't add unnecessary complexity

3. **REFACTOR**: Improve implementation quality (T045-T070)
   - Accessibility enhancements
   - Performance optimization
   - Documentation polish

### Risk Mitigation

**Timeline Risk**: If running behind, scope down:

- MVP requirement: US1 + US2 + US3 (Phases 3-5)
- P2 stories (US4-6) can be deferred
- Polish (Phase 9) can be staged (A11y first, perf second)

**Quality Risk**: To ensure quality:

- TDD for all components (write tests first)
- Pair programming for complex components
- Code review before each phase completion
- Accessibility testing with actual screenreader (not just ARIA validation)

**Integration Risk**: Features integrate cleanly if:

- Each user story tested independently before merging
- Share useQuestTracking hook carefully (coordinate filtering logic)
- Use feature flags if deploying incrementally to production

---

## Success Criteria & Validation

### Functional Validation (Per User Story)

- [ ] **US1**: Players can open quest tracker and see all active quests listed with names and current status
- [ ] **US2**: Players can click any quest to view full details including description, all objectives, and quest giver
- [ ] **US3**: Each objective shows progress (% complete or counter), progress bars show visual fill, completed objectives marked distinctively
- [ ] **US4**: Filtering by Active/Completed/Failed works, filters can be combined, list updates immediately on filter change
- [ ] **US5**: Completed quests display in history with completion dates, can view details of historical quests
- [ ] **US6**: Quest details show all rewards with types clearly labeled, different reward types distinguished visually

### Quality Thresholds

- **Performance**: <1s quest list load, <500ms detail fetch, <300ms filter switch (T053-T056)
- **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support (T045-T048)
- **Test Coverage**: 80%+ line coverage, 90%+ service coverage (T060)
- **Type Safety**: No any types, strict mode enabled, all interfaces typed (T050-T051)
- **Documentation**: JSDoc on all components, README.md for feature (T049, T052, T068)

### Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Accessibility audit passes (T045-T048)
- [ ] Performance targets met (T053-T056)
- [ ] Documentation complete (T049, T052, T068)
- [ ] Quickstart.md validation successful (T067)
- [ ] Final code review approved

---

## Notes for Implementation

### Component Organization Best Practice

```
frontend/src/components/quest-tracking/
├── QuestList.tsx          # Container component
├── QuestListItem.tsx      # List item component
├── QuestDetail.tsx        # Detail modal/panel
├── ObjectiveItem.tsx      # Objective display
├── ProgressBar.tsx        # Reusable progress
├── QuestFilter.tsx        # Filter controls
├── CompletedQuests.tsx    # History display
├── RewardDisplay.tsx      # Rewards display
├── index.ts               # Barrel export
└── README.md              # Feature documentation
```

### Testing Best Practice

```
frontend/tests/
├── components/quest-tracking/
│   ├── QuestList.test.tsx
│   ├── QuestListItem.test.tsx
│   ├── QuestDetail.test.tsx
│   ├── ObjectiveItem.test.tsx
│   ├── ProgressBar.test.tsx
│   ├── QuestFilter.test.tsx
│   └── CompletedQuests.test.tsx
├── services/
│   └── questService.test.ts
├── hooks/
│   └── useQuestTracking.test.ts
├── integration/
│   ├── activeQuestsList.test.tsx
│   ├── questDetails.test.tsx
│   └── completedQuestsHistory.test.tsx
├── fixtures/
│   └── quest-fixtures.ts
└── setup.ts
```

### Key Files to Reference

- **Design**: `/specs/011-quest-tracking-ui/spec.md` - User stories and acceptance criteria
- **Architecture**: `/specs/011-quest-tracking-ui/plan.md` - Technical decisions
- **API Contract**: `/specs/011-quest-tracking-ui/contracts/quest-api.md` - Endpoint specs
- **Type Definitions**: `/specs/011-quest-tracking-ui/contracts/quest-types.ts` - API types
- **Data Model**: `/specs/011-quest-tracking-ui/data-model.md` - Entity relationships
- **Research**: `/specs/011-quest-tracking-ui/research.md` - Technical decisions & patterns
- **Quickstart**: `/specs/011-quest-tracking-ui/quickstart.md` - Step-by-step implementation guide

### Common Pitfalls to Avoid

1. **Not writing tests first** - Commit to TDD approach for US1-6 tests
2. **Skipping accessibility** - Allocate time for Phase 9 accessibility work (T045-T048)
3. **Tight coupling** - Each component should be independently testable
4. **Performance ignored** - Profile and benchmark during Phase 9 (T053-T056)
5. **Documentation afterthought** - Write JSDoc as you implement (T049)
6. **No error handling** - Every API call needs error handling (research.md shows pattern)
7. **Assuming backend data** - Verify API response format matches types (verify in T001)

---

## Final Notes

### This is the MVP-first approach:

1. **Phases 1-5** deliver core quest tracking (users see active quests with progress)
2. **Phases 6-8** add quality-of-life features (filtering, history, rewards)
3. **Phase 9** polishes everything (accessibility, performance, documentation)

### Each phase is independently valuable:

- Stop after Phase 5 if timeline tight: MVP complete, players can track progress
- Add Phases 6-8 as time permits: Enhance user experience with filters and history
- Phase 9 ensures production readiness: WCAG AA compliance, optimized performance

### Success comes from:

1. **Clear testing** - TDD discipline ensures correctness
2. **Accessibility first** - Phase 9 isn't optional, integrate throughout
3. **Performance monitoring** - T053 benchmark against targets
4. **Documentation** - Future developers depend on your JSDoc and READMEs
5. **Incremental delivery** - Deploy MVP after Phase 5, gather feedback, iterate

---

**Total Task Count**: 70 tasks
**MVP (Phases 1-5)**: 27 tasks (~2-3 weeks, single developer)
**Full Feature (Phases 1-8)**: 44 tasks (~4-5 weeks, single developer)
**With Polish (All Phases)**: 70 tasks (~5-6 weeks, single developer)

**Recommended Start**: Monday morning, Phase 1 setup
**Milestone 1**: Friday EOD Phase 2 complete (foundation ready)
**Milestone 2**: Next Friday EOD Phase 5 complete (MVP ready)
