---
description: "Task list for Adventure Initialization System"
---

# Tasks: Adventure Initialization System

**Input**: Design documents from `/specs/002-adventure-init/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include targeted tests per user story as requested in spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Repository root uses `src/` and `tests/`
- Feature docs live in `specs/002-adventure-init/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Validate environment and tooling needed for adventure feature.

- [x] T001 Restore solution dependencies for DiceEngine.slnx
- [x] T002 [P] Verify PostgreSQL connection string covers adventures in src/DiceEngine.API/appsettings.Development.json
- [x] T003 [P] Ensure EF Core design/Npgsql tools references for migrations in src/DiceEngine.Infrastructure/DiceEngine.Infrastructure.csproj

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain, persistence, and schema required by all user stories. No user story work can begin until this phase is complete.

- [x] T004 Create Adventure aggregate and GameState value object in src/DiceEngine.Domain/Entities/Adventure.cs and src/DiceEngine.Domain/ValueObjects/GameState.cs
- [x] T005 Configure Adventure DbSet and model mapping in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T006 Implement Adventure repository interface and class in src/DiceEngine.Infrastructure/Persistence/Repositories/AdventureRepository.cs
- [x] T007 Generate EF Core migration AddAdventureEntity and apply schema updates under src/DiceEngine.Infrastructure/Migrations/AddAdventureEntity.cs

**Checkpoint**: Adventure domain, repository, and database schema are in place.

---

## Phase 3: User Story 1 - Initiate a New Adventure (Priority: P1) 🎯 MVP

**Goal**: Allow users to create a new adventure with unique ID, timestamps, initial scene, and default game state.

**Independent Test**: POST `/api/adventures` returns 201 with populated adventure object (Id, CreatedAt, LastUpdatedAt, CurrentSceneId, GameState defaulted) and Location header.

- [x] T008 [US1] Add create DTOs (CreateAdventureRequest, AdventureDto) in src/DiceEngine.Application/Models/
- [x] T009 [US1] Implement AdventureService.CreateAsync with default scene/state and timestamping in src/DiceEngine.Application/Services/AdventureService.cs
- [x] T010 [US1] Add POST /api/adventures endpoint with validation and CreatedAtAction response in src/DiceEngine.API/Controllers/AdventuresController.cs
- [x] T011 [US1] Register AdventureService and AdventureRepository for DI in src/DiceEngine.API/Program.cs
- [x] T012 [P] [US1] Add AdventureService create unit tests (happy/validation) in tests/DiceEngine.Application.Tests/AdventureServiceTests.cs
- [x] T013 [P] [US1] Add AdventuresController create tests for 201/400 cases in tests/DiceEngine.API.Tests/AdventuresControllerTests.cs

**Checkpoint**: Adventure creation endpoint delivers a ready-to-play adventure.

---

## Phase 4: User Story 2 - Retrieve Adventure State (Priority: P1)

**Goal**: Users can fetch an existing adventure by ID with full state.

**Independent Test**: Create an adventure, GET `/api/adventures/{id}`, verify all fields match persisted state; invalid ID returns 404.

- [x] T014 [US2] Implement AdventureService.GetAsync retrieval with 404 handling in src/DiceEngine.Application/Services/AdventureService.cs
- [x] T015 [US2] Add GET /api/adventures/{id} endpoint in src/DiceEngine.API/Controllers/AdventuresController.cs
- [x] T016 [P] [US2] Add AdventureService retrieval unit tests (found/not found) in tests/DiceEngine.Application.Tests/AdventureServiceTests.cs
- [x] T017 [P] [US2] Add AdventuresController retrieval tests for 200/404 responses in tests/DiceEngine.API.Tests/AdventuresControllerTests.cs

**Checkpoint**: Adventure retrieval works with correct state and error handling.

---

## Phase 5: User Story 3 - Update Adventure Progression (Priority: P1)

**Goal**: Persist scene changes and game state updates with timestamp refresh.

**Independent Test**: Create adventure, PUT `/api/adventures/{id}` with new scene and game state, then GET to confirm updates and LastUpdatedAt change; invalid ID returns 404.

