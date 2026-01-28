---
description: "Task list for Character Management System implementation"
---

# Tasks: Character Management System

**Input**: Design documents from `/specs/003-character-management/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/openapi.yaml ✅, quickstart.md ✅

**Tests**: NOT REQUIRED - No explicit test request in feature specification

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Repository root: `/workspaces/spec-kit-lab/`
- Source: `src/DiceEngine.[Layer]/`
- Tests: `tests/DiceEngine.[Layer].Tests/`
- Clean Architecture layers: Domain, Application, Infrastructure, API

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure (no new projects needed - extending existing DiceEngine)

- [x] T001 Validate existing DiceEngine solution structure and dependencies
- [x] T002 [P] Review Adventure entity integration points in src/DiceEngine.Domain/Entities/
- [x] T003 [P] Review existing DbContext in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create Character entity (aggregate root) in src/DiceEngine.Domain/Entities/Character.cs
- [x] T005 Create CharacterSnapshot entity in src/DiceEngine.Domain/Entities/CharacterSnapshot.cs
- [x] T006 [P] Create ICharacterRepository interface in src/DiceEngine.Application/Services/ICharacterRepository.cs
- [x] T007 [P] Create CharacterRepository implementation in src/DiceEngine.Infrastructure/Persistence/Repositories/CharacterRepository.cs
- [x] T008 Update DiceEngineDbContext with Character and CharacterSnapshot DbSets in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T009 Configure Character entity mapping in DiceEngineDbContext OnModelCreating method
- [x] T010 Configure CharacterSnapshot entity mapping in DiceEngineDbContext OnModelCreating method
- [x] T011 Create EF Core migration for Character and CharacterSnapshot tables
- [x] T012 Apply migration to PostgreSQL database
- [x] T013 [P] Create CharacterDto in src/DiceEngine.Application/Models/CharacterDto.cs
- [x] T014 [P] Create CharacterAttributesDto in src/DiceEngine.Application/Models/CharacterAttributesDto.cs
- [x] T015 [P] Create AttributeValueDto in src/DiceEngine.Application/Models/AttributeValueDto.cs
- [x] T016 [P] Create CharacterSnapshotDto in src/DiceEngine.Application/Models/CharacterSnapshotDto.cs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create New Character (Priority: P1) 🎯 MVP

**Goal**: Enable users to create characters with five attributes (STR, DEX, INT, CON, CHA) and automatic modifier calculation

**Independent Test**: Create a character with all five attributes via API, retrieve it, and verify: (1) character persisted with correct ID, (2) all five base attribute values match input, (3) all five modifiers calculated correctly using (base-10)/2 floor division formula, (4) character linked to adventure. Delivers immediate value - functional character ready for gameplay.

### Implementation for User Story 1

- [x] T017 [P] [US1] Create CreateCharacterRequest model in src/DiceEngine.Application/Models/CreateCharacterRequest.cs
- [x] T018 [US1] Implement ICharacterService interface in src/DiceEngine.Application/Services/ICharacterService.cs with CreateAsync method signature
- [x] T019 [US1] Implement CharacterService.CreateAsync with validation and modifier calculation in src/DiceEngine.Application/Services/CharacterService.cs
- [x] T020 [US1] Implement CharactersController with POST /api/adventures/{adventureId}/characters endpoint in src/DiceEngine.API/Controllers/CharactersController.cs
- [x] T021 [US1] Add CharacterService registration to dependency injection in src/DiceEngine.API/Program.cs
- [x] T022 [US1] Add CharacterRepository registration to dependency injection in src/DiceEngine.API/Program.cs
- [x] T023 [US1] Add input validation for attribute ranges (3-18) in CreateCharacterRequest
- [x] T024 [US1] Add adventure existence validation in CharacterService.CreateAsync
- [x] T025 [US1] Add error handling for missing adventure (404) in CharactersController

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - can create characters with auto-calculated modifiers

---

## Phase 4: User Story 2 - Retrieve Character Details (Priority: P1)

**Goal**: Enable users to retrieve complete character information including name, attributes, and calculated modifiers for gameplay

**Independent Test**: Create a character, retrieve it by ID via API, and verify: (1) returned character has correct ID and name, (2) all five attributes returned with base values and modifiers, (3) adventure ID matches. Also test list endpoint: create three characters for an adventure, retrieve all, verify all three returned with complete data. Test 404 for non-existent character. Delivers immediate gameplay value - users can access created characters.

### Implementation for User Story 2

- [x] T026 [US2] Add GetAsync method to ICharacterService interface for retrieve by ID
- [x] T027 [US2] Add ListAsync method to ICharacterService interface for list by adventure
- [x] T028 [US2] Implement CharacterService.GetAsync with repository lookup in src/DiceEngine.Application/Services/CharacterService.cs
- [x] T029 [US2] Implement CharacterService.ListAsync with pagination support in src/DiceEngine.Application/Services/CharacterService.cs
- [x] T030 [US2] Implement GET /api/adventures/{adventureId}/characters/{characterId} endpoint in src/DiceEngine.API/Controllers/CharactersController.cs
- [x] T031 [US2] Implement GET /api/adventures/{adventureId}/characters endpoint with pagination in src/DiceEngine.API/Controllers/CharactersController.cs
- [x] T032 [P] [US2] Create CharacterListResponse model in src/DiceEngine.Application/Models/CharacterListResponse.cs
- [x] T033 [US2] Add error handling for character not found (404) in CharactersController
- [x] T034 [US2] Add adventure ID validation check in GET endpoints

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - can create and retrieve characters with full attribute data

---

## Phase 5: User Story 3 - Update Character Attributes (Priority: P2)

**Goal**: Enable users to modify character attributes during gameplay with automatic modifier recalculation

**Independent Test**: Create a character with STR=10 (modifier=0), update STR to 16 via API, retrieve character, and verify: (1) STR base value is 16, (2) STR modifier recalculated to 3, (3) version incremented, (4) lastModifiedAt timestamp updated. Test updating multiple attributes simultaneously. Test validation rejection for invalid values (19 or 2). Test optimistic locking with 409 Conflict on version mismatch. Delivers character progression capability.

### Implementation for User Story 3

- [x] T035 [P] [US3] Create UpdateCharacterRequest model with version field in src/DiceEngine.Application/Models/UpdateCharacterRequest.cs
- [x] T036 [US3] Add UpdateAsync method to ICharacterService interface with optimistic locking
- [x] T037 [US3] Implement Character.UpdateAttributes method in src/DiceEngine.Domain/Entities/Character.cs
- [x] T038 [US3] Implement CharacterService.UpdateAsync with version check and modifier recalculation in src/DiceEngine.Application/Services/CharacterService.cs
- [x] T039 [US3] Implement PUT /api/adventures/{adventureId}/characters/{characterId} endpoint in src/DiceEngine.API/Controllers/CharactersController.cs
- [x] T040 [US3] Add optimistic locking version mismatch handling (409 Conflict) in CharactersController
- [x] T041 [US3] Add attribute range validation (3-18) in UpdateCharacterRequest
- [x] T042 [US3] Add error handling for update validation failures (400) in CharactersController

**Checkpoint**: All P1 and P2 stories complete - character creation, retrieval, and updates fully functional with automatic modifier calculation

---

## Phase 6: User Story 4 - Character Version Snapshots (Priority: P3)

**Goal**: Enable users to save character state at key moments for game saves and historical tracking

**Independent Test**: Create a character with STR=12, save snapshot labeled "Level 1", modify character to STR=16, save another snapshot "Level 2", retrieve all snapshots via API, and verify: (1) both snapshots retrievable with correct labels and timestamps, (2) "Level 1" snapshot has STR=12 with modifier=1, (3) "Level 2" snapshot has STR=16 with modifier=3, (4) current character has STR=16, (5) snapshots in chronological order. Test snapshot with null label (auto-generated). Delivers game save functionality.

### Implementation for User Story 4

- [x] T043 [P] [US4] Create CreateSnapshotRequest model in src/DiceEngine.Application/Models/CreateSnapshotRequest.cs
- [x] T044 [P] [US4] Create SnapshotListResponse model in src/DiceEngine.Application/Models/SnapshotListResponse.cs
- [x] T045 [US4] Add CreateSnapshotAsync method to ICharacterService interface
- [x] T046 [US4] Add GetSnapshotAsync method to ICharacterService interface
- [x] T047 [US4] Add ListSnapshotsAsync method to ICharacterService interface with pagination
- [x] T048 [US4] Implement CharacterSnapshot.CreateFromCharacter factory method in src/DiceEngine.Domain/Entities/CharacterSnapshot.cs
- [x] T049 [US4] Implement CharacterService.CreateSnapshotAsync with snapshot capture in src/DiceEngine.Application/Services/CharacterService.cs
- [x] T050 [US4] Implement CharacterService.GetSnapshotAsync in src/DiceEngine.Application/Services/CharacterService.cs
- [x] T051 [US4] Implement CharacterService.ListSnapshotsAsync with chronological ordering in src/DiceEngine.Application/Services/CharacterService.cs
- [x] T052 [US4] Implement POST /api/characters/{characterId}/snapshots endpoint in src/DiceEngine.API/Controllers/CharactersController.cs
- [x] T053 [US4] Implement GET /api/characters/{characterId}/snapshots endpoint with pagination in src/DiceEngine.API/Controllers/CharactersController.cs
- [x] T054 [US4] Implement GET /api/characters/{characterId}/snapshots/{snapshotId} endpoint in src/DiceEngine.API/Controllers/CharactersController.cs
- [x] T055 [US4] Add error handling for character not found when creating snapshot (404)
- [x] T056 [US4] Add error handling for snapshot not found (404)

**Checkpoint**: All user stories through P3 complete including snapshots - full character management with versioning

---

## Phase 7: User Story 5 - Remove Character (Priority: P3)

**Goal**: Enable users to delete characters no longer part of the active adventure

**Independent Test**: Create a character, delete it via API expecting 204 No Content, attempt to retrieve the deleted character expecting 404 Not Found, verify character and all its snapshots permanently removed from database. Test deletion of character with multiple snapshots to verify cascade. Delivers data management capability.

### Implementation for User Story 5

- [ ] T057 [US5] Add DeleteAsync method to ICharacterService interface
- [ ] T058 [US5] Implement CharacterService.DeleteAsync with cascade delete in src/DiceEngine.Application/Services/CharacterService.cs
- [ ] T059 [US5] Implement DELETE /api/adventures/{adventureId}/characters/{characterId} endpoint in src/DiceEngine.API/Controllers/CharactersController.cs
- [ ] T060 [US5] Add error handling for character not found during delete (404)
- [ ] T061 [US5] Verify cascade delete of snapshots configured in CharacterSnapshot entity mapping

**Checkpoint**: All user stories complete - full CRUD operations for characters with snapshots and deletion

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T062 [P] Add XML documentation comments to CharactersController endpoints
- [ ] T063 [P] Add logging for character operations in CharacterService
- [ ] T064 [P] Update Swagger/OpenAPI configuration to include character endpoints in src/DiceEngine.API/Program.cs
- [ ] T065 Verify all endpoints return proper HTTP status codes per contracts/openapi.yaml
- [ ] T066 [P] Add performance logging for database queries in CharacterRepository
- [ ] T067 Run quickstart.md validation scenarios and verify all examples work
- [ ] T068 [P] Add database indexes for performance (CharacterId in snapshots, AdventureId in characters)
- [ ] T069 Code cleanup and refactoring for consistency with existing DiceEngine patterns
- [ ] T070 [P] Update README.md with Character Management feature documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion (can run parallel with US1 if staffed)
- **User Story 3 (Phase 5)**: Depends on Foundational completion (can run parallel with US1/US2 if staffed)
- **User Story 4 (Phase 6)**: Depends on Foundational completion (can run parallel with other stories if staffed)
- **User Story 5 (Phase 7)**: Depends on Foundational completion (can run parallel with other stories if staffed)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Uses Character entity from US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Updates Character from US1 but independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Uses CharacterSnapshot entity, independent of other stories
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Deletes Character/Snapshots but independently testable

### Within Each User Story

**General Pattern**:

- Request/Response models before service methods
- Service interface before service implementation
- Service implementation before controller endpoints
- Core implementation before error handling
- Story complete before moving to next priority

**Specific Blocking Dependencies**:

- T017 must complete before T019 (CreateCharacterRequest needed for CreateAsync)
- T018 must complete before T019 (interface before implementation)
- T019 must complete before T020 (service before controller)
- T020, T021, T022 must complete before T023-T025 (endpoints before validation/error handling)
- Same pattern repeats for each user story

### Parallel Opportunities

**Phase 1 (Setup)**:

- T002 and T003 can run in parallel (different files)

**Phase 2 (Foundational)**:

- T006 and T007 can run in parallel after T004-T005 (interface and implementation in different files)
- T013, T014, T015, T016 can all run in parallel (different DTO files)

**Phase 3 (User Story 1)**:

- T017 can run in parallel with T018 (different files)

**Phase 4 (User Story 2)**:

- T032 can run in parallel with T026-T031 (response model in different file)

**Phase 5 (User Story 3)**:

- T035 can run in parallel with T036 (different files)

**Phase 6 (User Story 4)**:

- T043 and T044 can run in parallel (different files)
- T045, T046, T047 can run in parallel (interface methods)

**Phase 8 (Polish)**:

- T062, T063, T066, T068, T070 can all run in parallel (different files/concerns)

**Cross-User-Story Parallelization**:

- After Foundational phase completes, multiple team members can work on US1, US2, US3, US4, US5 in parallel since they are independently testable

---

## Parallel Example: Foundational Phase

```bash
# After Character and CharacterSnapshot entities complete (T004-T005),
# launch these tasks together:

