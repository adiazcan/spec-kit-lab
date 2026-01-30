---
description: "Implementation tasks for Character Management Interface"
feature: "008-char-mgmt-ui"
date: "January 30, 2026"
---

# Tasks: Character Management Interface

**Input**: Design documents from `/specs/008-char-mgmt-ui/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-contracts.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Included per plan.md requirement for ">90% coverage on modifier calculation, form validation, dice roll utility"

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All paths relative to `/workspaces/spec-kit-lab/frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for character management UI

- [x] T001 Verify frontend dependencies installed (React 18.3, Vite 5.4, TanStack Query v5, Tailwind CSS v4.1)
- [x] T002 Generate TypeScript types from OpenAPI spec in frontend/src/types/api.ts
- [x] T003 [P] Configure TypeScript strict mode and ESLint rules for no `any` types
- [x] T004 [P] Create component directory structure in frontend/src/components/
- [x] T005 [P] Create pages directory structure in frontend/src/pages/
- [x] T006 [P] Create services directory structure in frontend/src/services/
- [x] T007 [P] Create hooks directory structure in frontend/src/hooks/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions

- [x] T008 [P] Create Character interface in frontend/src/types/character.ts
- [x] T009 [P] Create CharacterFormData interface in frontend/src/types/character.ts
- [x] T010 [P] Create CharacterListItem interface in frontend/src/types/character.ts
- [x] T011 [P] Create DiceRoll interface in frontend/src/types/character.ts

### Core Utilities (with Tests)

- [x] T012 [P] Create calculateModifier function in frontend/src/services/attributeCalculator.ts
- [x] T013 [P] Create calculateAllModifiers function in frontend/src/services/attributeCalculator.ts
- [x] T014 [P] Create formatModifier function in frontend/src/services/attributeCalculator.ts
- [x] T015 [P] Write unit tests for calculateModifier in frontend/tests/services/attributeCalculator.test.ts
- [x] T016 [P] Write unit tests for formatModifier in frontend/tests/services/attributeCalculator.test.ts
- [x] T017 [P] Create roll4d6DropLowest function in frontend/src/services/diceRoller.ts
- [x] T018 [P] Write unit tests for roll4d6DropLowest in frontend/tests/services/diceRoller.test.ts
- [x] T019 [P] Create point-buy cost calculation in frontend/src/utils/pointBuy.ts
- [x] T020 [P] Write unit tests for point-buy logic in frontend/tests/utils/pointBuy.test.ts

### API Service Layer

- [x] T021 Create CharacterApiService class in frontend/src/services/characterApi.ts
- [x] T022 Implement createCharacter method in frontend/src/services/characterApi.ts
- [x] T023 Implement getCharacter method in frontend/src/services/characterApi.ts
- [x] T024 Implement updateCharacter method in frontend/src/services/characterApi.ts
- [x] T025 Implement deleteCharacter method in frontend/src/services/characterApi.ts
- [x] T026 Implement getAdventureCharacters method in frontend/src/services/characterApi.ts
- [x] T027 [P] Create React Query hooks (useCharacter, useCreateCharacter, useUpdateCharacter, useDeleteCharacter, useAdventureCharacters) in frontend/src/services/characterApi.ts

### Custom Hooks

- [x] T028 [P] Create useCharacterForm hook in frontend/src/hooks/useCharacterForm.ts
- [x] T029 [P] Write tests for useCharacterForm in frontend/tests/hooks/useCharacterForm.test.ts
- [x] T030 [P] Create useDiceRoll hook in frontend/src/hooks/useDiceRoll.ts
- [x] T031 [P] Write tests for useDiceRoll in frontend/tests/hooks/useDiceRoll.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Stories 1, 2, 3 - Character Creation & Viewing (Priority: P1) 🎯 MVP

**Goal**: Enable players to create a new character using either point-buy or dice roll mode, see real-time modifier updates, and view the complete character sheet

**Why Combined**: US1 (point-buy), US2 (dice roll), and US3 (view sheet) form a natural create-then-view workflow. The CharacterForm component handles both creation modes.

**Independent Test**: User can open character creation, enter a name, allocate attributes via point-buy OR dice rolls, see real-time modifiers, submit the form, and view the complete character sheet with all attributes and modifiers displayed.

### Tests for User Stories 1, 2, 3

