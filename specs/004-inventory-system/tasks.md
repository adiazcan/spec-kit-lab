# Tasks: Inventory Management System

**Input**: Design documents from `/specs/004-inventory-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are OPTIONAL and not explicitly requested in the feature specification. Tasks below focus on implementation. Add test tasks if TDD approach is desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- **Paths**: Using existing project structure (src/DiceEngine._, tests/DiceEngine._.Tests/)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema and basic infrastructure for inventory system

- [X] T001 Create database migration 004_AddInventorySystem in src/DiceEngine.Infrastructure/Migrations/
- [X] T002 Configure Item entity (abstract base) with TPH inheritance in src/DiceEngine.Infrastructure/Persistence/GameDbContext.cs
- [X] T003 [P] Add StackableItem entity configuration with MaxStackSize in GameDbContext.cs
- [X] T004 [P] Add UniqueItem entity configuration with SlotType and Modifiers (JSONB) in GameDbContext.cs
- [X] T005 [P] Configure InventoryEntry entity with Adventure and Item relationships in GameDbContext.cs
- [X] T006 [P] Configure EquipmentSlot entity with Character and UniqueItem relationships in GameDbContext.cs
- [X] T007 [P] Configure LootTable and LootTableEntry entities with relationships in GameDbContext.cs
- [X] T008 Add database indexes for inventory_entries(adventure_id, item_id) and equipment_slots(character_id, slot_type) in migration
- [X] T009 Apply database migration and verify tables created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain entities and value objects that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 [P] Create ItemRarity enum in src/DiceEngine.Domain/Entities/Item.cs
- [X] T011 [P] Create SlotType enum (Head, Chest, Hands, Legs, Feet, MainHand, OffHand) in src/DiceEngine.Domain/Entities/EquipmentSlot.cs
- [X] T012 Create abstract Item entity base class in src/DiceEngine.Domain/Entities/Item.cs
- [X] T013 [P] Create StatModifier value object in src/DiceEngine.Domain/ValueObjects/StatModifier.cs
- [X] T014 [P] Create Result wrapper class (if not existing) in src/DiceEngine.Application/Models/Result.cs
- [X] T015 [P] Add StandardResponse and ErrorResponse models (verify existing) in src/DiceEngine.API/Models/
- [X] T016 Update Character entity to include EquipmentSlots navigation property in src/DiceEngine.Domain/Entities/Character.cs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Store and Retrieve Stackable Items (Priority: P1) 🎯 MVP

**Goal**: Enable players to add stackable items (potions, arrows) to inventory with automatic stack merging and view inventory contents

**Independent Test**: Add 5 healing potions, add 3 more (should merge to 8 total), view inventory shows single stack of 8, remove 2 (should show 6)

### Implementation for User Story 1

- [X] T017 [P] [US1] Create StackableItem entity extending Item in src/DiceEngine.Domain/Entities/StackableItem.cs
- [X] T018 [P] [US1] Create InventoryEntry entity in src/DiceEngine.Domain/Entities/InventoryEntry.cs
- [X] T019 [US1] Implement InventoryEntry.AddQuantity() and RemoveQuantity() methods with validation
- [X] T020 [US1] Create InventoryService with AddItemAsync() method in src/DiceEngine.Application/Services/InventoryService.cs
- [X] T021 [US1] Implement stack merging logic in InventoryService.AddItemAsync() (check existing, merge if match, cap at maxStackSize)
- [X] T022 [US1] Implement GetInventoryAsync() with pagination in InventoryService
- [X] T023 [US1] Implement RemoveItemAsync() with quantity decrement in InventoryService
- [X] T024 [US1] Add inventory capacity validation (max 100 unique entries) in InventoryService
- [X] T025 [P] [US1] Create AddItemRequest DTO in src/DiceEngine.API/Models/AddItemRequest.cs
- [X] T026 [P] [US1] Create AddItemResponse DTO in src/DiceEngine.API/Models/AddItemResponse.cs
- [X] T027 [P] [US1] Create InventoryResponse DTO in src/DiceEngine.API/Models/InventoryResponse.cs
- [X] T028 [P] [US1] Create InventoryEntryDto in src/DiceEngine.API/Models/InventoryEntryDto.cs
- [X] T029 [US1] Create InventoryController with POST /adventures/{id}/inventory endpoint in src/DiceEngine.API/Controllers/InventoryController.cs
- [X] T030 [US1] Implement GET /adventures/{id}/inventory endpoint with pagination in InventoryController
- [X] T031 [US1] Implement DELETE /adventures/{id}/inventory/{entryId} endpoint in InventoryController
- [X] T032 [US1] Add proper status codes (201 Created, 204 No Content, 404 Not Found, 409 Conflict for full inventory)

**Checkpoint**: User Story 1 complete - stackable items can be added, merged, viewed, and removed from inventory

---

## Phase 4: User Story 2 - Manage Unique Equipment Items (Priority: P1)

**Goal**: Enable players to add unique equipment items (weapons, armor) to inventory where each instance is stored separately

**Independent Test**: Add longsword to inventory, add another longsword (should show 2 separate entries), view inventory shows both items individually

### Implementation for User Story 2

- [X] T033 [US2] Create UniqueItem entity extending Item in src/DiceEngine.Domain/Entities/UniqueItem.cs
- [X] T034 [US2] Add SlotType property and Modifiers collection to UniqueItem
- [X] T035 [US2] Implement IsEquippable() and GetModifierForStat() methods in UniqueItem
- [X] T036 [US2] Update InventoryService.AddItemAsync() to handle UniqueItem (always create new entry, quantity=1)
- [X] T037 [P] [US2] Create UniqueItemDto in src/DiceEngine.API/Models/UniqueItemDto.cs
- [X] T038 [P] [US2] Create StackableItemDto in src/DiceEngine.API/Models/StackableItemDto.cs
- [X] T039 [US2] Update InventoryResponse to support both StackableItem and UniqueItem types
- [X] T040 [US2] Test InventoryController endpoints with UniqueItems (verify no stacking occurs)

**Checkpoint**: User Stories 1 AND 2 complete - both stackable and unique items work in inventory

---

## Phase 5: User Story 3 - Equip and Unequip Items to Slots (Priority: P1)

**Goal**: Enable players to equip unique items to 7 equipment slots and unequip items back to inventory

**Independent Test**: Add armor to inventory, equip to Chest slot, view equipment shows armor in Chest, unequip returns armor to inventory

### Implementation for User Story 3

- [X] T041 [P] [US3] Create EquipmentSlot entity in src/DiceEngine.Domain/Entities/EquipmentSlot.cs
- [X] T042 [US3] Implement EquipmentSlot.Equip() with slot type validation
- [X] T043 [US3] Implement EquipmentSlot.Unequip() method
- [X] T044 [US3] Create CharacterService method to initialize 7 equipment slots for new characters in src/DiceEngine.Application/Services/CharacterService.cs
- [X] T045 [US3] Create EquipmentService with EquipItemAsync() method in src/DiceEngine.Application/Services/EquipmentService.cs
- [X] T046 [US3] Implement slot type validation (item.SlotType must match target slot) in EquipmentService
- [X] T047 [US3] Implement inventory check (item must exist in adventure inventory) in EquipmentService.EquipItemAsync()
- [X] T048 [US3] Implement slot replacement logic (unequip previous item, add to inventory) in EquipmentService
- [X] T049 [US3] Implement UnequipItemAsync() method in EquipmentService
- [X] T050 [US3] Implement GetEquipmentAsync() method with stat modifier calculation in EquipmentService
- [X] T051 [P] [US3] Create EquipItemRequest DTO in src/DiceEngine.API/Models/EquipItemRequest.cs
- [X] T052 [P] [US3] Create EquipItemResponse DTO in src/DiceEngine.API/Models/EquipItemResponse.cs
- [X] T053 [P] [US3] Create UnequipItemResponse DTO in src/DiceEngine.API/Models/UnequipItemResponse.cs
- [X] T054 [P] [US3] Create EquipmentResponse DTO in src/DiceEngine.API/Models/EquipmentResponse.cs
- [X] T055 [P] [US3] Create EquipmentSlotDto in src/DiceEngine.API/Models/EquipmentSlotDto.cs
- [X] T056 [US3] Create EquipmentController in src/DiceEngine.API/Controllers/EquipmentController.cs
- [X] T057 [US3] Implement PUT /characters/{id}/equipment/{slotType} endpoint in EquipmentController
- [X] T058 [US3] Implement DELETE /characters/{id}/equipment/{slotType} endpoint in EquipmentController
- [X] T059 [US3] Implement GET /characters/{id}/equipment endpoint with totalModifiers calculation in EquipmentController
- [X] T060 [US3] Add validation error responses (400 Bad Request for wrong slot type, 404 for item not in inventory)

**Checkpoint**: User Stories 1, 2, AND 3 complete - full inventory and equipment system functional

---

## Phase 6: User Story 4 - Generate Random Loot from Loot Tables (Priority: P2)

**Goal**: Enable random item generation from weighted loot tables using dice engine for weighted selection

**Independent Test**: Create loot table with 3 entries (different weights), generate loot 10 times, verify items appear according to weight distribution

### Implementation for User Story 4

- [X] T061 [P] [US4] Create LootTable entity in src/DiceEngine.Domain/Entities/LootTable.cs
- [X] T062 [P] [US4] Create LootTableEntry entity in src/DiceEngine.Domain/Entities/LootTableEntry.cs
- [X] T063 [US4] Implement LootTable.AddEntry() and GetTotalWeight() methods
- [X] T064 [US4] Create LootGeneratorService in src/DiceEngine.Application/Services/LootGeneratorService.cs
- [X] T065 [US4] Implement weighted selection algorithm in LootGeneratorService.GenerateAsync()
- [X] T066 [US4] Integrate with existing DiceService.RollAsync() for random number generation (roll 1d{totalWeight})
- [X] T067 [US4] Implement cumulative weight range matching to select LootTableEntry
- [X] T068 [US4] Call InventoryService.AddItemAsync() to add generated items to adventure inventory
- [X] T069 [US4] Support multiple item generation (count parameter) for treasure chests
- [X] T070 [P] [US4] Create GenerateLootRequest DTO in src/DiceEngine.API/Models/GenerateLootRequest.cs
- [X] T071 [P] [US4] Create GenerateLootResponse DTO in src/DiceEngine.API/Models/GenerateLootResponse.cs
- [X] T072 [P] [US4] Create GeneratedItemDto in src/DiceEngine.API/Models/GeneratedItemDto.cs
- [X] T073 [P] [US4] Create LootTableSummaryDto in src/DiceEngine.API/Models/LootTableSummaryDto.cs
- [X] T074 [P] [US4] Create LootTableDetailsResponse DTO in src/DiceEngine.API/Models/LootTableDetailsResponse.cs
- [X] T075 [US4] Create LootTablesController in src/DiceEngine.API/Controllers/LootTablesController.cs
- [X] T076 [US4] Implement POST /loot-tables/{id}/generate endpoint in LootTablesController
- [X] T077 [US4] Implement GET /loot-tables endpoint with pagination in LootTablesController
- [X] T078 [US4] Implement GET /loot-tables/{id} endpoint with entry details in LootTablesController

**Checkpoint**: User Story 4 complete - loot generation functional and integrated with inventory

---

## Phase 7: User Story 5 - Apply Item Effects and Modifiers (Priority: P2)

**Goal**: Enable items to apply stat modifiers when equipped and calculate total character stats with equipment bonuses

**Independent Test**: Equip armor (+2 Defense), equip weapon (+1 Attack), view character equipment shows totalModifiers: {Defense: 2, Attack: 1}

### Implementation for User Story 5

- [X] T079 [US5] Update EquipmentService.GetEquipmentAsync() to calculate stat modifiers from all equipped items
- [X] T080 [US5] Implement modifier aggregation logic (sum modifiers by statName across all slots)
- [X] T081 [US5] Return totalModifiers dictionary in EquipmentResponse
- [X] T082 [US5] Update EquipmentResponse DTO to include totalModifiers field (verify T054 includes this)
- [X] T083 [US5] Test stat modifier calculation with multiple equipped items
- [X] T084 [US5] Verify stat modifiers are removed when items unequipped (recalculate totalModifiers)

**Checkpoint**: User Story 5 complete - item effects and modifiers fully functional

---

## Phase 8: Admin Item Management (Supporting Feature)

**Purpose**: Enable game administrators to create items and loot tables

- [X] T085 [P] Create ItemsController with GET /items endpoint in src/DiceEngine.API/Controllers/ItemsController.cs
- [X] T086 [P] Implement POST /items endpoint for creating stackable and unique items in ItemsController
- [X] T087 [P] Add filtering by itemType and rarity in GET /items endpoint
- [X] T088 [P] Create CreateStackableItemRequest DTO in src/DiceEngine.API/Models/CreateStackableItemRequest.cs
- [X] T089 [P] Create CreateUniqueItemRequest DTO in src/DiceEngine.API/Models/CreateUniqueItemRequest.cs
- [X] T090 [P] Create ItemListResponse DTO in src/DiceEngine.API/Models/ItemListResponse.cs
- [X] T091 Create ItemService (or extend InventoryService) with CreateItemAsync() method in src/DiceEngine.Application/Services/ItemService.cs

---

## Phase 9: Database Seed Data (Optional)

**Purpose**: Populate database with sample items and loot tables for testing

- [X] T092 Create database seed script with sample stackable items (Healing Potion, Gold Coins, Arrows) in src/DiceEngine.Infrastructure/Persistence/SeedData.cs
- [X] T093 Create database seed script with sample unique items (Iron Longsword, Iron Breastplate, Wooden Shield) in SeedData.cs
- [X] T094 Create sample loot table "Goblin Loot" with weighted entries (60% Gold, 30% Potion, 10% Dagger) in SeedData.cs
- [X] T095 Create sample loot table "Treasure Chest" with multiple valuable items in SeedData.cs
- [X] T096 Execute seed script and verify data in database

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T097 [P] Update Swagger documentation to include inventory, equipment, and loot endpoints in src/DiceEngine.API/Program.cs
- [X] T098 [P] Add XML documentation comments to all controllers and DTOs
- [X] T099 [P] Verify all endpoints return <200ms response time (constitution requirement)
- [X] T100 Add performance indexes if query performance tests fail (equipment_slots, inventory_entries)
- [X] T101 [P] Update API README.md with inventory system endpoints and examples
- [X] T102 Verify quickstart.md scenarios work end-to-end
- [X] T103 Code cleanup: Remove unused imports, format code, fix warnings
- [X] T104 Verify OpenAPI spec matches implemented contracts in specs/004-inventory-system/contracts/openapi.yaml

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
  - **User Story 2 (P1)**: Can start after Foundational - Extends US1 inventory service but independently testable
  - **User Story 3 (P1)**: Can start after Foundational - Depends on US2 (needs UniqueItem) for equipment
  - **User Story 4 (P2)**: Can start after US1+US2 complete - Needs inventory service for adding loot
  - **User Story 5 (P2)**: Can start after US3 complete - Extends equipment with modifier calculations
- **Admin (Phase 8)**: Can start in parallel with user stories after Foundational
- **Seed Data (Phase 9)**: Can start after US1, US2, US4 complete
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### Recommended Execution Order

1. **MVP Path (P1 stories only)**:
   - Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Polish

2. **Full Feature Path**:
   - Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 (US4) → Phase 7 (US5) → Phase 8 → Phase 9 → Phase 10

### Parallel Opportunities

#### Within Setup (Phase 1)

After T001 and T002 complete, tasks T003-T007 can run in parallel (different entity configurations)

#### Within Foundational (Phase 2)

- T010, T011, T013 can run in parallel (different files)
- T014, T015 can run in parallel
- T016 waits for T011 (needs SlotType enum)

#### Within User Story 1

- T017, T018 can run in parallel (different files)
- T025, T026, T027, T028 (all DTOs) can run in parallel

#### Within User Story 2

- T037, T038 can run in parallel (different DTOs)

#### Within User Story 3

- T041-T043 (domain) → then T051-T055 (DTOs in parallel) → then controllers
- T051, T052, T053, T054, T055 can all run in parallel (different DTO files)

#### Within User Story 4

- T061, T062 can run in parallel (different domain entities)
- T070, T071, T072, T073, T074 can all run in parallel (different DTOs)

#### Phase 8 (Admin)

- T085, T086, T087 (controller methods) can run serially
- T088, T089, T090 (DTOs) can run in parallel

#### Phase 10 (Polish)

- T097, T098, T099, T101 can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# After T016 complete, launch all domain entities together:
Task T017: "Create StackableItem entity in src/DiceEngine.Domain/Entities/StackableItem.cs"
Task T018: "Create InventoryEntry entity in src/DiceEngine.Domain/Entities/InventoryEntry.cs"

# After T024 complete, launch all DTOs together:
Task T025: "Create AddItemRequest DTO"
Task T026: "Create AddItemResponse DTO"
Task T027: "Create InventoryResponse DTO"
Task T028: "Create InventoryEntryDto"
```

