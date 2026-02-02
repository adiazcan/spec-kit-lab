---
description: "Implementation tasks for Main Game Interface feature"
---

# Tasks: Main Game Interface

**Input**: Design documents from `/specs/009-main-game-ui/`  
**Prerequisites**: plan.md (✓), spec.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

**Tests**: NOT REQUESTED - Tests are optional and were not specified in the feature specification, so test tasks are NOT included in this implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **Checkbox**: `- [ ]` (marks task status)
- **[ID]**: Task ID (T001, T002, T003...)
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend React SPA**: `frontend/src/` at repository root
- Paths shown below are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Frontend project structure and type definitions

- [x] T001 Verify frontend project structure exists in frontend/src/ directory
- [x] T002 [P] Create TypeScript interface definitions in frontend/src/types/game.ts for all game data structures (GameState, SceneData, NarrativeMessage, CharacterStatus, CombatState, DiceRollResult, CommandInputState, UIState)
- [x] T003 [P] Create TypeScript interface definitions for narrative types in frontend/src/types/narrative.ts (message types, metadata structures)
- [x] T004 [P] Create TypeScript interface definitions for combat types in frontend/src/types/combat.ts (Combatant, CombatLogEntry, combat-specific structures)
- [x] T005 Verify OpenAPI-generated types exist in frontend/src/types/api.ts (run npm run generate:api if needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Create API service hooks in frontend/src/services/gameApi.ts with React Query for useAdventure, useCharacter, useCombat
- [x] T007 [P] Create mutation hooks in frontend/src/services/gameApi.ts for useResolveTurn and useResolveEnemyTurn
- [x] T008 [P] Create narrative formatter utility functions in frontend/src/utils/narrativeFormatter.ts (formatTimestamp, getMessageIcon, getMessageClass)
- [x] T009 [P] Create dice animation helper utilities in frontend/src/utils/diceAnimationHelper.ts (generateDiceRotation, formatDiceRoll, checkCritical)
- [x] T010 [P] Create combat formatter utility in frontend/src/utils/combatFormatter.ts (format turn info, HP percentages)
- [x] T011 Create useGameState custom hook in frontend/src/hooks/useGameState.ts with session storage persistence for narrative messages
- [x] T012 Create useCommandInput custom hook in frontend/src/hooks/useCommandInput.ts with command history and arrow key navigation
- [x] T013 Create base GamePage routing in frontend/src/pages/GamePage.tsx with route parameter for adventureId
- [x] T014 Update frontend/src/App.tsx to include /game/:adventureId route with React Query provider configuration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅ COMPLETE

---

## Phase 3: User Story 1 - Read Current Scene and Status (Priority: P1) 🎯 MVP

**Goal**: Display current scene description, character status panel (HP, conditions, equipment), and narrative text area so players can understand their game situation

**Independent Test**: Load a scene with a character and verify: (1) Scene description is visible and readable, (2) Character status sidebar shows HP bar with current/max values, active conditions list, and equipped items list, (3) Narrative text area displays messages in chronological order

### Implementation for User Story 1

- [x] T015 [P] [US1] Create GameScreen main layout container component in frontend/src/components/GameScreen/GameScreen.tsx
- [x] T016 [P] [US1] Create SceneDescription component in frontend/src/components/GameScreen/SceneDescription.tsx to display scene title and description
- [x] T017 [P] [US1] Create NarrativeDisplay scrollable component in frontend/src/components/GameScreen/NarrativeDisplay.tsx with message rendering
- [x] T018 [P] [US1] Create NarrativeMessage individual message component in frontend/src/components/GameScreen/NarrativeMessage.tsx with type-based styling
- [x] T019 [P] [US1] Create CharacterStatusSidebar component in frontend/src/components/CharacterStatus/CharacterStatusSidebar.tsx as main sidebar container
- [x] T020 [P] [US1] Create HealthDisplay component in frontend/src/components/CharacterStatus/HealthDisplay.tsx with HP bar visualization
- [x] T021 [P] [US1] Create ConditionsList component in frontend/src/components/CharacterStatus/ConditionsList.tsx to display active status effects
- [x] T022 [P] [US1] Create EquipmentList component in frontend/src/components/CharacterStatus/EquipmentList.tsx to show equipped items with stat impacts
- [x] T023 [US1] Integrate SceneDescription, NarrativeDisplay, and CharacterStatusSidebar into GameScreen layout
- [x] T024 [US1] Connect GameScreen to useAdventure and useCharacter API hooks to fetch and display data
- [x] T025 [US1] Add loading states and error handling to GameScreen for API data fetching
- [x] T026 [US1] Add ARIA live regions to NarrativeDisplay component for screen reader accessibility

**Checkpoint**: At this point, User Story 1 should be fully functional - players can see scene description, narrative messages, and character status independently

---

## Phase 4: User Story 2 - Accept and Execute Player Commands (Priority: P1) 🎯 MVP

**Goal**: Provide a text input field that accepts player commands with Enter key submission and command history navigation so players can interact with the game

**Independent Test**: Type a command in the input field, press Enter, and verify: (1) Command is submitted to game engine, (2) Input field clears after submission, (3) Up/Down arrow keys navigate through command history

### Implementation for User Story 2

- [x] T027 [P] [US2] Create CommandInput component in frontend/src/components/CommandInput/CommandInput.tsx with text input and submit button
- [x] T028 [US2] Integrate useCommandInput hook into CommandInput component for state management and history
- [x] T029 [US2] Implement keyboard event handlers in CommandInput for Enter (submit), Up/Down (history), Escape (clear)
- [x] T030 [US2] Add command validation (non-empty, max 500 chars) with inline error display
- [x] T031 [US2] Connect CommandInput to game action submission API (placeholder for actual game engine integration)
- [x] T032 [US2] Integrate CommandInput component into GameScreen layout below NarrativeDisplay
- [x] T033 [US2] Add disabled state to CommandInput during API submission with loading indicator
- [x] T034 [US2] Generate narrative messages from command submission results and add to narrative feed

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - players can read game state and submit commands ✅ COMPLETE

---

## Phase 5: User Story 3 - View Narrative History and Scroll (Priority: P2)

**Goal**: Enable scrolling through accumulated narrative messages (500+ messages) with smooth scrolling and auto-scroll to new content

**Independent Test**: Generate 50+ narrative messages, scroll up through history and verify: (1) All previous messages remain accessible, (2) Scrolling is smooth and responsive, (3) New messages auto-scroll to bottom or indicate new content availability

### Implementation for User Story 3

- [x] T035 [P] [US3] Create useNarrativeScroll custom hook in frontend/src/hooks/useNarrativeScroll.ts for auto-scroll behavior control
- [x] T036 [US3] Enhance NarrativeDisplay component with useRef for scroll container and useEffect for auto-scroll on new messages
- [x] T037 [US3] Add scroll-to-bottom detection logic to preserve user scroll position when scrolled up
- [x] T038 [US3] Implement "new messages" indicator when user is scrolled away from bottom
- [x] T039 [US3] Add CSS class for smooth scrolling behavior to narrative container in frontend/src/index.css
- [x] T040 [US3] Add virtual scrolling for performance with 500+ messages using react-window or custom implementation
- [x] T041 [US3] Add fade-in animation for new narrative messages in frontend/src/index.css
- [x] T042 [US3] Test narrative scroll performance with 500+ accumulated messages

**Checkpoint**: User Story 3 enhances US1 - narrative display now handles large message histories smoothly

---

## Phase 6: User Story 4 - Perform and Visualize Dice Rolls (Priority: P2)

**Goal**: Display animated dice rolls with results showing base roll, modifiers, and final total in under 2 seconds

**Independent Test**: Trigger a dice roll (e.g., attack action) and verify: (1) Dice animation plays and completes in under 2 seconds, (2) Result displays with base roll, modifiers, and total, (3) Critical success/failure is indicated for d20 rolls

### Implementation for User Story 4

- [x] T043 [P] [US4] Create DiceRollAnimation component in frontend/src/components/DiceRoll/DiceRollAnimation.tsx with CSS 3D transform animation
- [x] T044 [P] [US4] Create DiceResult display component in frontend/src/components/DiceRoll/DiceResult.tsx to show final result with modifiers breakdown
- [x] T045 [P] [US4] Create DiceVisualizer component in frontend/src/components/DiceRoll/DiceVisualizer.tsx for 3D dice cube visual
- [x] T046 [P] [US4] Create useDiceRoll custom hook in frontend/src/hooks/useDiceRoll.ts to manage dice roll state and animation lifecycle
- [x] T047 [US4] Add CSS keyframe animations for dice rolling in frontend/src/index.css with 3D rotations (duration 1.2-1.5s)
- [x] T048 [US4] Add critical hit/miss visual indicators (green/red glow) in DiceResult component
- [x] T049 [US4] Integrate DiceRollAnimation into GameScreen with activation from combat actions
- [x] T050 [US4] Connect useDiceRoll hook to combat API responses to extract dice roll data
- [x] T051 [US4] Add dice roll results to narrative messages with metadata for rich display
- [x] T052 [US4] Test dice animation performance (ensure 60fps, <2s total duration)

**Checkpoint**: User Story 4 adds dice roll visualization - combat and ability checks now have engaging visual feedback

---

## Phase 7: User Story 5 - Use Quick Action Buttons (Priority: P2)

**Goal**: Provide quick action buttons (Attack, Flee, Use Item) that reduce time to perform common actions by 30% compared to typing

**Independent Test**: Click Attack button and verify: (1) Attack action is triggered with correct context, (2) Action executes without typing command, (3) Button disables during action processing

### Implementation for User Story 5

- [x] T053 [P] [US5] Create ActionButtons component in frontend/src/components/CommandInput/ActionButtons.tsx with Attack, Flee, Use Item buttons
- [x] T054 [US5] Add click handlers to ActionButtons that pre-fill or directly submit actions
- [x] T055 [US5] Integrate ActionButtons into GameScreen layout near CommandInput
- [x] T056 [US5] Add contextual visibility logic - show Attack/Flee only in combat, hide otherwise
- [x] T057 [US5] Add disabled state to action buttons during API submission or invalid game state
- [x] T058 [US5] Connect ActionButtons to combat turn resolution API (useResolveTurn mutation)
- [x] T059 [US5] Add ARIA labels and keyboard shortcuts (Alt+A for Attack, Alt+F for Flee, Alt+I for Use Item)
- [x] T060 [US5] Style action buttons with hover states and touch-friendly 44x44px minimum size

**Checkpoint**: User Story 5 enhances US2 - players now have quick access to common actions, improving gameplay flow ✅ COMPLETE

---

## Phase 8: User Story 6 - Track Combat Turn Order and Status (Priority: P3)

**Goal**: Display whose turn it is, current round number, and all combatants' status during combat encounters

**Independent Test**: Enter combat and verify: (1) Turn indicator clearly shows current turn (player or enemy name), (2) Round counter displays and increments correctly, (3) All combatants' HP and status are visible and update in real-time

### Implementation for User Story 6

- [x] T061 [P] [US6] Create CombatOverlay component in frontend/src/components/CombatUI/CombatOverlay.tsx as combat mode container
- [x] T062 [P] [US6] Create TurnIndicator component in frontend/src/components/CombatUI/TurnIndicator.tsx with turn banner (green for player, neutral for enemy)
- [x] T063 [P] [US6] Create RoundCounter component in frontend/src/components/CombatUI/RoundCounter.tsx to display current round number
- [x] T064 [P] [US6] Create CombatantsList component in frontend/src/components/CombatUI/CombatantsList.tsx to show all combatants in initiative order
- [x] T065 [P] [US6] Create useCombatState custom hook in frontend/src/hooks/useCombatState.ts to manage combat turn tracking and state
- [x] T066 [US6] Integrate TurnIndicator, RoundCounter, and CombatantsList into CombatOverlay layout
- [x] T067 [US6] Connect CombatOverlay to useCombat API hook to fetch and display combat state
- [x] T068 [US6] Add active turn highlighting in CombatantsList (green arrow indicator for current combatant)
- [x] T069 [US6] Add HP bar visualization for each combatant in CombatantsList with color coding (green >50%, yellow 25-50%, red <25%)
- [x] T070 [US6] Add defeated combatant visual treatment (strikethrough, gray color, move to bottom)
- [x] T071 [US6] Display active conditions as badges on each combatant with color coding (buff=green, debuff=red)
- [x] T072 [US6] Integrate CombatOverlay into GameScreen with conditional rendering (visible only when combat is active)
- [x] T073 [US6] Add ARIA live regions to TurnIndicator for screen reader turn announcements
- [x] T074 [US6] Poll combat state every 2 seconds via React Query refetchInterval to keep turn order current
- [x] T075 [US6] Implement automatic enemy turn resolution after player turn completes using useResolveEnemyTurn mutation

**Checkpoint**: Combat UI is now fully functional - all user stories (1-6) are independently testable and integrated

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T076 [P] Add responsive design breakpoints in Tailwind config for sidebar collapse on mobile (<800px)
- [x] T077 [P] Add CSS transitions for HP bar changes (0.3s duration) in frontend/src/index.css
- [x] T078 [P] Add loading skeleton components for GameScreen initial load
- [x] T079 [P] Add error boundary component in frontend/src/components/ErrorBoundary.tsx to catch React errors
- [x] T080 Add toast notification system for action feedback and errors
- [x] T081 Optimize React.memo usage on NarrativeMessage component to prevent unnecessary re-renders
- [x] T082 Add performance monitoring for API response times in gameApi.ts
- [x] T083 [P] Add keyboard shortcut help modal (triggered by ? key)
- [x] T084 Validate WCAG AA color contrast for all text elements
- [x] T085 Run accessibility audit with screen reader testing on all interactive components
- [x] T086 [P] Add JSDoc documentation to all components, hooks, and utility functions
- [x] T087 Verify quickstart.md guide is accurate by following implementation steps
- [x] T088 Add mobile responsive testing for 800px-2560px viewport range

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (types must exist before hooks use them) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Can start after Foundational (Phase 2) - MVP foundation
- **User Story 2 (Phase 4)**: Can start after Foundational (Phase 2) - MVP foundation (can run parallel with US1 if different developers)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (enhances NarrativeDisplay) - Can start immediately after US1 complete
- **User Story 4 (Phase 6)**: Can start after Foundational (Phase 2) - Independent of US1-3, ready for parallel work
- **User Story 5 (Phase 7)**: Depends on User Story 2 (enhances CommandInput) - Can start after US2 complete
- **User Story 6 (Phase 8)**: Depends on Foundational (Phase 2) and User Story 1 (integrates into GameScreen) - Best started after US1 complete for integration context
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP Ready**
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP Ready**
- **User Story 3 (P2)**: Enhances User Story 1's NarrativeDisplay - Should complete after US1
- **User Story 4 (P2)**: Independent implementation - Can start after Foundational, integrates into GameScreen
- **User Story 5 (P2)**: Enhances User Story 2's CommandInput - Should complete after US2
- **User Story 6 (P3)**: Integrates into GameScreen from User Story 1 - Benefits from US1 being complete first

### Within Each User Story

Within a single user story phase:

- **Parallel components** (marked [P]): All components for that story can be built in parallel by different developers
- **Integration tasks**: Require component tasks to be complete first
- **API connection tasks**: Require both components and API hooks to be complete

### Parallel Opportunities

- **Setup (Phase 1)**: Tasks T002, T003, T004 can run in parallel (different type files)
- **Foundational (Phase 2)**: Tasks T006-T010 can run in parallel (different service/util files), then T011-T012 (hooks), then T013-T014 (routing)
- **User Story 1**: Tasks T015-T022 can ALL run in parallel (8 different component files), then T023-T026 (integration)
- **User Story 2**: Tasks T027-T028 can run in parallel, then remaining tasks sequentially
- **User Story 3**: Tasks T035-T036 can run in parallel, then remaining enhancements
- **User Story 4**: Tasks T043-T046 can ALL run in parallel (4 different files), then T047-T052 (integration & CSS)
- **User Story 5**: Tasks T053-T054 can run in parallel, then integration tasks
- **User Story 6**: Tasks T061-T065 can ALL run in parallel (5 different files), then T066-T075 (integration)
- **Polish**: Tasks T076, T077, T078, T079, T083, T086 can run in parallel

### Parallel Example: User Story 1

```bash
# Launch all component tasks for User Story 1 together:
Task T015: "Create GameScreen main layout container component in frontend/src/components/GameScreen/GameScreen.tsx"
Task T016: "Create SceneDescription component in frontend/src/components/GameScreen/SceneDescription.tsx"
Task T017: "Create NarrativeDisplay component in frontend/src/components/GameScreen/NarrativeDisplay.tsx"
Task T018: "Create NarrativeMessage component in frontend/src/components/GameScreen/NarrativeMessage.tsx"
Task T019: "Create CharacterStatusSidebar component in frontend/src/components/CharacterStatus/CharacterStatusSidebar.tsx"
Task T020: "Create HealthDisplay component in frontend/src/components/CharacterStatus/HealthDisplay.tsx"
Task T021: "Create ConditionsList component in frontend/src/components/CharacterStatus/ConditionsList.tsx"
Task T022: "Create EquipmentList component in frontend/src/components/CharacterStatus/EquipmentList.tsx"

# All 8 components can be built simultaneously by different developers or in parallel sessions
# Then proceed with integration tasks T023-T026 sequentially
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T014) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (T015-T026) - **MVP Core**
4. Complete Phase 4: User Story 2 (T027-T034) - **MVP Core**
5. **STOP and VALIDATE**: Test independently that players can view game state and submit commands
6. Deploy/demo if ready as minimum viable game interface

**MVP Delivery**: Phases 1-4 (T001-T034) = ~55-70 hours

### Incremental Delivery

1. Complete Setup + Foundational (Phases 1-2) → Foundation ready
2. Add User Story 1 (Phase 3) → Test independently → Players can read game state (MVP Component 1)
3. Add User Story 2 (Phase 4) → Test independently → Players can send commands (MVP Component 2) → **Deploy MVP!**
4. Add User Story 3 (Phase 5) → Test independently → Narrative scrolling enhanced → Deploy
5. Add User Story 4 (Phase 6) → Test independently → Dice rolls visualized → Deploy
6. Add User Story 5 (Phase 7) → Test independently → Quick actions available → Deploy
7. Add User Story 6 (Phase 8) → Test independently → Combat UI complete → Deploy
8. Polish (Phase 9) → Final refinements → Production-ready

Each user story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (Phases 1-2)
2. Once Foundational is done, **split teams**:
   - **Developer A**: User Story 1 (Phase 3) - Scene/status display
   - **Developer B**: User Story 2 (Phase 4) - Command input
   - Both work in parallel since they touch different components
3. **After US1 & US2 complete** (MVP ready), continue in parallel:
   - **Developer A**: User Story 3 (Phase 5) - Enhances US1's narrative display
   - **Developer B**: User Story 4 (Phase 6) - Dice roll components (independent)
4. **Next wave**:
   - **Developer A**: User Story 5 (Phase 7) - Enhances US2's command input
   - **Developer B**: User Story 6 (Phase 8) - Combat UI (integrates into US1's GameScreen)
5. **Final**: Both developers work on Polish (Phase 9) together

---

## Effort Estimates

| Phase                    | Tasks     | Estimated Hours | Priority |
| ------------------------ | --------- | --------------- | -------- |
| Phase 1: Setup           | T001-T005 | 2-3 hours       | P0       |
| Phase 2: Foundational    | T006-T014 | 12-16 hours     | P0       |
| Phase 3: User Story 1    | T015-T026 | 18-24 hours     | P1 (MVP) |
| Phase 4: User Story 2    | T027-T034 | 8-12 hours      | P1 (MVP) |
| Phase 5: User Story 3    | T035-T042 | 6-8 hours       | P2       |
| Phase 6: User Story 4    | T043-T052 | 10-14 hours     | P2       |
| Phase 7: User Story 5    | T053-T060 | 6-8 hours       | P2       |
| Phase 8: User Story 6    | T061-T075 | 16-22 hours     | P3       |
| Phase 9: Polish          | T076-T088 | 12-16 hours     | P4       |
| **Total (All Features)** | T001-T088 | 90-123 hours    |          |
| **MVP Only (US1+US2)**   | T001-T034 | 40-55 hours     | ⭐       |
| **P1+P2 Features**       | T001-T060 | 62-85 hours     |          |

**Recommendation**: Target MVP delivery first (Phases 1-4), validate with users, then add P2 features incrementally.

---

## Success Criteria Mapping

Tasks support these measurable outcomes from spec.md:

- **SC-001** (Read scene/status without help): US1 tasks T015-T026 provide clear layout and sidebar
- **SC-002** (Input capture <100ms): US2 tasks T027-T034 use synchronous event handlers
- **SC-003** (Dice animations <2s): US4 tasks T043-T052 use CSS animations with 1.2-1.5s duration
- **SC-004** (Smooth scroll with 500+ messages): US3 tasks T035-T042 implement virtual scrolling
- **SC-005** (90% complete turn without confusion): US6 tasks T061-T075 provide clear turn indicators
- **SC-006** (Quick actions reduce time 30%): US5 tasks T053-T060 provide one-click action buttons
- **SC-007** (Turn indicators clear): US6 tasks T062-T063 use prominent banners with color coding
- **SC-008** (Responsive 800px-2560px): US1 tasks T019-T022 + Polish task T076 use Tailwind responsive utilities

---

## Notes

- **[P] tasks** = Different files, no dependencies on incomplete tasks, safe for parallel execution
- **[Story] label** maps task to specific user story for traceability (US1-US6)
- Each user story phase should be independently completable and testable before moving to next
- **No tests included** - Tests were not requested in the feature specification. If TDD approach is desired, add test tasks before implementation tasks in each phase
- Commit after each task or logical group of parallel tasks
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **MVP is achievable** with just Phases 1-4 (T001-T034), providing core game interface functionality

---

**Generated**: 2026-02-02  
**Total Tasks**: 88  
**User Stories**: 6 (2 × P1, 3 × P2, 1 × P3)  
**MVP Tasks**: 34 (Phases 1-4)  
**Parallel Opportunities**: 38 tasks can run in parallel across all phases
