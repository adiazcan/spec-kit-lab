# Tasks: Multi-Stage Quest System

**Input**: Design documents from `/specs/006-multi-stage-quests/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/openapi.yaml  
**Tests**: Not requested in spec (no test tasks included)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration wiring

- [x] T001 Add quest options section in src/DiceEngine.API/appsettings.json
- [x] T002 Add quest options section in src/DiceEngine.API/appsettings.Development.json
- [x] T003 Create QuestOptions class in src/DiceEngine.Application/Models/QuestOptions.cs
- [x] T004 Bind QuestOptions in src/DiceEngine.API/Program.cs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts and base types used across all stories

- [x] T005 Add quest enums/value objects in src/DiceEngine.Domain/ValueObjects/QuestEnums.cs
- [x] T006 Add quest exceptions in src/DiceEngine.Application/Exceptions/QuestExceptions.cs
- [x] T007 [P] Create IQuestRepository in src/DiceEngine.Application/Services/IQuestRepository.cs
- [x] T008 [P] Create IQuestService in src/DiceEngine.Application/Services/IQuestService.cs
- [x] T009 [P] Create IStageProgressService in src/DiceEngine.Application/Services/IStageProgressService.cs
- [x] T010 [P] Create IDependencyResolver in src/DiceEngine.Application/Services/IDependencyResolver.cs
- [x] T011 [P] Create IRewardService in src/DiceEngine.Application/Services/IRewardService.cs

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Accept and Track Multi-Stage Quest (Priority: P1) 🎯 MVP

**Goal**: Accept quests with multiple stages, track objectives, and progress stages sequentially  
**Independent Test**: Accept a quest with 3 stages; verify stages are visible, current stage is shown, and completing stage 2 advances to stage 3.

### Implementation for User Story 1

- [x] T012 [P] [US1] Create Quest entity in src/DiceEngine.Domain/Entities/Quest.cs
- [x] T013 [P] [US1] Create QuestStage entity in src/DiceEngine.Domain/Entities/QuestStage.cs
- [x] T014 [P] [US1] Create QuestObjective entity in src/DiceEngine.Domain/Entities/QuestObjective.cs
- [x] T015 [P] [US1] Create QuestProgress entity in src/DiceEngine.Domain/Entities/QuestProgress.cs
- [x] T016 [P] [US1] Create StageProgress entity in src/DiceEngine.Domain/Entities/StageProgress.cs
- [x] T017 [P] [US1] Create ObjectiveProgress entity in src/DiceEngine.Domain/Entities/ObjectiveProgress.cs
- [x] T018 [US1] Add quest DbSets and mappings in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T019 [US1] Add quest migration in src/DiceEngine.Infrastructure/Migrations/20260129_AddQuestSystem.cs
- [x] T020 [P] [US1] Create QuestSummaryDto in src/DiceEngine.Application/Models/QuestSummaryDto.cs
- [x] T021 [P] [US1] Create QuestProgressDto in src/DiceEngine.Application/Models/QuestProgressDto.cs
- [x] T022 [P] [US1] Create StageProgressDto in src/DiceEngine.Application/Models/StageProgressDto.cs
- [x] T023 [P] [US1] Create ObjectiveProgressDto in src/DiceEngine.Application/Models/ObjectiveProgressDto.cs
- [x] T024 [US1] Implement QuestRepository in src/DiceEngine.Infrastructure/Persistence/Repositories/QuestRepository.cs
- [x] T025 [US1] Implement QuestService in src/DiceEngine.Application/Services/QuestService.cs
- [x] T026 [US1] Implement StageProgressService in src/DiceEngine.Application/Services/StageProgressService.cs
- [x] T027 [US1] Register quest services and repository in src/DiceEngine.API/Program.cs
- [x] T028 [P] [US1] Create quest API request models in src/DiceEngine.API/Models/QuestRequests.cs
- [x] T029 [US1] Implement QuestsController in src/DiceEngine.API/Controllers/QuestsController.cs
- [x] T030 [US1] Implement ProgressController in src/DiceEngine.API/Controllers/ProgressController.cs
- [x] T031 [US1] Implement StagesController in src/DiceEngine.API/Controllers/StagesController.cs

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 4 - Persist Quest State (Priority: P1)

**Goal**: Persist quest progress across sessions and allow resumption  
**Independent Test**: Progress to stage 3/5, restart session, verify stage 3 and objective progress remain intact.

### Implementation for User Story 4

- [x] T032 [US4] Add RowVersion concurrency configuration for QuestProgress in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T033 [US4] Handle DbUpdateConcurrencyException in src/DiceEngine.Application/Services/StageProgressService.cs
- [x] T034 [US4] Resume abandoned quests on accept in src/DiceEngine.Application/Services/QuestService.cs
- [x] T035 [US4] Expand persisted progress loading in src/DiceEngine.Infrastructure/Persistence/Repositories/QuestRepository.cs

**Checkpoint**: Quest state persists and restores correctly

---

## Phase 5: User Story 5 - Complete Quest and Receive Rewards (Priority: P1)

**Goal**: Grant rewards when a quest completes  
**Independent Test**: Complete final stage; verify all reward types are granted and visible.

### Implementation for User Story 5

- [x] T036 [P] [US5] Create QuestReward entity in src/DiceEngine.Domain/Entities/QuestReward.cs
- [x] T037 [US5] Map QuestReward in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T038 [P] [US5] Create RewardDto in src/DiceEngine.Application/Models/RewardDto.cs
- [x] T039 [US5] Implement RewardService in src/DiceEngine.Application/Services/RewardService.cs
- [x] T040 [US5] Grant rewards on final stage completion in src/DiceEngine.Application/Services/StageProgressService.cs
- [x] T041 [US5] Include rewards in stage completion response in src/DiceEngine.API/Controllers/StagesController.cs

**Checkpoint**: Quest completion grants rewards consistently

---

## Phase 6: User Story 2 - Handle Stage Success and Failure (Priority: P2)

**Goal**: Evaluate success/failure conditions and handle failure states  
**Independent Test**: Complete success conditions to advance; trigger failure condition and verify failed state.

### Implementation for User Story 2

- [x] T042 [P] [US2] Create FailureCondition entity in src/DiceEngine.Domain/Entities/FailureCondition.cs
- [x] T043 [US2] Map FailureCondition in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T044 [US2] Create IConditionEvaluator in src/DiceEngine.Application/Services/IConditionEvaluator.cs
- [x] T045 [US2] Implement ConditionEvaluator in src/DiceEngine.Application/Services/ConditionEvaluator.cs
- [x] T046 [US2] Evaluate failure conditions and mark quest failed in src/DiceEngine.Application/Services/StageProgressService.cs
- [x] T047 [US2] Return failure state details in src/DiceEngine.API/Controllers/StagesController.cs

**Checkpoint**: Failure conditions correctly block progression

---

## Phase 7: User Story 3 - Manage Quest Dependencies (Priority: P2)

**Goal**: Enforce prerequisite quests before acceptance  
**Independent Test**: Verify locked quest when prerequisites incomplete; unlock after completing prerequisites.

### Implementation for User Story 3

- [x] T048 [P] [US3] Create QuestDependency entity in src/DiceEngine.Domain/Entities/QuestDependency.cs
- [x] T049 [US3] Map QuestDependency in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T050 [US3] Implement DependencyResolver in src/DiceEngine.Application/Services/DependencyResolver.cs
- [x] T051 [US3] Enforce prerequisites in src/DiceEngine.Application/Services/QuestService.cs
- [x] T052 [US3] Add dependencies endpoint in src/DiceEngine.API/Controllers/QuestsController.cs

**Checkpoint**: Dependency checks prevent premature acceptance

---

## Phase 8: User Story 6 - View Quest Progress and Details (Priority: P2)

**Goal**: Provide detailed quest progress visibility  
**Independent Test**: Open quest details to see current stage, objectives, progress %, and upcoming stages.

### Implementation for User Story 6

- [x] T053 [US6] Add progress percentage and stage preview fields in src/DiceEngine.Application/Models/QuestProgressDto.cs
- [x] T054 [US6] Update QuestRepository projections for detailed views in src/DiceEngine.Infrastructure/Persistence/Repositories/QuestRepository.cs
- [x] T055 [US6] Update ProgressController responses to include details in src/DiceEngine.API/Controllers/ProgressController.cs
- [x] T056 [US6] Update QuestsController list to include lock status/reason in src/DiceEngine.API/Controllers/QuestsController.cs

**Checkpoint**: Progress and details view is complete and usable

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T057 [P] Document quest API usage in docs/QUEST_SYSTEM.md
- [x] T058 Add AsNoTracking to quest read queries in src/DiceEngine.Infrastructure/Persistence/Repositories/QuestRepository.cs
- [x] T059 Update quickstart.md with any endpoint changes in specs/006-multi-stage-quests/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phase 3+)** → **Polish (Phase 9)**

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational
- **US4 (P1)**: Depends on US1
- **US5 (P1)**: Depends on US1
- **US2 (P2)**: Depends on US1
- **US3 (P2)**: Depends on US1
- **US6 (P2)**: Depends on US1

---

## Parallel Execution Examples

### User Story 1

- T012, T013, T014, T015, T016, T017 (entity files in Domain)
- T020, T021, T022, T023 (DTO files in Application)
- T028 (API request models) can run alongside other model tasks

### User Story 4

- No parallel tasks (shared files)

### User Story 5

- T036 (QuestReward entity) and T038 (RewardDto) can run in parallel

### User Story 2

- T042 (FailureCondition entity) can run in parallel with T044 (interface) if desired

### User Story 3

- T048 (QuestDependency entity) can run in parallel with other domain tasks

### User Story 6

- No parallel tasks (shared files)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate US1 independently
5. Stop or proceed to next story

### Incremental Delivery

1. Setup + Foundational
2. US1 → Validate
3. US4 → Validate persistence
4. US5 → Validate rewards
5. US2 → Validate failure handling
6. US3 → Validate dependencies
7. US6 → Validate detailed view
8. Polish