Task T006: "Create ICharacterRepository interface in src/DiceEngine.Application/Services/ICharacterRepository.cs"
Task T007: "Create CharacterRepository implementation in src/DiceEngine.Infrastructure/Persistence/Repositories/CharacterRepository.cs"

# After DbContext mapping configured (T008-T010), launch DTO creation together:

Task T013: "Create CharacterDto in src/DiceEngine.Application/Models/CharacterDto.cs"
Task T014: "Create CharacterAttributesDto in src/DiceEngine.Application/Models/CharacterAttributesDto.cs"
Task T015: "Create AttributeValueDto in src/DiceEngine.Application/Models/AttributeValueDto.cs"
Task T016: "Create CharacterSnapshotDto in src/DiceEngine.Application/Models/CharacterSnapshotDto.cs"
```

## Parallel Example: Multi-Story Development

```bash
# After Foundational phase (Phase 2) complete, with 3 developers:

Developer A (US1): Tasks T017-T025 (Create Character)
Developer B (US2): Tasks T026-T034 (Retrieve Character)
Developer C (US3): Tasks T035-T042 (Update Character)

# Each developer delivers independently testable story increment
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Create Character)
4. Complete Phase 4: User Story 2 (Retrieve Character)
5. **STOP and VALIDATE**: Test US1 and US2 independently - create, retrieve, verify modifiers
6. Deploy/demo if ready - delivers core character management (create + read)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + User Story 2 (both P1) → Test independently → Deploy/Demo (MVP! Complete create + read)
3. Add User Story 3 (P2) → Test independently → Deploy/Demo (adds character progression)
4. Add User Story 4 (P3) → Test independently → Deploy/Demo (adds versioning)
5. Add User Story 5 (P3) → Test independently → Deploy/Demo (adds deletion)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (Phase 1-2)
2. Once Foundational is done:
   - Developer A: User Story 1 (Phase 3) - Create operations
   - Developer B: User Story 2 (Phase 4) - Retrieve operations
   - Developer C: User Story 3 (Phase 5) - Update operations
