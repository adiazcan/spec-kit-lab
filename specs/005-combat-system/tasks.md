# Combat System: Task Breakdown

**Feature**: Turn-Based Combat System  
**Branch**: `005-combat-system`  
**Generated**: 2026-01-29  
**Status**: Ready for Implementation

---

## Overview

This task breakdown implements the Turn-Based Combat System with NPC/enemy AI state machines, initiative ordering, attack/damage resolution, and comprehensive unit test coverage. Tasks are organized by user story to enable independent implementation and testing of each feature increment.

**Context**:

- **Paths**: Using existing project structure (`src/DiceEngine.*`, `tests/DiceEngine.*.Tests/`)
- **Tech Stack**: C# ASP.NET Core 10, Entity Framework Core, PostgreSQL, xUnit
- **Integration**: Builds on existing DiceService for all random rolls
- **TDD**: Tests requested - each user story phase includes corresponding unit tests

**Task Format**:

- `- [ ] T001` = Task ID (sequential execution order)
- `[P]` = Parallelizable (different files, no dependencies on incomplete tasks)
- `[US#]` = User Story label (US1, US2, US3, US4)
- All tasks include specific file paths

---

## Phase 1: Setup & Infrastructure

**Goal**: Prepare database schema and shared infrastructure for combat system

**Duration**: 1-2 days

### Database & Configuration Tasks

- [x] T001 Create database migration 005_AddCombatSystem in src/DiceEngine.Infrastructure/Migrations/
- [x] T002 Configure CombatEncounter entity with EF Core in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T003 Configure Combatant entity with EF Core in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T004 Configure Enemy entity with EF Core in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T005 Configure AttackAction entity with EF Core in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs
- [x] T006 [P] Add combat-related enums (CombatStatus, CombatSide, CombatantType, CombatantStatus, AIState) in src/DiceEngine.Domain/Entities/
- [x] T007 Register CombatService and related services in src/DiceEngine.API/Program.cs
- [x] T008 Apply database migration and verify schema in database

---

## Phase 2: Foundational Components

**Goal**: Build core domain entities and repositories needed by all user stories

**Duration**: 2-3 days

### Domain Entities

- [x] T009 [P] Create CombatStatus, CombatSide enums in src/DiceEngine.Domain/Entities/CombatEncounter.cs
- [x] T010 [P] Create CombatantType, CombatantStatus enums in src/DiceEngine.Domain/Entities/Combatant.cs
- [x] T011 [P] Create AIState enum in src/DiceEngine.Domain/Entities/Enemy.cs
- [x] T012 Create CombatEncounter entity (aggregate root) in src/DiceEngine.Domain/Entities/CombatEncounter.cs
- [x] T013 [P] Create Combatant entity in src/DiceEngine.Domain/Entities/Combatant.cs
- [x] T014 [P] Create Enemy entity (aggregate root) in src/DiceEngine.Domain/Entities/Enemy.cs
- [x] T015 [P] Create AttackAction record (value object) in src/DiceEngine.Domain/ValueObjects/AttackAction.cs
- [x] T016 [P] Create InitiativeEntry record (value object) in src/DiceEngine.Domain/ValueObjects/InitiativeEntry.cs
- [x] T017 [P] Create CombatOutcome value object in src/DiceEngine.Domain/ValueObjects/CombatOutcome.cs

### Repository Layer

- [x] T018 Create ICombatRepository interface in src/DiceEngine.Application/Services/ICombatRepository.cs
- [x] T019 [P] Create IEnemyRepository interface in src/DiceEngine.Application/Services/IEnemyRepository.cs
- [x] T020 Implement CombatRepository in src/DiceEngine.Infrastructure/Persistence/Repositories/CombatRepository.cs
- [x] T021 [P] Implement EnemyRepository in src/DiceEngine.Infrastructure/Persistence/Repositories/EnemyRepository.cs

### Application Models