---

## Implementation Strategy

### MVP First (P1 User Stories Only)

1. Complete Phase 1: Setup (database migration)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (stackable items)
4. Complete Phase 4: User Story 2 (unique items)
5. Complete Phase 5: User Story 3 (equipment slots)
6. **STOP and VALIDATE**: Test full inventory + equipment workflow
7. Deploy/demo MVP

**Result**: Core inventory and equipment system functional, loot generation deferred to next iteration

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (stackable inventory works!)
3. Add User Story 2 → Test independently → Deploy/Demo (unique items work!)
4. Add User Story 3 → Test independently → Deploy/Demo (equipment works! - MVP complete)
5. Add User Story 4 → Test independently → Deploy/Demo (loot generation works!)
6. Add User Story 5 → Test independently → Deploy/Demo (item effects work!)
7. Polish → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T016)
2. Once Foundational is done (after T016):
   - **Developer A**: User Story 1 (T017-T032)
   - **Developer B**: User Story 2 (T033-T040) - can start in parallel with US1
   - **Developer C**: Admin item management (T085-T091) - can start in parallel
3. After US1 and US2 complete:
   - **Developer A**: User Story 3 (T041-T060)
   - **Developer B**: User Story 4 (T061-T078)
4. After US3 and US4 complete:
   - **Developer A or B**: User Story 5 (T079-T084)
   - **Developer C**: Seed data (T092-T096)
5. Team completes Polish together (T097-T104)

---

## Summary

- **Total Tasks**: 104
- **Task Breakdown by User Story**:
  - Setup: 9 tasks
  - Foundational: 7 tasks (CRITICAL - blocks all stories)
  - User Story 1 (P1): 16 tasks
  - User Story 2 (P1): 8 tasks
  - User Story 3 (P1): 20 tasks
  - User Story 4 (P2): 18 tasks
  - User Story 5 (P2): 6 tasks
  - Admin: 7 tasks
  - Seed Data: 5 tasks
  - Polish: 8 tasks

- **Parallel Opportunities**: 35 tasks marked [P] can run in parallel within their phases
- **Independent Test Criteria**: Each user story has clear validation criteria for independent testing
- **MVP Scope**: Phases 1-5 (52 tasks) delivers core inventory and equipment system
- **Full Feature**: All phases (104 tasks) delivers complete inventory system with loot generation and effects

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are OPTIONAL - add test tasks if TDD approach is desired
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Database migration (T001-T009) must complete before domain entities can be implemented
- EF Core will generate migration code based on entity configurations
