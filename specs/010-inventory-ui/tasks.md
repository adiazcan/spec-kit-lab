---
description: "Task list for Inventory Management Interface"
---

# Tasks: Inventory Management Interface

**Input**: Design documents from /specs/010-inventory-ui/
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in spec.md (no test tasks included).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: [ID] [P?] [Story] Description

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify frontend dependencies and scripts in frontend/package.json (React Query, Tailwind, Vitest, generate:api)
- [x] T002 [P] Create Inventory UI barrel exports in frontend/src/components/InventoryUI/index.ts and frontend/src/components/Equipment/index.ts
- [x] T003 [P] Generate OpenAPI types into frontend/src/types/api.ts via npm run generate:api

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 [P] Add inventory and equipment type helpers in frontend/src/types/inventory.ts and frontend/src/types/equipment.ts
- [x] T005 [P] Add inventory constants and slot metadata in frontend/src/utils/inventoryConstants.ts
- [x] T006 [P] Add inventory preference helpers in frontend/src/utils/inventoryPreferences.ts
- [x] T007 [P] Implement inventory API client in frontend/src/services/inventoryClient.ts
- [x] T008 [P] Implement equipment API client in frontend/src/services/equipmentClient.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅ COMPLETE

---

## Phase 3: User Story 1 - View Inventory Items in Grid or List Format (Priority: P1) 🎯 MVP

**Goal**: Display inventory items in grid or list view with view toggle and live updates.

**Independent Test**: Open inventory with items, verify grid view cards, switch to list view rows, and confirm both show identical items and quantities.

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement useInventory hook in frontend/src/hooks/useInventory.ts
- [x] T010 [P] [US1] Build view toggle in frontend/src/components/InventoryUI/InventoryViewToggle.tsx
- [x] T011 [P] [US1] Build grid layout in frontend/src/components/InventoryUI/InventoryGrid.tsx
- [x] T012 [P] [US1] Build list layout in frontend/src/components/InventoryUI/InventoryList.tsx
- [x] T013 [US1] Build shared item renderer in frontend/src/components/InventoryUI/InventoryItem.tsx (grid/list support)
- [x] T014 [US1] Implement InventoryContainer wiring in frontend/src/components/InventoryUI/InventoryContainer.tsx (view persistence, data, counts)
- [x] T015 [US1] Integrate inventory panel into UI entrypoint in frontend/src/App.tsx

**Checkpoint**: User Story 1 is independently functional

---

## Phase 4: User Story 2 - View Item Details on Hover and Click (Priority: P1)

**Goal**: Show tooltip on hover and full detail modal on click with close behavior.

**Independent Test**: Hover items to see tooltip after 300ms and click to open detail modal; verify data and close on Escape/click outside.

### Implementation for User Story 2

- [x] T016 [P] [US2] Implement tooltip delay hook in frontend/src/hooks/useItemTooltip.ts
- [x] T017 [P] [US2] Build tooltip UI in frontend/src/components/ItemTooltip/ItemTooltip.tsx
- [x] T018 [P] [US2] Build modal shell in frontend/src/components/ItemDetail/ItemDetailModal.tsx
- [x] T019 [P] [US2] Build detail content UI in frontend/src/components/ItemDetail/ItemDetailContent.tsx
- [x] T020 [US2] Wire tooltip and modal into inventory UI in frontend/src/components/InventoryUI/InventoryItem.tsx and frontend/src/components/InventoryUI/InventoryContainer.tsx

**Checkpoint**: User Story 2 is independently functional

---

## Phase 5: User Story 6 - View and Organize Equipment Slots (Priority: P1)

**Goal**: Render all seven equipment slots with empty and equipped states.

**Independent Test**: Open equipment panel, confirm seven slots display with icons, and slots update when equipment data changes.

### Implementation for User Story 6

- [x] T021 [P] [US6] Implement useEquipment hook (read-only) in frontend/src/hooks/useEquipment.ts
- [x] T022 [P] [US6] Build equipment slot component in frontend/src/components/Equipment/EquipmentSlot.tsx
- [x] T023 [P] [US6] Build equipment slots grid in frontend/src/components/Equipment/EquipmentSlots.tsx
- [x] T024 [US6] Add equipment panel layout in frontend/src/components/InventoryUI/InventoryContainer.tsx

**Checkpoint**: User Story 6 is independently functional ✅ COMPLETE

---

## Phase 6: User Story 3 - Equip Items Using Drag-and-Drop (Priority: P1)

**Goal**: Enable dragging inventory items onto equipment slots to equip with feedback.

**Independent Test**: Drag item to valid slot and verify equip; drag to invalid slot and verify rejection with visual feedback.

### Implementation for User Story 3

- [x] T025 [P] [US3] Implement useDragDrop hook in frontend/src/hooks/useDragDrop.ts
- [x] T026 [US3] Add draggable support to inventory items in frontend/src/components/InventoryUI/InventoryItem.tsx
- [x] T027 [US3] Add drop zone logic and highlights in frontend/src/components/Equipment/EquipmentSlot.tsx
- [x] T028 [US3] Add Equip action button fallback in frontend/src/components/ItemDetail/ItemDetailContent.tsx

**Checkpoint**: User Story 3 is independently functional

---

## Phase 7: User Story 4 - Unequip Items Using Buttons or Drag-and-Drop (Priority: P1)

