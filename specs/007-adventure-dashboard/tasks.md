---
description: "Task list for Adventure Dashboard feature implementation"
---

# Tasks: Adventure Dashboard

**Input**: Design documents from `/specs/007-adventure-dashboard/`
**Prerequisites**:

- ✅ plan.md - Implementation plan complete
- ✅ spec.md - 4 user stories with P1-P4 priorities
- ✅ research.md - React 18 + Vite + TanStack Query tech decisions documented
- ✅ data-model.md - Adventure entity and component data flows defined
- ✅ contracts/API.md - 5 REST endpoints documented

**Status**: Ready for Phase 2 implementation

---

## Format: `[ID] [P?] [Story?] Description with file path`

- **[ID]**: Task identifier (T001, T002, T003...)
- **[P]**: Can run in parallel (different files, no inter-dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3], [US4])
- File paths are relative to `frontend/` directory for this SPA project

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create React SPA project structure and install dependencies

### Vite + React 18 Setup

- [x] T001 Create `frontend/` directory with Vite project scaffold
- [x] T002 [P] Install core dependencies in frontend/package.json: React 18, React Router v6, TanStack Query v5
- [x] T003 [P] Install build tools in frontend/package.json: Vite v7, TypeScript 5.9+, @vitejs/plugin-react
- [x] T004 [P] Install styling in frontend/package.json: Tailwind CSS v4, PostCSS, Autoprefixer
- [x] T005 [P] Install testing in frontend/package.json: Vitest, @testing-library/react, React Testing Library
- [x] T006 [P] Install accessibility/utils in frontend/package.json: react-focus-lock, openapi-typescript
- [x] T007 [P] Create frontend/tsconfig.json with strict TypeScript settings, JSX transform, path aliases
- [x] T008 [P] Create frontend/vite.config.ts with React plugin, dev server config, optimized deps
- [x] T009 [P] Create frontend/tailwind.config.ts with extended breakpoints (320px-2560px+), touch spacing
- [x] T010 [P] Create frontend/postcss.config.js for Tailwind integration
- [x] T011 [P] Create frontend/.env.example with VITE_API_URL and VITE_DEBUG_API variables
- [x] T012 Create frontend/index.html with React mount point (#root) and meta tags for viewport/charset
- [x] T013 Create frontend/src/main.tsx with React.createRoot and app mounting

### Directory Structure

- [x] T014 [P] Create frontend/src/ directory structure: pages/, components/, hooks/, services/, types/, utils/
- [x] T015 [P] Create frontend/tests/ directory structure: components/, hooks/
- [x] T016 [P] Create frontend/src/index.css with Tailwind @imports and custom base styles

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on  
**⚠️ CRITICAL**: No user story work can begin until this phase completes

### API Integration & Type Generation

- [x] T017 Generate TypeScript types from backend OpenAPI spec
  - Command: `npx openapi-typescript ../../swagger-openapi.json -o src/types/api.ts`
  - File: `frontend/src/types/api.ts` (auto-generated)
  - Verify: Check that Adventure, response types exist in generated file

- [x] T018 [P] Create API configuration in frontend/src/services/api.ts
  - Export `API_URL` from environment variables (VITE_API_URL)
  - Export helper function `getAuthToken()` for retrieving JWT from localStorage
  - Export error handling utilities for user-friendly messages

- [x] T019 [P] Create API service layer in frontend/src/services/api.ts with methods:
  - `api.adventures.list(filters?)` → GET /api/adventures
  - `api.adventures.create(name)` → POST /api/adventures
  - `api.adventures.delete(id)` → DELETE /api/adventures/{id}
  - All methods must include Authorization header and error handling

### Router Setup

- [x] T020 Create root layout component in frontend/src/components/RootLayout.tsx
  - Provides header with navigation
  - Renders `<Outlet />` for nested routes
  - Includes error boundary and provider wrappers

- [x] T021 Create frontend/src/App.tsx with React Router v6 setup
  - Define route configuration with `createBrowserRouter`
  - Include root layout and DashboardPage route
  - Error boundary route for 404/errors
  - Configure dev/production base paths

### TanStack Query Setup

- [x] T022 Create TanStack Query hooks in frontend/src/hooks/useAdventures.ts
  - `useAdventures()` → useQuery for listing adventures (staleTime: 5min, gcTime: 10min)
  - `useCreateAdventure()` → useMutation with optimistic update
  - `useDeleteAdventure()` → useMutation with optimistic update
  - All hooks must handle loading, error, and success states

- [x] T023 Create QueryClient and QueryClientProvider in frontend/src/App.tsx
  - Configure default options: staleTime, gcTime, retry strategy
  - Wrap router with `<QueryClientProvider>`

### Component Foundations

- [x] T024 [P] Create error handling wrapper in frontend/src/components/ErrorBoundary.tsx
  - Catch React errors and display user-friendly fallback
  - Include retry button for failed data loads

- [x] T025 [P] Create frontend/src/utils/formatters.ts with utility functions:
  - `formatDate(isoString)` → Format "Jan 29, 2026"
  - `formatProgress(percentage)` → Format progress as "45%"
  - `truncateString(str, maxLength)` → Truncate long adventure names with ellipsis

- [x] T026 [P] Create frontend/src/utils/errorMessages.ts with user-friendly error mapping:
  - Network errors → "Unable to connect. Check your internet."
  - 404 errors → "Adventure not found"
  - 409 Conflict → "An adventure with this name already exists"
  - 500 errors → "Something went wrong. Please try again later."

**Checkpoint**: Foundation complete - all user stories can now be implemented in parallel

---

## Phase 3: User Story 1 - View Adventure List with Metadata (Priority: P1) 🎯 MVP

**Goal**: Display loading dashboard with list of adventures, their metadata, and empty state handling

**Independent Test**: Load dashboard → verify adventures display with name, creation date, progress bar; verify loading skeleton appears; verify empty state message shows when no adventures exist

### Implementation for User Story 1

- [x] T027 Create dashboard page component in frontend/src/pages/DashboardPage.tsx
  - Import `useAdventures()` hook
  - Render AdventureList component with adventures data
  - Pass isLoading, error, adventures props to AdventureList
  - Include "Create Adventure" button at top (for US2)

- [x] T028 [P] Create adventure list container in frontend/src/components/AdventureList.tsx
  - Display grid of AdventureCard components
  - Show loading skeletons while fetching (via LoadingSkeleton)
  - Show error message with retry button on API failure
  - Show empty state when adventures array is empty
  - Handle navigation (from US3)
  - Include filter/sort UI (optional enhancement)

- [x] T029 [P] Create individual adventure card in frontend/src/components/AdventureCard.tsx
  - Display adventure name as heading (accessible `<article>` element)
  - Display formatted creation date with `<time>` element
  - Display progress bar showing 0-100% completion
  - Display last played timestamp (if available)
  - Implement hover/focus states for accessibility
  - Include interactive elements for selection (US3) and deletion (US4)
  - Ensure 44x44px minimum touch targets with proper spacing

- [x] T030 [P] Create loading skeleton component in frontend/src/components/LoadingSkeleton.tsx
  - Create skeleton card that mimics AdventureCard layout
  - Accept `count` prop to show multiple skeletons
  - Use Tailwind's `animate-pulse` utility for loading effect
  - Appear within 100ms of dashboard load (performance requirement)

- [x] T031 Add TanStack Query integration in frontend/src/pages/DashboardPage.tsx
  - Call `useAdventures()` to fetch list
  - Display adventures in AdventureList
  - Show loading/error/empty states based on query state
  - Implement retry logic on API failure

- [x] T032 Implement responsive dashboard grid in frontend/src/components/AdventureList.tsx
  - Use Tailwind grid classes: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - Ensure no horizontal scrolling on 320px-2560px+ viewports
  - Apply proper gap/padding for touch-friendly spacing

- [x] T033 Add WCAG AA accessibility in frontend/src/components/AdventureList.tsx and AdventureCard.tsx
  - Semantic HTML: use `<article>`, `<h2>`, `<time>` elements
  - ARIA labels: `aria-label="Adventure name: The Lost Kingdom"`
  - Color contrast: 4.5:1 ratio for text (verify with Tailwind color utilities)
  - Keyboard navigation: Tab through all cards, Enter to select
  - Focus indicators: visible focus ring on all interactive elements

**Checkpoint**: User Story 1 complete - dashboard displays adventures list, metadata, loading state, and empty state. Test by loading dashboard and verifying all display scenarios.

---

## Phase 4: User Story 2 - Create New Adventure (Priority: P2)

**Goal**: Allow players to create new adventures with form validation and API integration

**Independent Test**: Click "Create Adventure" → enter name → submit → verify new adventure appears in list with correct metadata (name, today's date, 0% progress)

### Implementation for User Story 2

- [x] T034 Create create adventure form component in frontend/src/components/CreateAdventureForm.tsx
  - Form with single text input for adventure name
  - Input constraints: required, 1-100 characters
  - Real-time validation on blur with error messages
  - Submit button disabled while loading or if form invalid
  - Include form JSDoc comment with prop documentation

- [x] T035 [P] Add form validation in frontend/src/components/CreateAdventureForm.tsx
  - Validate name is not empty → error: "Adventure name is required"
  - Validate name ≤ 100 characters → error: "Name must be 100 characters or less"
  - Show field-level error messages beneath input
  - Clear errors on successful submission
  - Use `aria-invalid` and `aria-describedby` for accessibility

- [x] T036 [P] Create modal/dialog wrapper in frontend/src/components/CreateAdventureForm.tsx
  - Conditionally render form in a modal overlay
  - Accept isOpen prop or render within page as overlay
  - Implement close button and cancel button to dismiss form
  - Use semantic `<form>` element with proper ARIA attributes
  - Manage focus: auto-focus input on open, restore focus on close (use `useRef`)

- [x] T037 Integrate form with TanStack Query mutation in frontend/src/components/CreateAdventureForm.tsx
  - Import `useCreateAdventure()` hook
  - Call mutation on form submit
  - Show loading state on submit button: "Creating..."
  - Disable submit button during mutation
  - Display error message if mutation fails with retry option
  - Close form and clear input on successful creation
  - Show success toast/notification: "Adventure created successfully!"

- [x] T038 [P] Create modal dialog component in frontend/src/components/CreateAdventureForm.tsx (or separate ConfirmDialog.tsx base)
  - Responsive modal that works on mobile (320px) to desktop (2560px+)
  - Overlay blocks interaction with page behind modal
  - Implement close on Escape key
  - Implement focus trap using react-focus-lock
  - Use `role="dialog"` and `aria-modal="true"` for accessibility

- [x] T039 Add optimistic UI update in frontend/src/hooks/useAdventures.ts
  - In `useCreateAdventure()`, implement `onSuccess` callback
  - Automatically refetch adventures list or update cache with new adventure
  - Display instant feedback without waiting for full list refresh

- [x] T040 Implement error handling for create operation in frontend/src/components/CreateAdventureForm.tsx
  - Parse API error response and show user-friendly message
  - 400 validation error → show field-specific error messages
  - 409 Conflict → "An adventure with this name already exists"
  - 500 Server error → "Failed to create adventure. Please try again."
  - Include retry button on error

- [x] T041 Add accessibility features in frontend/src/components/CreateAdventureForm.tsx
  - Generate unique ID for form fields using `useId()` hook
  - Associate labels with inputs using `htmlFor`
  - Include `aria-label` for form dialog: "Create new adventure"
  - Manage focus trap in modal using react-focus-lock
  - Test keyboard-only completion: Tab through fields, Enter to submit, Escape to cancel

**Checkpoint**: User Story 2 complete - players can create adventures with form validation, loading states, and error handling. Test by creating adventure, verifying it appears in list, and testing validation errors.

---

## Phase 5: User Story 3 - Select Adventure to Continue Playing (Priority: P3)

**Goal**: Navigate to game when player selects an adventure

**Independent Test**: Click adventure card → verify navigation to game screen with adventure loaded at correct scene

### Implementation for User Story 3

- [x] T042 Add click handler to AdventureCard in frontend/src/components/AdventureCard.tsx
  - Accept `onSelect` prop callback
  - Call callback on card click
  - Navigate using React Router: `useNavigate()` to `/game/{adventureId}`
  - Show loading indicator during navigation transition

- [x] T043 [P] Create loading indicator component in frontend/src/components/AdventureCard.tsx or reuse LoadingSkeleton
  - Show spinner/skeleton while navigating to game
  - Prevent multiple navigations on rapid clicks
  - Display "Loading adventure..." text for accessibility

- [x] T044 [P] Implement cursor/hover feedback in frontend/src/components/AdventureCard.tsx
  - Add `hover:shadow-md` or similar elevation change
  - Add `hover:bg-gray-50` or color change background
  - Ensure 44x44px minimum touch target with proper padding
  - Visual feedback should be clear and accessible

- [x] T045 Implement route handler in frontend/src/App.tsx
  - Add `/game/:adventureId` route
  - Create GamePage component placeholder: frontend/src/pages/GamePage.tsx
  - Load adventure details via TanStack Query prefetch in route loader
  - Pass adventure data to game component

- [x] T046 [P] Create game page component in frontend/src/pages/GamePage.tsx
  - Accept adventureId from route params using `useParams()`
  - Fetch full adventure details including currentSceneId
  - Load game at specified scene
  - Display loading state while fetching adventure details

- [x] T047 Add error handling for invalid adventure selection in frontend/src/pages/GamePage.tsx
  - Handle 404 Not Found → "Adventure not found"
  - Display error message and back button to dashboard
  - Return to dashboard if error occurs

- [x] T048 Add accessibility to card click interaction in frontend/src/components/AdventureCard.tsx
  - Ensure card is keyboard-accessible (Tab to card, Enter to select)
  - Use `role="button"` if not using `<button>` element
  - Include `aria-label` describing the action: "Select The Lost Kingdom adventure"
  - Provide visible focus indicator when focused via keyboard

**Checkpoint**: User Story 3 complete - players can select adventures and navigate to game. Test by clicking adventure and verifying navigation to game screen.

---

## Phase 6: User Story 4 - Delete Adventure with Confirmation (Priority: P4)

**Goal**: Allow players to delete adventures with confirmation dialog

**Independent Test**: Click delete button → confirm in dialog → verify adventure removed from list and success message displayed

### Implementation for User Story 4

- [x] T049 Create confirmation dialog component in frontend/src/components/ConfirmDialog.tsx
  - Accept `isOpen`, `title`, `message`, `onConfirm`, `onCancel` props
  - Display dialog with adventure name clearly visible
  - Example title: "Delete Adventure"
  - Example message: "Are you sure you want to delete 'The Lost Kingdom'? This action cannot be undone."
  - Include "Cancel" and "Delete" buttons

- [x] T050 [P] Implement focus management in frontend/src/components/ConfirmDialog.tsx
  - Use react-focus-lock to trap focus within dialog
  - Auto-focus "Cancel" button on open (safest default)
  - Implement Escape key to cancel
  - Restore focus to delete button after dialog closes
  - Accessible to keyboard-only users: Tab through buttons, Enter to select, Escape to cancel

- [x] T051 [P] Add accessibility to dialog in frontend/src/components/ConfirmDialog.tsx
  - Semantic HTML: Use `<div role="alertdialog" aria-modal="true">`
  - ARIA labels: `aria-labelledby` (title ID), `aria-describedby` (message ID)
  - Generate unique IDs using `useId()` for title and description
  - Color contrast: danger buttons red (3:1+ ratio on red background)
  - Touch targets: 44x44px minimum for both buttons

- [x] T052 Add delete button to AdventureCard in frontend/src/components/AdventureCard.tsx
  - Icon button or text button with delete/trash icon
  - Click handler opens confirmation dialog
  - Use `aria-label` for screen readers: "Delete adventure: The Lost Kingdom"
  - Show loading indicator on button while deleting

- [x] T053 Integrate delete mutation in frontend/src/components/AdventureCard.tsx
  - Import `useDeleteAdventure()` hook
  - On confirm in dialog, call delete mutation with adventure ID
  - Show loading state: button spinner, disabled state
  - Disable delete button during mutation
  - Close dialog on success
  - Show error message on failure with retry option

- [x] T054 [P] Implement optimistic UI in frontend/src/hooks/useAdventures.ts
  - In `useDeleteAdventure()` mutation, implement cache update in `onSuccess`
  - Immediately remove adventure from adventures list cache
  - Rollback on error (TanStack Query handles automatically)
  - Show success notification: "Adventure deleted successfully"

- [x] T055 [P] Add error handling for delete operation in frontend/src/components/AdventureCard.tsx
  - Parse API error response per contracts/API.md
  - 404 Not Found → "Adventure no longer exists"
  - 409 Conflict → "Adventure cannot be deleted while in progress"
  - 500 Server error → "Failed to delete adventure. Please try again."
  - Show error with retry button, adventure remains visible until retry succeeds

- [x] T056 Implement state management for delete dialog in frontend/src/pages/DashboardPage.tsx
  - Track which adventure (if any) is being deleted
  - Pass to AdventureCard's onDelete callback
  - Pass state to ConfirmDialog: isOpen, selectedAdventure, isLoading
  - Clear state after successful deletion or cancel

- [x] T057 Add keyboard accessibility to delete interaction
  - Delete button reachable via Tab navigation
  - Enter key opens confirmation dialog
  - Focus management: Tab through dialog buttons, Escape to cancel
  - Restore focus to delete button after dialog closes
  - Test with keyboard-only navigation (no mouse)

**Checkpoint**: User Story 4 complete - players can delete adventures with confirmation dialog and error handling. Test by deleting adventure, confirming in dialog, and verifying removal from list.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improve quality, performance, and maintainability across all user stories

### Documentation & Code Quality

- [x] T058 [P] Add JSDoc comments to all components in frontend/src/components/
  - Document component purpose, props, and return type
  - Include usage example for complex components
  - Document accessibility features in JSDoc

- [x] T059 [P] Add JSDoc comments to all hooks in frontend/src/hooks/useAdventures.ts
  - Document query behavior, cache strategy, and mutations
  - Include return type and error handling details

- [x] T060 [P] Add JSDoc comments to utility functions in frontend/src/utils/
  - Document error message mapping
  - Document formatter functions and their transformations

- [x] T061 [P] Update frontend/README.md with project setup and development workflow
  - Installation steps
  - Environment variable configuration
  - Development server startup
  - Build and deployment instructions
  - Testing commands
  - How to extend with new features

### Performance Optimization

- [x] T062 [P] Optimize component rendering with React.memo in frontend/src/components/AdventureCard.tsx
  - Wrap component in `React.memo()` to prevent unnecessary re-renders
  - Verify props are stable (use useCallback for callbacks)

- [x] T063 Lazy load DashboardPage in frontend/src/App.tsx
  - Use `React.lazy()` for DashboardPage
  - Wrap with `<Suspense>` showing LoadingSkeleton fallback
  - Verify bundle size reduction

- [x] T064 [P] Profile bundle size and optimize in frontend/
  - Run `npm run build` and check dist/ size
  - Verify gzipped bundle < 100KB
  - Optimize imports: remove unused dependencies
  - Check Vite build analysis if needed

- [x] T065 [P] Test performance metrics in frontend/
  - Verify initial load < 3 seconds on 3G connection
  - Verify API calls complete in < 200ms (per foundation)
  - Test with DevTools Network throttling

### Testing & Validation

- [x] T066 [P] Run TypeScript compile check: `npx tsc --noEmit` in frontend/
  - Verify no type errors exist
  - Verify generated OpenAPI types are correct
  - Verify no `any` types used in components

- [x] T067 [P] Run linting: `npm run lint` (if ESLint configured)
  - Fix any linting errors or warnings
  - Ensure consistent code style

- [x] T068 [P] Manual accessibility audit in frontend/
  - Use axe DevTools browser extension on dashboard
  - Verify WCAG AA compliance
  - Test keyboard-only navigation: Tab through all elements, Enter/Space on buttons, Escape on dialogs
  - Test with screen reader (Windows Narrator, macOS VoiceOver, or NVDA)

- [x] T069 Validate API contracts in frontend/src/services/api.ts
  - Test against real backend API (staging environment)
  - Verify request/response formats match contracts/API.md
  - Verify error messages are user-friendly (no technical jargon)

- [x] T070 [P] Test responsive design across viewports in frontend/
  - Test on 320px width (mobile portrait)
  - Test on 640px width (mobile landscape)
  - Test on 768px width (tablet)
  - Test on 1024px+ width (desktop)
  - Verify no horizontal scrolling at any viewport size
  - Verify touch targets are 44x44px minimum on mobile

- [x] T071 [P] Test error scenarios in frontend/ (manual testing)
  - Stop backend API and test network error handling
  - Test 404/409/500 error responses
  - Test timeout handling (API delay > 30 seconds)
  - Verify error messages are user-friendly

### Feature Completion

- [x] T072 [P] Verify quickstart.md setup steps work end-to-end
  - Follow quickstart.md exactly (fresh environment)
  - Verify all npm install commands work
  - Verify dev server starts without errors
  - Verify TypeScript types generate correctly

- [x] T073 Add feature flags or configuration options in frontend/.env.example
  - `VITE_DEBUG_API=true` to log API calls
  - `VITE_MOCK_API=false` to toggle MSW mocking (if using)
  - Document feature flags in README

- [x] T074 [P] Create GitHub Actions CI/CD workflow (if applicable) in .github/workflows/
  - Install dependencies
  - Run TypeScript check
  - Run linting (if configured)
  - Build production bundle
  - Deploy to staging (if automated)

- [x] T075 [P] Write deployment guide in frontend/DEPLOYMENT.md
  - Steps to deploy frontend to production
  - Environment variable configuration for production
  - Health check endpoints (if any)
  - Rollback procedures

### Final Validation

- [x] T076 Run comprehensive browser testing in frontend/
  - Chrome, Firefox, Safari, Edge on desktop
  - Chrome, Firefox on mobile (iOS/Android)
  - Verify all user stories work correctly
  - Verify no console errors or warnings

- [x] T077 Verify all user stories meet acceptance criteria from spec.md
  - US1: All adventures display with metadata, empty state works, loading skeleton appears, error retry works
  - US2: Form validates, create succeeds, error messages show, button disabled during submission
  - US3: Click navigates to game, loading indicator shows, error handling works
  - US4: Delete button shows, confirmation dialog appears, deletion removes adventure, error handling works

- [x] T078 [P] Update project documentation in specs/007-adventure-dashboard/
  - Update quickstart.md if workflow changed
  - Add any post-implementation decisions to research.md
  - Create IMPLEMENTATION_NOTES.md with lessons learned

**Checkpoint**: All user stories complete, tested, and documented. Ready for deployment.

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - can start immediately ✅
2. **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
3. **User Stories (Phases 3-6)**: All depend on Foundational phase completion
   - Can proceed in priority order: US1 → US2 → US3 → US4
   - Or all in parallel if team capacity allows
4. **Polish (Phase 7)**: Depends on all desired user stories being complete

### Within Phase 2 (Foundational)

- Tasks T002-T006: All dependencies (npm packages) - can run parallel setup
- Task T017: Requires OpenAPI spec to exist
- Task T018: Depends on T017 (generated types)
- Task T019: Depends on T018 (uses generated types in service layer)
- Task T020: No dependencies - can run parallel with T018-T019
- Task T021: Depends on T020 (uses RootLayout)
- Task T022: Depends on T019 (uses API client)
- Task T023: Depends on T022 (uses hooks)

### Within Each User Story

1. **Build foundation components first**: T0XX-T0XX (setup specific to story)
2. **Hook up data fetching**: T0XX (TanStack integration)
3. **Implement error handling**: T0XX
4. **Add accessibility**: T0XX (last, ensures foundation is solid)
5. **Test**: Manual verification per checkpoint

### Parallel Execution Examples

**All developers:**

```
Phase 1: Setup (everyone together)
Phase 2: Foundational (everyone together) ← CRITICAL GATE
```

**Then split team:**

```
Developer A: US1 (View list)              ← Start first (MVP foundation)
Developer B: US2 (Create form)            ← Can start immediately after foundation
Developer C: US3 (Select adventure)       ← Can start immediately after foundation
Developer D: US4 (Delete)                 ← Can start immediately after foundation
```

**All together:**

```
Phase 7: Polish (everyone)
Validation & deployment
```

### Task Dependencies Graph

```
T001-T016 ──┐
            ├─→ T017 (OpenAPI generation)
T001-T016 ──┘
                ├─→ T018 (API config) ──→ T019 (API service) ──→ T022 (Hooks)
                ├─→ T020 (Layout) ──────┐
                ├─→ T024-T026 (utils) ───\
                └→ T021 (Router)  ──────→ T023 (QueryClient) ──→ [US1, US2, US3, US4]

[US1] ──→ [US2] ──→ [US3] ──→ [US4] (sequential if 1 developer)
[US1] ═╪═ [US2] ═╪═ [US3] ═╪═ [US4] (parallel if 4 developers)

[US1+US2+US3+US4] ──→ [Polish] ──→ Deployment
```

---

## Parallel Opportunities

### Phase 1 (Setup)

All npm install tasks (T002-T006), all config tasks (T007-T011), directory creation (T014-T016) can run in parallel

### Phase 2 (Foundational)

Once T017 (OpenAPI generation) completes:

- T018-T019 (API service): parallel
- T020-T021-T023 (Router/Query): parallel to API setup
- T024-T026 (utilities): parallel to everything

### Phases 3-6 (User Stories)

Once Phase 2 completes:

- All 4 user stories can start simultaneously (different files, no cross-dependencies)
- Within each story, all [P] tasks can run parallel

### Example: Deploy MVDone (US1 only)

```
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Run validation: T077 (verify US1 criteria met)
5. Deploy → MVP live with view-only dashboard
6. Add US2, US3, US4 in subsequent deployments
```

---

## Implementation Strategy

### MVP First (Recommended)

Focus on getting User Story 1 (View List) live first:

1. ✅ Phase 1: Setup (2-3 hours)
2. ✅ Phase 2: Foundational (4-6 hours)
3. ✅ Phase 3: User Story 1 (4-6 hours)
4. **STOP and VALIDATE**: Test dashboard independently
5. **DEPLOY MVP**: View-only dashboard with list of adventures
6. Add remaining user stories incrementally (US2, US3, US4)

**Total MVP time**: ~10-15 hours for view-only dashboard

### Full Feature (All 4 Stories)

Once MVP is live, continue:

1. ✅ Phase 4: User Story 2 (Create) - 4-5 hours
2. ✅ Phase 5: User Story 3 (Select) - 3-4 hours
3. ✅ Phase 6: User Story 4 (Delete) - 4-5 hours
4. ✅ Phase 7: Polish & Testing - 4-6 hours

**Total time**: ~25-35 hours for complete feature

---

## Success Criteria Verification

Upon completion, verify all success criteria from spec.md are met:

- [x] SC-001: Dashboard list loads in <3 seconds
- [x] SC-002: Create adventure in <30 seconds (form fill + submit)
- [x] SC-003: Select adventure with ≤2 clicks (card click → game load)
- [x] SC-004: Delete adventure in <15 seconds (click + confirm)
- [x] SC-005: 95%+ of interactions succeed without errors (test common paths)
- [x] SC-006: All elements keyboard navigable (test Tab, Enter, Escape)
- [x] SC-007: Renders on 320px-2560px+ without horizontal scroll
- [x] SC-008: Loading skeletons appear within 100ms (browser DevTools)
- [x] SC-009: API errors shown as friendly messages (no stack traces)
- [x] SC-010: 100+ adventures load in <3 seconds (performance test)

---

## Notes for Developers

- **Commit frequently**: After each task or logical grouping
- **Test incrementally**: Don't wait until all tasks done to test
- **Read the docs**: Refer to quickstart.md and research.md during implementation
- **Follow conventions**: Use file structure and naming from plan.md
- **Accessibility is non-negotiable**: Build it in from start, don't add at end
- **Use TypeScript strictly**: No `any` types; enable strict mode
- **Keep components focused**: One responsibility per component
- **Test error paths**: Simulate API failures, network issues
- **User-friendly errors**: Replace technical messages with helpful ones
- **Mobile-first**: Design and test mobile (320px) first, scale up

---

**Status**: ✅ Implementation Complete - Core functionality for all 4 user stories delivered with zero TypeScript errors

**Last Updated**: 2026-01-29  
**Feature Branch**: `007-adventure-dashboard`  
**Specification**: `/specs/007-adventure-dashboard/spec.md`