- [x] T022 [P] Create Result<T> wrapper if not existing in src/DiceEngine.Application/Models/Result.cs
- [x] T023 [P] Create CombatException and related exceptions in src/DiceEngine.Application/Exceptions/CombatExceptions.cs

---

## Phase 3: User Story 1 + 4 - Basic Combat with Armor Class (P1 + P2)

**Goal**: Implement core combat loop between one player character and one enemy with attack/damage resolution and armor class mechanics

**Independent Test**: Initiate combat between 1 PC and 1 enemy, perform attacks, verify hit/miss based on AC, apply damage, observe combat end when health reaches 0

**Duration**: 5-7 days

### Unit Tests First (TDD)

- [x] T024 [P] [US1] Create CombatEncounterTests fixture in tests/DiceEngine.Application.Tests/Fixtures/CombatFixture.cs
- [x] T025 [P] [US1] Write test: CombatEncounter_Create_ValidInput_ReturnsSuccess in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T026 [P] [US1] Write test: CombatEncounter_Create_EmptyCombatants_ReturnsFailure in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T027 [P] [US1] Write test: Combatant_CreateFromCharacter_ValidInput_ReturnsSuccess in tests/DiceEngine.Application.Tests/CombatantTests.cs
- [x] T028 [P] [US1] Write test: Combatant_TakeDamage_ReducesHealth in tests/DiceEngine.Application.Tests/CombatantTests.cs
- [x] T029 [P] [US1] Write test: Combatant_TakeDamage_HealthReachesZero_MarksDefeated in tests/DiceEngine.Application.Tests/CombatantTests.cs
- [x] T030 [P] [US4] Write test: AttackResolver_AttackRoll_HitsWhenMeetsAC in tests/DiceEngine.Application.Tests/AttackResolverTests.cs
- [x] T031 [P] [US4] Write test: AttackResolver_AttackRoll_MissesWhenBelowAC in tests/DiceEngine.Application.Tests/AttackResolverTests.cs
- [x] T032 [P] [US4] Write test: AttackResolver_CriticalHit_Natural20_DoubleDamageDice in tests/DiceEngine.Application.Tests/AttackResolverTests.cs
- [x] T033 [P] [US4] Write test: DamageCalculator_CalculateDamage_UsesWeaponDice in tests/DiceEngine.Application.Tests/DamageCalculatorTests.cs

### Service Layer Implementation

- [x] T034 [US1] Implement InitiativeCalculator service in src/DiceEngine.Application/Services/InitiativeCalculator.cs
- [x] T035 [US4] Implement AttackResolver service in src/DiceEngine.Application/Services/AttackResolver.cs
- [x] T036 [US4] Implement DamageCalculator service in src/DiceEngine.Application/Services/DamageCalculator.cs
- [x] T037 [US1] Create ICombatService interface in src/DiceEngine.Application/Services/ICombatService.cs
- [x] T038 [US1] Implement CombatService.StartCombatAsync() method in src/DiceEngine.Application/Services/CombatService.cs
- [x] T039 [US1] Implement CombatService.ResolveAttackAsync() method in src/DiceEngine.Application/Services/CombatService.cs
- [x] T040 [US1] Implement CombatService.GetCombatStatusAsync() method in src/DiceEngine.Application/Services/CombatService.cs
- [x] T041 [US1] Implement CombatService.CheckCombatEnd() method in src/DiceEngine.Application/Services/CombatService.cs

### API Layer

- [x] T042 [P] [US1] Create InitiateCombatRequest DTO in src/DiceEngine.API/Models/InitiateCombatRequest.cs
- [x] T043 [P] [US1] Create CombatStateResponse DTO in src/DiceEngine.API/Models/CombatStateResponse.cs
- [x] T044 [P] [US1] Create ResolveTurnRequest DTO in src/DiceEngine.API/Models/ResolveTurnRequest.cs
- [x] T045 [P] [US1] Create AttackActionResponse DTO in src/DiceEngine.API/Models/AttackActionResponse.cs
- [x] T046 [US1] Create CombatController with POST /api/combats endpoint in src/DiceEngine.API/Controllers/CombatController.cs
- [x] T047 [US1] Implement GET /api/combats/{id} endpoint in src/DiceEngine.API/Controllers/CombatController.cs
- [x] T048 [US1] Implement POST /api/combats/{id}/turns endpoint in src/DiceEngine.API/Controllers/CombatController.cs