- [x] T032 [P] [US1] Write component test for CharacterForm point-buy mode in frontend/tests/components/CharacterForm.test.tsx
- [x] T033 [P] [US2] Write component test for CharacterForm dice roll mode in frontend/tests/components/CharacterForm.test.tsx
- [x] T034 [P] [US3] Write component test for CharacterSheet display in frontend/tests/components/CharacterSheet.test.tsx
- [x] T035 [P] [US1] Write integration test for point-buy character creation flow in frontend/tests/integration/createCharacter.test.tsx
- [x] T036 [P] [US2] Write integration test for dice roll character creation flow in frontend/tests/integration/createCharacter.test.tsx

### Implementation for User Stories 1, 2, 3

#### Core Components

- [x] T037 [P] [US1] [US2] Create AttributeInput component in frontend/src/components/CharacterForm/AttributeInput.tsx
- [x] T038 [P] [US1] [US2] Create ModifierDisplay component in frontend/src/components/CharacterForm/ModifierDisplay.tsx
- [x] T039 [P] [US1] Create PointBuyMode component in frontend/src/components/CharacterForm/PointBuyMode.tsx
- [x] T040 [P] [US2] Create DiceRollMode component in frontend/src/components/CharacterForm/DiceRollMode.tsx
- [x] T041 [US1] [US2] Create CharacterForm main component integrating point-buy and dice roll modes in frontend/src/components/CharacterForm.tsx
- [x] T042 [US1] [US2] Add form validation logic to CharacterForm (name required, attributes 3-18, point-buy budget check, dice roll completion check)
- [x] T043 [US1] [US2] Add mode switching functionality with user confirmation in CharacterForm
- [x] T044 [US1] [US2] Add real-time modifier calculation and display in CharacterForm

#### Character Sheet Display

- [x] T045 [P] [US3] Create AttributeSection component in frontend/src/components/CharacterSheet/AttributeSection.tsx
- [x] T046 [US3] Create CharacterSheet component in frontend/src/components/CharacterSheet.tsx
- [x] T047 [US3] Add attribute display with modifiers to CharacterSheet
- [x] T048 [US3] Add edit and delete buttons to CharacterSheet (connected in Phase 4)

#### Pages and Navigation

- [x] T049 [US1] [US2] Create CharacterCreatePage in frontend/src/pages/CharacterCreatePage.tsx
- [x] T050 [US1] [US2] Wire CharacterCreatePage to useCreateCharacter mutation
- [x] T051 [US1] [US2] Add navigation to character sheet on successful creation
- [x] T052 [US3] Create CharacterSheetPage in frontend/src/pages/CharacterSheetPage.tsx
- [x] T053 [US3] Wire CharacterSheetPage to useCharacter query with loading states
- [x] T054 [US3] Add error handling for character not found in CharacterSheetPage

#### Accessibility & Polish

- [x] T055 [US1] [US2] Add ARIA labels and keyboard navigation to character form inputs
- [x] T056 [US1] [US2] Implement focus management for form errors
- [x] T057 [US3] Add semantic HTML structure to CharacterSheet for screen readers
- [x] T058 [US1] [US2] [US3] Apply Tailwind responsive styles (320px-2560px+) to all components

**Checkpoint**: At this point, users can create characters (point-buy OR dice roll) and view complete character sheets. MVP is functional! 🎉

---

## Phase 4: User Story 4 - Edit Existing Character (Priority: P2)

**Goal**: Enable players to modify their character's name and attributes after creation, with same validation as creation

**Independent Test**: User can navigate to character sheet, click "Edit", modify attributes in pre-populated form, see real-time modifier updates, save changes, and verify updates appear on character sheet.

### Tests for User Story 4

- [x] T059 [P] [US4] Write component test for CharacterForm edit mode with pre-populated data in frontend/tests/components/CharacterForm.test.tsx
- [x] T060 [P] [US4] Write integration test for character editing flow in frontend/tests/integration/editCharacter.test.tsx

### Implementation for User Story 4