- [x] T018 [US3] Update UpdateAdventureRequest model defaults and validation in src/DiceEngine.Application/Models/UpdateAdventureRequest.cs
- [x] T019 [US3] Implement AdventureService.UpdateAsync merging state and updating LastUpdatedAt in src/DiceEngine.Application/Services/AdventureService.cs
- [x] T020 [US3] Add PUT /api/adventures/{id} endpoint with validation and 200/400/404 handling in src/DiceEngine.API/Controllers/AdventuresController.cs
- [x] T021 [P] [US3] Add AdventureService update unit tests (merge/state/timestamp) in tests/DiceEngine.Application.Tests/AdventureServiceTests.cs
- [x] T022 [P] [US3] Add AdventuresController update tests for success/validation/404 in tests/DiceEngine.API.Tests/AdventuresControllerTests.cs

**Checkpoint**: Adventure updates persist scene and game state with correct timestamps.

---

## Phase 6: User Story 4 - Delete Completed or Unwanted Adventure (Priority: P2)

**Goal**: Users can remove an adventure by ID with proper 204/404 responses.

**Independent Test**: Create adventure, DELETE `/api/adventures/{id}` returns 204; subsequent GET returns 404.

- [x] T023 [US4] Implement AdventureService.DeleteAsync for hard deletes in src/DiceEngine.Application/Services/AdventureService.cs
- [x] T024 [US4] Add DELETE /api/adventures/{id} endpoint with 204/404 handling in src/DiceEngine.API/Controllers/AdventuresController.cs
- [x] T025 [P] [US4] Add AdventureService delete unit tests (exists/not exists) in tests/DiceEngine.Application.Tests/AdventureServiceTests.cs
- [x] T026 [P] [US4] Add AdventuresController delete tests for 204/404 cases in tests/DiceEngine.API.Tests/AdventuresControllerTests.cs

**Checkpoint**: Adventures can be deleted and confirm absence on retrieval.

---

## Phase 7: User Story 5 - List All User Adventures (Priority: P2)

**Goal**: Provide paginated list of adventures with metadata.

**Independent Test**: Create multiple adventures, GET `/api/adventures?page=1&limit=20` returns list with total/hasMore; invalid pagination returns 400; empty set returns empty list.

- [x] T027 [US5] Implement AdventureService.ListAsync and GetTotalCountAsync with pagination limits in src/DiceEngine.Application/Services/AdventureService.cs
- [x] T028 [US5] Add GET /api/adventures pagination endpoint and response wrapper in src/DiceEngine.API/Controllers/AdventuresController.cs
- [x] T029 [P] [US5] Add AdventureService pagination unit tests (limits/hasMore) in tests/DiceEngine.Application.Tests/AdventureServiceTests.cs
- [x] T030 [P] [US5] Add AdventuresController list tests for paging bounds and empty results in tests/DiceEngine.API.Tests/AdventuresControllerTests.cs

**Checkpoint**: Adventure listing returns paginated results with correct metadata.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Align contracts, logging, and validation across stories.

- [x] T031 [P] Sync OpenAPI contract with implemented responses in specs/002-adventure-init/contracts/openapi.yaml
- [x] T032 Add adventure endpoint logging/error handling wiring in src/DiceEngine.API/Program.cs
- [x] T033 Run quickstart validation steps in specs/002-adventure-init/quickstart.md

---

## Dependencies & Execution Order

- Setup → Foundational → User Stories (US1 → US2 → US3 → US4 → US5) → Polish
- US2, US3 depend on creation primitives from US1; US4 and US5 depend on persisted adventures from US1 and retrieval from US2.
- Database migration (T007) must precede all user stories.

## Parallel Execution Examples

- After foundational completion, US1 service/controller implementation (T009–T011) can proceed while tests (T012–T013) are authored in parallel.
- For US2–US5, service tests (e.g., T016, T021, T025, T029) and controller tests (e.g., T017, T022, T026, T030) can be written concurrently once service/controller signatures are stubbed.
- Polish tasks T031 and T033 can run in parallel since they touch different artifacts (contracts vs quickstart walkthrough).

## Implementation Strategy

- MVP first: deliver US1 end-to-end after Setup and Foundational, then validate creation flow.
- Incremental delivery: add US2 retrieval, US3 update, US4 delete, and US5 list sequentially, validating each checkpoint independently.
- Keep migrations and DI registrations small and focused to avoid cross-story coupling; prefer thin controllers delegating to services.