3. Once P1-P2 stories complete:
   - Developer A: User Story 4 (Phase 6) - Snapshots
   - Developer B: User Story 5 (Phase 7) - Delete
   - Developer C: Polish (Phase 8) - Cross-cutting
4. Stories complete and integrate independently

---

## Task Summary

- **Total Tasks**: 70
- **Setup Phase**: 3 tasks
- **Foundational Phase**: 13 tasks (BLOCKS all user stories)
- **User Story 1 (P1)**: 9 tasks (Create Character)
- **User Story 2 (P1)**: 9 tasks (Retrieve Character)
- **User Story 3 (P2)**: 8 tasks (Update Character)
- **User Story 4 (P3)**: 14 tasks (Snapshots)
- **User Story 5 (P3)**: 5 tasks (Delete Character)
- **Polish Phase**: 9 tasks

**Parallel Opportunities**: 15 tasks marked [P] can run in parallel within their phases

**MVP Scope (Recommended)**: Complete through Phase 4 (User Stories 1-2) = 34 tasks total

- Delivers: Character creation with automatic modifier calculation + retrieval
- Independent test: Create character → retrieve → verify attributes/modifiers
- Provides immediate gameplay value

---

## Validation Checklist

All tasks follow required format:

- ✅ ALL tasks use checkbox format `- [ ] [ID] ...`
- ✅ ALL task IDs sequential (T001-T070)
- ✅ ALL user story tasks have [Story] label ([US1]-[US5])
- ✅ ALL parallel tasks marked [P]
- ✅ ALL tasks include exact file paths
- ✅ NO tasks with placeholders or vague descriptions
- ✅ Setup phase has NO story labels
- ✅ Foundational phase has NO story labels
- ✅ User story phases ALL have story labels
- ✅ Polish phase has NO story labels

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Character modifiers calculated using Math.Floor((base-10)/2) formula per research.md
- Optimistic locking via Version field prevents lost updates
- Snapshots are immutable read-only archives (no restoration per FR-019)
- All endpoints follow RESTful conventions per contracts/openapi.yaml
- Target <200ms response time per constitution
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