### Integration Tests

- [x] T049 [US1] Write integration test: InitiateCombat_ValidRequest_Returns201 in tests/DiceEngine.API.Tests/CombatControllerTests.cs
- [x] T050 [US1] Write integration test: ResolveTurn_PlayerAttacksEnemy_DamagesEnemy in tests/DiceEngine.API.Tests/CombatControllerTests.cs
- [x] T051 [US1] Write integration test: Combat_EnemyDefeated_EndsWithPlayerVictory in tests/DiceEngine.API.Tests/CombatControllerTests.cs
- [x] T052 [US4] Write integration test: Attack_BelowAC_Misses_NoDamage in tests/DiceEngine.API.Tests/CombatControllerTests.cs
- [x] T053 [US4] Write integration test: Attack_MeetsOrExceedsAC_Hits_DealsDamage in tests/DiceEngine.API.Tests/CombatControllerTests.cs

---

## Phase 4: User Story 2 - Multi-Combatant Initiative (P2)

**Goal**: Support multiple combatants with initiative-based turn ordering, tie resolution, and proper round progression

**Independent Test**: Initiate combat with 3+ combatants, verify initiative calculated correctly (d20 + DEX), confirm turn order maintained across rounds, validate tie-breaking by DEX then random

**Duration**: 3-4 days

### Unit Tests First (TDD)

- [x] T054 [P] [US2] Write test: InitiativeCalculator_CalculateForMultiple_SortsCorrectly in tests/DiceEngine.Application.Tests/InitiativeCalculatorTests.cs
- [x] T055 [P] [US2] Write test: InitiativeCalculator_TiedScores_ResolvesWithDexTiebreaker in tests/DiceEngine.Application.Tests/InitiativeCalculatorTests.cs
- [x] T056 [P] [US2] Write test: InitiativeCalculator_TiedDex_ResolvesRandomly in tests/DiceEngine.Application.Tests/InitiativeCalculatorTests.cs
- [x] T057 [P] [US2] Write test: CombatEncounter_AdvanceToNextTurn_MaintainsOrder in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T058 [P] [US2] Write test: CombatEncounter_EndOfRound_StartsNewRound in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T059 [P] [US2] Write test: CombatEncounter_DefeatedCombatant_SkippedInTurnOrder in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs

### Implementation

- [x] T060 [US2] Update InitiativeCalculator to handle multiple combatants in src/DiceEngine.Application/Services/InitiativeCalculator.cs
- [x] T061 [US2] Implement tie-breaking logic (DEX modifier, then GUID) in src/DiceEngine.Application/Services/InitiativeCalculator.cs
- [x] T062 [US2] Update CombatEncounter.AdvanceToNextTurn() to skip defeated combatants in src/DiceEngine.Domain/Entities/CombatEncounter.cs
- [x] T063 [US2] Implement round progression logic in src/DiceEngine.Domain/Entities/CombatEncounter.cs
- [x] T064 [US2] Update CombatService to support multi-combatant encounters in src/DiceEngine.Application/Services/CombatService.cs

### Integration Tests

- [x] T065 [US2] Write integration test: Combat_ThreeCombatants_CorrectInitiativeOrder in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T066 [US2] Write integration test: Combat_MultipleRounds_MaintainsOrder in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T067 [US2] Write integration test: Combat_DefeatedCombatant_SkippedInOrder in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T068 [US2] Write integration test: Combat_TiedInitiative_BreaksByDex in tests/DiceEngine.Application.Tests/InitiativeCalculatorTests.cs

---

## Phase 5: User Story 3 - Intelligent Enemy AI Behavior (P3)

**Goal**: Enemy combatants exhibit AI states (aggressive, defensive, flee) with automatic state transitions and action selection