- [x] T061 [US4] Add edit mode support to CharacterForm (pre-populate from existing character)
- [x] T062 [US4] Wire edit mode to useUpdateCharacter mutation in CharacterForm
- [x] T063 [US4] Create CharacterEditPage in frontend/src/pages/CharacterEditPage.tsx
- [x] T064 [US4] Wire CharacterEditPage to useCharacter query and useUpdateCharacter mutation
- [x] T065 [US4] Connect "Edit" button in CharacterSheet to navigate to CharacterEditPage
- [x] T066 [US4] Add cancel functionality that discards changes and returns to sheet
- [x] T067 [US4] Add optimistic updates for edit mutations in React Query configuration

**Checkpoint**: Users can now edit existing characters with full validation

---

## Phase 5: User Story 5 - Select Character for Adventure (Priority: P2)

**Goal**: Enable players to choose one of their characters to participate in a specific adventure

**Independent Test**: User can view adventure character selection screen, see list of their characters with stats, select a character, preview full sheet, confirm selection, and verify character is associated with the adventure.

### Tests for User Story 5

- [x] T068 [P] [US5] Write component test for CharacterSelector display in frontend/tests/components/CharacterSelector.test.tsx
- [x] T069 [P] [US5] Write integration test for adventure character selection flow in frontend/tests/integration/selectCharacter.test.tsx

### Implementation for User Story 5

- [x] T070 [P] [US5] Create CharacterPreviewCard component in frontend/src/components/CharacterSelector/CharacterPreviewCard.tsx
- [x] T071 [US5] Create CharacterSelector component in frontend/src/components/CharacterSelector.tsx
- [x] T072 [US5] Add character list display with summary stats to CharacterSelector
- [x] T073 [US5] Add character preview modal/panel to CharacterSelector
- [x] T074 [US5] Add confirmation step before finalizing selection
- [x] T075 [US5] Add "Create New Character" option for users with no characters
- [x] T076 [US5] Create CharacterSelectPage in frontend/src/pages/CharacterSelectPage.tsx
- [x] T077 [US5] Wire CharacterSelectPage to useAdventureCharacters query
- [x] T078 [US5] Add navigation to adventure page after successful selection

**Checkpoint**: Users can select characters for adventures with preview and confirmation ✅

---

## Phase 6: User Story 6 - Browse and Manage Character List (Priority: P3)

**Goal**: Enable players to view all their characters in an organized list, access individual sheets, and delete characters

**Independent Test**: User can navigate to character list page, see all their characters with summary info, click to view individual sheets, delete characters with confirmation, and verify list updates.

### Tests for User Story 6

- [x] T079 [P] [US6] Write component test for CharacterList display in frontend/tests/components/CharacterList.test.tsx
- [x] T080 [P] [US6] Write component test for character deletion with confirmation in frontend/tests/components/CharacterList.test.tsx
- [x] T081 [P] [US6] Write integration test for character list management flow in frontend/tests/integration/characterList.test.tsx

### Implementation for User Story 6

- [x] T082 [P] [US6] Create CharacterListItem component in frontend/src/components/CharacterList/CharacterListItem.tsx
- [x] T083 [US6] Create CharacterList component in frontend/src/components/CharacterList.tsx
- [x] T084 [US6] Add character summary display (name, top attributes, creation date) to CharacterListItem
- [x] T085 [US6] Add click-to-view navigation from CharacterListItem to CharacterSheetPage
- [x] T086 [US6] Add delete button with confirmation dialog to CharacterListItem
- [x] T087 [US6] Wire delete functionality to useDeleteCharacter mutation
- [x] T088 [US6] Add optimistic updates for delete operations
- [x] T089 [US6] Handle empty state (no characters) in CharacterList
- [x] T090 [US6] Create CharacterListPage in frontend/src/pages/CharacterListPage.tsx
- [x] T091 [US6] Wire CharacterListPage to useAdventureCharacters query
- [x] T092 [US6] Add "Create New Character" button to CharacterListPage
- [x] T093 [US6] Add search/filter functionality for large character lists (50+ characters)

**Checkpoint**: All user stories complete - full character management lifecycle functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Documentation

- [x] T094 [P] Add JSDoc comments to all components in frontend/src/components/
- [x] T095 [P] Add JSDoc comments to all services in frontend/src/services/
- [x] T096 [P] Add JSDoc comments to all hooks in frontend/src/hooks/
- [x] T097 [P] Update README.md with character management feature documentation

### Performance Optimization