**Goal**: Provide unequip by button or drag back to inventory with full-inventory errors.

**Independent Test**: Click Unequip or drag equipped item to inventory area and confirm item returns to inventory; verify error when inventory is full.

### Implementation for User Story 4

- [x] T029 [US4] Add unequip and swap mutations in frontend/src/hooks/useEquipment.ts
- [x] T030 [US4] Add Unequip button UI and error messaging in frontend/src/components/Equipment/EquipmentSlot.tsx and frontend/src/components/InventoryUI/InventoryContainer.tsx
- [x] T031 [US4] Add drag-back drop zone handling in frontend/src/hooks/useDragDrop.ts and frontend/src/components/InventoryUI/InventoryContainer.tsx

**Checkpoint**: User Story 4 is independently functional

---

## Phase 8: User Story 8 - Stack Quantity Display for Stackable Items (Priority: P1)

**Goal**: Display current/max stack quantities in grid and list views.

**Independent Test**: View stackable items and confirm badge/column shows N/M, including 1 and MAX cases.

### Implementation for User Story 8

- [x] T032 [P] [US8] Add stack quantity badge and MAX styling in frontend/src/components/InventoryUI/InventoryItem.tsx
- [x] T033 [P] [US8] Add quantity column formatting in frontend/src/components/InventoryUI/InventoryList.tsx

**Checkpoint**: User Story 8 is independently functional

---

## Phase 9: User Story 5 - Use Consumable Items with Button or Hotkey (Priority: P2)

**Goal**: Allow consumable use from detail view with requirements validation and stack decrement.

**Independent Test**: Click Use on a consumable and verify effect triggers, quantity decrements, and item removal at zero; verify disabled Use when requirements unmet.

### Implementation for User Story 5

- [x] T034 [US5] Add use-item API method in frontend/src/services/inventoryClient.ts
- [x] T035 [US5] Add use-item mutation and requirement checks in frontend/src/hooks/useInventory.ts
- [x] T036 [US5] Wire Use button and disabled/tooltip states in frontend/src/components/ItemDetail/ItemDetailContent.tsx

**Checkpoint**: User Story 5 is independently functional

---

## Phase 10: User Story 7 - Sort and Filter Inventory Items (Priority: P2)

**Goal**: Provide sort/filter controls with persistent selection and filtered counts.

**Independent Test**: Apply sort and filters, verify items reorder and filter, then clear filters to restore full inventory while keeping sort order.

### Implementation for User Story 7

- [x] T037 [P] [US7] Add filter/sort utilities in frontend/src/utils/inventoryFilters.ts
- [x] T038 [P] [US7] Build sort menu UI in frontend/src/components/InventoryUI/InventorySortMenu.tsx
- [x] T039 [P] [US7] Build filter menu UI in frontend/src/components/InventoryUI/InventoryFilterMenu.tsx
- [ ] T040 [US7] Apply filtering/sorting and filtered counts in frontend/src/components/InventoryUI/InventoryContainer.tsx
- [ ] T041 [US7] Persist sort/filter preferences in frontend/src/utils/inventoryPreferences.ts

**Checkpoint**: User Story 7 is independently functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T042 Accessibility pass (keyboard/ARIA/focus) in frontend/src/components/InventoryUI/InventoryItem.tsx, frontend/src/components/Equipment/EquipmentSlot.tsx, frontend/src/components/ItemDetail/ItemDetailModal.tsx
- [x] T043 Performance memoization for list/grid rendering in frontend/src/components/InventoryUI/InventoryItem.tsx and frontend/src/components/InventoryUI/InventoryGrid.tsx
- [x] T044 Validate quickstart steps and update specs/010-inventory-ui/quickstart.md if needed
- [x] T045 [P] Update inventory UI documentation in frontend/README.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies after Foundational
- **US2 (P1)**: Depends on US1 item rendering
- **US6 (P1)**: No dependencies after Foundational
- **US3 (P1)**: Depends on US6 equipment slots and US1 inventory items
- **US4 (P1)**: Depends on US3 drag-and-drop and US6 equipment slots
- **US8 (P1)**: Depends on US1 item rendering
- **US5 (P2)**: Depends on US2 item detail UI
- **US7 (P2)**: Depends on US1 inventory list/grid

### Parallel Execution Examples (per Story)

- **US1**: T009, T010, T011, T012 can run in parallel
- **US2**: T016, T017, T018, T019 can run in parallel
- **US6**: T021, T022, T023 can run in parallel
- **US3**: T025 can run in parallel with prep for T026/T027
- **US4**: Sequence required (T029 → T030 → T031)
- **US8**: T032 and T033 can run in parallel
- **US5**: Sequence required (T034 → T035 → T036)
- **US7**: T037, T038, T039 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **Stop and validate**: Verify US1 independent test

### Incremental Delivery

1. Foundation ready → US1 → Validate
2. Add US2 and US6 → Validate independently
3. Add US3 and US4 → Validate independently
4. Add US8 → Validate independently
5. Add P2 stories (US5, US7) → Validate independently
6. Finish with Polish phase

### Parallel Team Strategy

After Foundational, parallelize by story:

- Developer A: US1 + US8
- Developer B: US2 + US5
- Developer C: US6 + US3 + US4
- Developer D: US7