**Independent Test**: Place enemies in scenarios with varying health levels, verify AI states transition correctly (>50% aggressive, 25-50% defensive, <25% flee), confirm action selection matches state

**Duration**: 4-5 days

### Enemy Entity & Repository

- [x] T069 [P] [US3] Create CreateEnemyRequest DTO in src/DiceEngine.API/Models/CreateEnemyRequest.cs
- [x] T070 [P] [US3] Create EnemyResponse DTO in src/DiceEngine.API/Models/EnemyResponse.cs
- [x] T071 [P] [US3] Create EnemyListResponse DTO in src/DiceEngine.API/Models/EnemyListResponse.cs
- [x] T072 Create EnemyController with POST /api/enemies endpoint in src/DiceEngine.API/Controllers/EnemyController.cs
- [x] T073 [P] Implement GET /api/enemies endpoint with pagination in src/DiceEngine.API/Controllers/EnemyController.cs
- [x] T074 [P] Implement GET /api/enemies/{id} endpoint in src/DiceEngine.API/Controllers/EnemyController.cs
- [x] T075 [P] Implement PUT /api/enemies/{id} endpoint in src/DiceEngine.API/Controllers/EnemyController.cs
- [x] T076 [P] Implement DELETE /api/enemies/{id} endpoint in src/DiceEngine.API/Controllers/EnemyController.cs

### Unit Tests First (TDD)

- [x] T077 [P] [US3] Write test: Enemy_Create_ValidInput_ReturnsSuccess in tests/DiceEngine.Application.Tests/EnemyTests.cs
- [x] T078 [P] [US3] Write test: Enemy_EvaluateAIState_HighHealth_Aggressive in tests/DiceEngine.Application.Tests/EnemyTests.cs
- [x] T079 [P] [US3] Write test: Enemy_EvaluateAIState_MidHealth_Defensive in tests/DiceEngine.Application.Tests/EnemyTests.cs
- [x] T080 [P] [US3] Write test: Enemy_EvaluateAIState_LowHealth_Flee in tests/DiceEngine.Application.Tests/EnemyTests.cs
- [x] T081 [P] [US3] Write test: AIStateMachine_AggressiveState_SelectsHighestThreat in tests/DiceEngine.Application.Tests/AIStateMachineTests.cs
- [x] T082 [P] [US3] Write test: AIStateMachine_DefensiveState_SelectsCautiousTarget in tests/DiceEngine.Application.Tests/AIStateMachineTests.cs
- [x] T083 [P] [US3] Write test: AIStateMachine_FleeState_AttemptsToFlee in tests/DiceEngine.Application.Tests/AIStateMachineTests.cs

### AI Implementation

- [x] T084 [US3] Implement Enemy.EvaluateAIState() method with health thresholds in src/DiceEngine.Domain/Entities/Enemy.cs
- [x] T085 [US3] Create IAIStateMachine interface in src/DiceEngine.Application/Services/IAIStateMachine.cs
- [x] T086 [US3] Implement AIStateMachine.SelectAction() method in src/DiceEngine.Application/Services/AIStateMachine.cs
- [x] T087 [US3] Implement AggressiveState action selection (target highest threat) in src/DiceEngine.Application/Services/AIStateMachine.cs
- [x] T088 [US3] Implement DefensiveState action selection (cautious targeting) in src/DiceEngine.Application/Services/AIStateMachine.cs
- [x] T089 [US3] Implement FleeState action selection (attempt escape) in src/DiceEngine.Application/Services/AIStateMachine.cs
- [x] T090 [US3] Implement CombatService.ResolveEnemyTurnAsync() method in src/DiceEngine.Application/Services/CombatService.cs
- [x] T091 [US3] Add POST /api/combats/{id}/enemy-turn endpoint in src/DiceEngine.API/Controllers/CombatController.cs

### Integration Tests