- [x] T098 Add React.memo() to AttributeInput component to prevent unnecessary re-renders
- [x] T099 Add React.memo() to CharacterListItem for list performance
- [x] T100 Configure React Query stale time and cache invalidation rules in frontend/src/services/characterApi.ts
- [x] T101 Add code splitting for character pages using React.lazy()
- [x] T102 Optimize bundle size - verify <100KB gzipped target met

### Accessibility Audit

- [x] T103 Run WCAG AA accessibility audit on CharacterForm
- [x] T104 Run WCAG AA accessibility audit on CharacterSheet
- [x] T105 Run WCAG AA accessibility audit on CharacterList
- [x] T106 Verify 4.5:1 color contrast ratios across all components
- [x] T107 Test keyboard-only navigation through entire character lifecycle
- [ ] T108 Test screen reader compatibility for all interactive elements
- [ ] T109 Verify touch targets are minimum 44x44px on mobile

### Testing & Quality

- [x] T110 Achieve >90% test coverage for attributeCalculator utility
- [x] T111 Achieve >90% test coverage for diceRoller utility
- [x] T112 Achieve >90% test coverage for point-buy validation
- [ ] T113 [P] Add E2E test for complete character creation flow (point-buy)
- [ ] T114 [P] Add E2E test for complete character creation flow (dice roll)
- [ ] T115 [P] Add E2E test for character editing flow
- [ ] T116 Run full test suite and verify all tests pass

### Error Handling & User Experience

- [x] T117 Add user-friendly error messages for all API error responses
- [x] T118 Add loading indicators that appear after 500ms delay
- [x] T119 Add toast notifications for successful operations (create, update, delete)
- [x] T120 Add error boundary for graceful error recovery
- [x] T121 Add network error retry logic with exponential backoff

### Validation & Constitution Compliance

- [x] T122 Verify no `any` types exist in TypeScript code (run `npm run type-check`)
- [ ] T123 Verify all modifier displays update within <100ms (performance testing)
- [ ] T124 Verify initial page load is <3 seconds on 3G connection
- [ ] T125 Verify API responses complete within <200ms target (P95)
- [ ] T126 Run quickstart.md validation steps to verify feature completeness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories 1, 2, 3 (Phase 3)**: Depends on Foundational phase completion - **MVP FIRST**
- **User Story 4 (Phase 4)**: Depends on Foundational phase, leverages components from Phase 3
- **User Story 5 (Phase 5)**: Depends on Foundational phase, leverages components from Phase 3
- **User Story 6 (Phase 6)**: Depends on Foundational phase, leverages components from Phase 3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Stories 1, 2, 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP TARGET**
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Reuses CharacterForm from Phase 3 but independently testable
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Independent of other stories
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Independent of other stories

### Within Each User Story

- Tests (when included) should be written to FAIL before implementation
- Type definitions before components (Foundational phase handles this)
- Utility functions before hooks before components
- Components before pages
- Core implementation before navigation wiring
- Story complete before moving to next priority

### Parallel Opportunities Per Phase

#### Setup (Phase 1)

```bash
# Launch T003-T007 together (directory creation tasks):
T003: Configure TypeScript strict mode
T004: Create component directory structure
T005: Create pages directory structure
T006: Create services directory structure
T007: Create hooks directory structure
```

#### Foundational (Phase 2)

```bash
# Launch T008-T011 together (type definitions):
T008: Character interface
T009: CharacterFormData interface
T010: CharacterListItem interface
T011: DiceRoll interface

# Launch T012-T020 together (utilities + tests):
T012-T014: Attribute calculator functions
T015-T016: Attribute calculator tests
T017: Dice roller function
T018: Dice roller tests
T019: Point-buy utilities
T020: Point-buy tests

# Launch T028-T031 together (custom hooks + tests):
T028: useCharacterForm hook
T029: useCharacterForm tests
T030: useDiceRoll hook
T031: useDiceRoll tests
```

#### User Stories 1, 2, 3 (Phase 3)

```bash
# Launch T032-T036 together (all tests):
T032: CharacterForm point-buy test
T033: CharacterForm dice roll test
T034: CharacterSheet test
T035: Point-buy integration test
T036: Dice roll integration test

# Launch T037-T040 together (sub-components):
T037: AttributeInput component
T038: ModifierDisplay component
T039: PointBuyMode component
T040: DiceRollMode component

# Launch T045 together (can work on independently):
T045: AttributeSection component (for sheet display)

# Launch T055-T058 together (accessibility):
T055: Form ARIA labels
T056: Focus management
T057: Sheet semantic HTML
T058: Responsive styles
```

