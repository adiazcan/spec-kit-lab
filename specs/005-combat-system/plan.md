# Implementation Plan: Turn-Based Combat System

**Branch**: `005-combat-system` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-combat-system/spec.md`

**Status**: Phase 1 Complete (Research, Design, API Contracts) ✅

## Summary

Implement a turn-based combat system for the Text Adventure Game REST API. Build NPC/Enemy entities with AI state machines (aggressive, defensive, flee), implement initiative system using the existing Dice Engine, create a combat resolver handling attack rolls and damage calculations, and develop comprehensive unit tests covering all combat scenarios.

## Technical Context

**Language/Version**: C# with ASP.NET Core 10  
**Primary Dependencies**: ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL, existing DiceService  
**Storage**: PostgreSQL database with Entity Framework Core ORM  
**Testing**: xUnit for unit testing  
**Target Platform**: Web API service (Linux/Windows server)  
**Project Type**: Web API backend (expanding existing DiceEngine project)  
**Architecture**: Clean Architecture pattern with layered organization (API → Application → Domain → Infrastructure)  
**Performance Goals**: All combat operations <100ms response time (within constitution 200ms threshold for API)  
**Constraints**: Initiative calculations, attack rolls, and damage calculations <50ms; combat turn resolution <100ms  
**Scale/Scope**: Support multi-combatant encounters (3-20 combatants) with complex AI state transitions

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Evaluation (Pre-Phase 0) ✅

All five principles evaluated and approved before research phase.

---

### Post-Design Evaluation (After Phase 1) ✅

**Re-evaluation Date**: 2026-01-29  
**Phase 1 Deliverables Reviewed**: data-model.md, contracts/openapi.yaml, quickstart.md

### I. RESTful Design ✅ CONFIRMED

**Implemented Design:**

- Combat encounter as resource: POST `/api/combats` to initiate, GET `/api/combats/{id}` for status
- Turn resolution as action: POST `/api/combats/{id}/turns` with combatant action
- Enemy management: Standard CRUD endpoints `/api/enemies` with GET/POST/PUT/DELETE
- Combat state retrieved as REST resource representation (no WebSocket/polling required for MVP)
- All endpoints use standard HTTP methods and status codes (200, 201, 409, 422, 404)
- Combat aggregate root owns combatant states and initiative order
- HATEOAS principle followed with resource IDs in responses

**Verification**: OpenAPI spec reviewed - all endpoints follow REST conventions strictly.

### II. Documentation Clarity ✅ CONFIRMED

**Implemented Design:**

- ✅ Full OpenAPI 3.0.1 spec created in `/contracts/openapi.yaml` (1013 lines)
- ✅ All request/response schemas documented with data types and constraints
- ✅ Combat endpoints documented with request/response examples
- ✅ Initiative calculation, attack resolution, and damage calculation flows documented
- ✅ Error codes fully specified (409 Conflict for invalid turn actions, 422 Unprocessable Entity for rule violations, 404 Not Found)
- ✅ Quickstart guide created with curl examples and complete workflows
- ✅ All parameters documented with examples and validation rules

**Verification**: OpenAPI spec complete with 7 endpoints, 20+ schemas, comprehensive error handling.

### III. Testability ✅ CONFIRMED

**Implemented Design:**

- xUnit tests with >90% coverage target for CombatService, InitiativeCalculator, CombatResolver
- Unit tests planned for: initiative calculation, attack roll resolution, damage calculation, AI state transitions
- Edge cases identified: tied initiative, simultaneous defeats, invalid actions, zero combatants, fled combatants
- All tests isolated and fast (<100ms each) with mocked DiceService for deterministic validation
- Tests can fully validate combat mechanics without external dependencies
- Clear entity boundaries enable isolated testing (CombatEncounter, Combatant, Enemy, AttackAction all independently testable)
- Value objects (InitiativeEntry, AttackAction) are immutable records - inherently testable

**Verification**: Data model designed with testability - clear separation of concerns, dependency injection patterns, mockable services.

### IV. Simplicity ✅ CONFIRMED

**Implemented Design:**

- Combat system builds on existing DiceService (no new RNG implementation)
- Clear separation: InitiativeCalculator (order), CombatResolver (attack/damage), AIStateMachine (decisions)
- No event sourcing or complex aggregates; straightforward state machine for AI (3 states: Aggressive, Defensive, Flee)
- Standard ASP.NET Core patterns: dependency injection, services, repositories
- Combat state stored as mutable aggregate (not immutable snapshots)
- Entity relationships straightforward: CombatEncounter → Combatants → Character/Enemy
- Only 4 core entities: CombatEncounter, Combatant, Enemy, AttackAction
- AI state transitions simple: health percentage thresholds (>50% aggressive, 25-50% defensive, <25% flee)
- No premature abstraction - weapon data stored as simple strings, parsed by existing DiceService

**Verification**: Data model review shows clear, straightforward design with minimal abstractions.

### V. Performance ✅ CONFIRMED

**Implemented Design:**

- Performance target: <100ms for turn resolution operations (well below 200ms constitution threshold)
- Initiative calculations using existing dice engine (<50ms for 20 combatants)
- Attack roll and damage calculation in-process (no I/O)
- Combat state cached in memory during encounter; saved to database at turn resolution
- No N+1 query issues (single combat aggregate with embedded combatants loaded eagerly)
- Optimistic locking prevents concurrent update conflicts (Version field on CombatEncounter)
- Database indexes planned: CombatEncounterId, Status, InitiativeScore for efficient queries
- LinkedList data structure considered for O(1) removal of defeated combatants (research findings)

**Verification**: Design review confirms all operations are in-memory calculations with minimal database I/O per turn.

---

### Post-Design Gate Result: ✅ PASS - All Five Principles Confirmed

**Summary:**

- All five constitution principles satisfied in final design
- No architectural drift from initial evaluation
- OpenAPI spec, data model, and quickstart guide all align with constitution
- No complexity justifications needed
- Design ready for Phase 2 (task breakdown and implementation)

**Approved for Implementation**: 2026-01-29

## Project Structure

### Documentation (this feature)

```text
specs/005-combat-system/
├── spec.md              # Feature specification (✅ DONE)
├── plan.md              # This file (✅ DONE - Phase 1 Complete)
├── research.md          # Phase 0 output (✅ DONE)
├── data-model.md        # Phase 1 output (✅ DONE)
├── quickstart.md        # Phase 1 output (✅ DONE)
├── contracts/           # Phase 1 output (✅ DONE)
│   └── openapi.yaml
└── checklists/
    └── requirements.md  # (✅ EXISTS)