- [x] T092 [US3] Write integration test: CreateEnemy_ValidRequest_Returns201 in tests/DiceEngine.Application.Tests/EnemyTests.cs
- [x] T093 [US3] Write integration test: EnemyTurn_AggressiveState_AttacksPlayer in tests/DiceEngine.Application.Tests/AIStateMachineTests.cs
- [x] T094 [US3] Write integration test: EnemyTurn_HealthDrops_TransitionsToDefensive in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T095 [US3] Write integration test: EnemyTurn_LowHealth_AttemptsFlee in tests/DiceEngine.Application.Tests/EnemyTests.cs
- [x] T096 [US3] Write integration test: EnemyFlees_RemovedFromCombat in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Combat history, error handling, edge cases, performance optimization

**Duration**: 2-3 days

### Combat History & Queries

- [x] T097 [P] Create CombatHistoryResponse DTO in src/DiceEngine.API/Models/CombatHistoryResponse.cs
- [x] T098 Implement GET /api/combats/{id}/actions endpoint in src/DiceEngine.API/Controllers/CombatController.cs
- [x] T099 Add pagination support to combat history queries in src/DiceEngine.Application/Services/CombatService.cs

### Error Handling & Validation

- [x] T100 [P] Implement NotYourTurnException with 409 status in src/DiceEngine.Application/Exceptions/CombatExceptions.cs
- [x] T101 [P] Implement InvalidTargetException with 422 status in src/DiceEngine.Application/Exceptions/CombatExceptions.cs
- [x] T102 [P] Implement CombatEndedException with 409 status in src/DiceEngine.Application/Exceptions/CombatExceptions.cs
- [x] T103 Add global exception handler for combat exceptions in tests/DiceEngine.Application.Tests/CombatValidationTests.cs
- [x] T104 Add validation: cannot act when not your turn in tests/DiceEngine.Application.Tests/CombatValidationTests.cs
- [x] T105 Add validation: cannot target defeated combatants in tests/DiceEngine.Application.Tests/CombatValidationTests.cs
- [x] T106 Add validation: cannot act on completed combat in tests/DiceEngine.Application.Tests/CombatValidationTests.cs

### Edge Case Tests

- [x] T107 [P] Write edge case test: Combat_AllPlayersDefeated_EnemyVictory in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T108 [P] Write edge case test: Combat_SimultaneousDefeat_DeclaresDraw in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T109 [P] Write edge case test: Combat_InvalidAction_ReturnsError in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T110 [P] Write edge case test: Combat_ZeroEnemies_ReturnsValidationError in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs
- [x] T111 [P] Write edge case test: Combat_AttackDefeatedTarget_ReturnsError in tests/DiceEngine.Application.Tests/CombatEncounterTests.cs

### Performance Optimization

- [x] T112 Add database indexes for combat queries in src/DiceEngine.Infrastructure/Migrations/
- [x] T113 Implement eager loading for combat aggregates in src/DiceEngine.Infrastructure/Persistence/Repositories/CombatRepository.cs
- [x] T114 Add performance logging to critical paths (initiative, attack resolution) in src/DiceEngine.Application/Services/
- [x] T115 Run performance tests: verify <100ms for combat operations in tests/DiceEngine.Application.Tests/PerformanceTests.cs

---

## Dependencies Between User Stories

```
┌─────────────────────┐
│  Setup (Phase 1)    │
│  Database, Config   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Foundational        │
│ (Phase 2)           │
│ Entities, Repos     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  US1 + US4 (Phase 3)                │
│  Basic Combat + Armor Class         │
│  ✓ Prerequisites: Foundational      │
└──────────┬──────────────────────────┘
           │
           ├──────────────────────────────────┐
           │                                  │
           ↓                                  ↓
┌──────────────────────┐        ┌──────────────────────┐
│  US2 (Phase 4)       │        │  US3 (Phase 5)       │
│  Multi-Combatant     │        │  AI Behavior         │
│  Initiative          │        │  ✓ Prerequisites:    │
│  ✓ Prerequisites:    │        │    US1 + US4         │
│    US1 + US4         │        └──────────────────────┘
└──────────────────────┘
           │
           │
           └──────────────────────────────────┐
                                              │
                                              ↓
                                    ┌──────────────────────┐
                                    │  Polish (Phase 6)    │
                                    │  History, Edge Cases │
                                    │  ✓ Prerequisites:    │
                                    │    All US complete   │
                                    └──────────────────────┘
```