#### User Story 4 (Phase 4)

```bash
# Launch T059-T060 together (tests):
T059: Edit mode component test
T060: Edit integration test
```

#### User Story 5 (Phase 5)

```bash
# Launch T068-T069 together (tests):
T068: CharacterSelector component test
T069: Selection integration test

# Launch T070 independently (can work in parallel with T071):
T070: CharacterPreviewCard component
```

#### User Story 6 (Phase 6)

```bash
# Launch T079-T081 together (tests):
T079: CharacterList component test
T080: Deletion test
T081: List management integration test

# Launch T082 independently (can work in parallel with T083):
T082: CharacterListItem component
```

#### Polish (Phase 7)

```bash
# Launch T094-T097 together (documentation):
T094: Component JSDoc
T095: Service JSDoc
T096: Hook JSDoc
T097: README update

# Launch T113-T115 together (E2E tests):
T113: Point-buy E2E
T114: Dice roll E2E
T115: Editing E2E
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only) - Recommended ⭐

1. Complete Phase 1: Setup (Tasks T001-T007)
2. Complete Phase 2: Foundational (Tasks T008-T031) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Stories 1, 2, 3 (Tasks T032-T058)
4. **STOP and VALIDATE**: Test character creation and viewing independently
5. Deploy/demo MVP - users can create and view characters!

**Estimated Effort**: 20-30 hours for MVP (Setup + Foundational + US1/2/3)

### Incremental Delivery

1. Complete Setup + Foundational (12-15 hours) → Foundation ready
2. Add User Stories 1, 2, 3 (15-20 hours) → **MVP DEPLOYED** 🎉
3. Add User Story 4 - Edit (4-6 hours) → Character editing live
4. Add User Story 5 - Select (4-6 hours) → Adventure selection live
5. Add User Story 6 - List (5-8 hours) → Full management suite
6. Polish (10-15 hours) → Production ready

**Total Estimated Effort**: 50-70 hours for complete feature with polish

### Parallel Team Strategy

With 2-3 frontend developers:

1. **Team completes Setup + Foundational together** (Phases 1-2)
2. **Once Foundational is done**, split:
   - **Developer A**: User Stories 1, 2, 3 (character creation + viewing)
   - **Developer B**: User Story 5 (adventure selection) + User Story 6 (list management)
   - **Developer C**: User Story 4 (editing) + Polish tasks
3. Stories integrate cleanly - CharacterForm is reused but pages are independent

---

## Success Metrics (Per Specification)

After implementation, verify these success criteria:

- **SC-001**: ✅ Users complete character creation in <3 minutes
- **SC-002**: ✅ Modifiers display <100ms (test with T123)
- **SC-003**: ✅ 95% first-attempt success (collect user feedback)
- **SC-004**: ✅ Character sheet loads <2s (test with T124)
- **SC-005**: ✅ Character selection <30 seconds (test with users)
- **SC-006**: ✅ 90% edit success rate (collect metrics)
- **SC-007**: ✅ Selection in 3 steps (verify flow)
- **SC-008**: ✅ User-friendly error messages (test with T117)

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability
- **MVP Focus**: Phases 1-3 deliver complete create-and-view workflow
- **Independent Stories**: Each user story can be completed and tested independently
- **Reusable Components**: CharacterForm serves both creation (US1/US2) and editing (US4)
- **Test Coverage**: Focus on >90% coverage for critical utilities (calculator, dice, validation)
- **Accessibility**: WCAG AA compliance required (constitution principle VI)
- **Performance**: <100ms modifiers, <200ms API, <3s load (constitution principle V)
- **Type Safety**: No `any` types, generated API types (constitution principle VIII)

---

**Total Tasks**: 126  
**MVP Tasks**: 58 (T001-T058)  
**Parallel Opportunities**: 30+ tasks marked [P]  
**Independent Test Criteria**: Each user story phase includes testable checkpoint  
**Suggested MVP Scope**: Phases 1-3 (Setup + Foundational + User Stories 1, 2, 3)

**Ready for Implementation!** 🚀