```

### Source Code (repository root)

```text
# Expanding existing Clean Architecture project with combat domain

src/
├── DiceEngine.API/
│   ├── Program.cs
│   ├── appsettings.json
│   └── Controllers/
│       ├── RollController.cs
│       ├── AdventuresController.cs
│       ├── CharactersController.cs
│       ├── InventoryController.cs
│       └── CombatController.cs              # NEW: Combat endpoints
├── DiceEngine.Application/
│   ├── Services/
│   │   ├── DiceService.cs
│   │   ├── DiceExpressionParser.cs
│   │   ├── DiceRoller.cs
│   │   ├── AdventureService.cs
│   │   ├── CharacterService.cs
│   │   ├── InventoryService.cs
│   │   ├── CombatService.cs                 # NEW: Combat orchestration
│   │   ├── InitiativeCalculator.cs          # NEW: Initiative order
│   │   ├── CombatResolver.cs                # NEW: Attack/damage resolution
│   │   └── AIStateMachine.cs                # NEW: Enemy behavior
│   └── Models/
│       ├── DiceExpression.cs
│       ├── RollResult.cs
│       ├── Character.cs
│       ├── Inventory.cs
│       ├── CombatEncounter.cs               # NEW: Combat state
│       ├── Combatant.cs                     # NEW: Combat participant
│       ├── Enemy.cs                         # NEW: NPC/Enemy entity
│       ├── AIState.cs                       # NEW: AI state enum
│       └── AttackAction.cs                  # NEW: Attack result
├── DiceEngine.Domain/
│   ├── Entities/
│   │   ├── Adventure.cs
│   │   ├── Character.cs
│   │   ├── Inventory.cs
│   │   ├── Enemy.cs                         # NEW: Enemy aggregate
│   │   └── CombatEncounter.cs               # NEW: Combat aggregate
│   └── ValueObjects/
│       ├── CharacterAttribute.cs
│       ├── InitiativeEntry.cs               # NEW: Initiative result
│       └── AttackResult.cs                  # NEW: Attack calculation
└── DiceEngine.Infrastructure/
    ├── Persistence/
    │   ├── DiceEngineDbContext.cs
    │   ├── Repositories/
    │   │   ├── AdventureRepository.cs
    │   │   ├── CharacterRepository.cs
    │   │   ├── InventoryRepository.cs
    │   │   ├── EnemyRepository.cs            # NEW: Enemy persistence
    │   │   └── CombatRepository.cs           # NEW: Combat persistence
    │   └── Migrations/
    │       └── [migrations for enemies and combat tables]
    └── Persistence.seed/
        └── [seed data for enemy templates]

tests/
├── DiceEngine.Application.Tests/
│   ├── DiceServiceTests.cs
│   ├── DiceExpressionParserTests.cs
│   ├── AdventureServiceTests.cs
│   ├── CharacterServiceTests.cs
│   ├── InventoryServiceTests.cs
│   ├── CombatServiceTests.cs                # NEW: Combat service tests
│   ├── InitiativeCalculatorTests.cs         # NEW: Initiative tests
│   ├── CombatResolverTests.cs               # NEW: Combat resolution tests
│   ├── AIStateMachineTests.cs               # NEW: AI behavior tests
│   ├── Fixtures/
│   │   ├── DiceRollerFixture.cs
│   │   └── CombatFixture.cs                 # NEW: Combat test data
│   └── Helpers/
│       └── [test helpers]
└── DiceEngine.API.Tests/
    ├── RollControllerTests.cs
    ├── AdventuresControllerTests.cs
    ├── CharactersControllerTests.cs
    ├── InventoryControllerTests.cs
    ├── CombatControllerTests.cs              # NEW: Combat controller tests
    └── [integration tests]
```

**Structure Decision**: Expanding the existing Clean Architecture project with new combat domain. Combat system follows the same layered pattern (API → Application → Domain → Infrastructure) already established in the project. This maintains consistency while clearly separating combat concerns (services, models, repositories) from character management and dice engine systems.

## Complexity Tracking

No complexity justifications needed - design adheres to all constitution principles.