---

## Parallel Execution Opportunities

### Within Phase 3 (US1 + US4):

- **Parallel Track A**: Tests (T024-T033)
- **Parallel Track B**: Service implementations (T034-T036)
- **Parallel Track C**: DTOs (T042-T045)
- **Sequential**: Controller implementation (T046-T048) requires services
- **Sequential**: Integration tests (T049-T053) require controllers

### Within Phase 4 (US2):

- **Parallel**: All unit tests (T054-T059)
- **Sequential**: Implementation tasks (T060-T064) depend on test definitions
- **Parallel**: Integration tests (T065-T068) can run simultaneously

### Within Phase 5 (US3):

- **Parallel Track A**: DTOs (T069-T071)
- **Parallel Track B**: Controller endpoints (T072-T076)
- **Parallel Track C**: Unit tests (T077-T083)
- **Sequential**: AI implementation (T084-T091) requires tests
- **Parallel**: Integration tests (T092-T096)

### Within Phase 6 (Polish):

- **Parallel**: DTOs, exception classes, edge case tests (T097, T100-T103, T107-T111)
- **Sequential**: Error handling integration (T103-T106) requires exceptions
- **Parallel**: Performance tasks (T112-T115)

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Deliver with Phase 3 complete:**

- Basic combat between 1 player and 1 enemy
- Attack roll vs armor class
- Damage calculation with weapon dice
- Combat ends when one side defeated
- **Estimated: 2 weeks**

### Incremental Expansion

1. **Phase 3 → Phase 4**: Add multi-combatant support (+1 week)
2. **Phase 4 → Phase 5**: Add AI behavior (+1 week)
3. **Phase 5 → Phase 6**: Polish and edge cases (+3 days)

### Total Estimated Timeline

- **Full feature**: 4-5 weeks
- **MVP delivery**: 2 weeks
- **Parallelizable work**: ~40% of tasks can run in parallel

---

## Test Coverage Goals

| Component            | Target Coverage | Critical Tests                             |
| -------------------- | --------------- | ------------------------------------------ |
| CombatService        | >95%            | StartCombat, ResolveAttack, CheckCombatEnd |
| InitiativeCalculator | 100%            | Calculate, Sort, Tiebreak                  |
| AttackResolver       | 100%            | Hit/Miss, Critical Hit, Damage             |
| AIStateMachine       | >90%            | State transitions, Action selection        |
| Entities             | >90%            | Domain logic, Validation                   |
| Controllers          | >85%            | Happy path + error cases                   |

**Total Tests**: ~90 unit tests + ~25 integration tests = 115 tests

---

## Success Validation

After completing all tasks, verify:

- ✅ All 115 tests passing
- ✅ Combat encounter completes in <2 minutes (SC-001)
- ✅ Initiative correct for 20 combatants (SC-002)
- ✅ Attack resolution <100ms (SC-003)
- ✅ Damage calculations use DiceService 100% (SC-004)
- ✅ AI state transitions at 25% threshold (SC-005)
- ✅ Turn order maintained with no skips/duplicates (SC-006)
- ✅ All edge cases handled without crashes (SC-008)
- ✅ OpenAPI spec matches implementation
- ✅ Quickstart examples executable

---

## Next Actions

1. **Begin Phase 1**: Run task T001 (create database migration)
2. **TDD Cycle**: For each phase, write tests first (marked with test task IDs)
3. **Incremental Commits**: Commit after each completed phase
4. **Integration Validation**: After Phase 3, validate MVP with quickstart examples
5. **Code Review**: Review constitution compliance after Phase 3 and Phase 5

**Ready to start implementation!** 🚀
