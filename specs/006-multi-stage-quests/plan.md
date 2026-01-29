# Implementation Plan: Multi-Stage Quest System

**Branch**: `006-multi-stage-quests` | **Date**: January 29, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-multi-stage-quests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a multi-stage quest system that allows players to accept quests with sequential stages, track progress per stage with success/failure conditions, manage quest dependencies, persist quest state, and receive rewards upon completion. Integrate with existing inventory system and character management while maintaining RESTful API design principles.

## Technical Context

**Language/Version**: C# / .NET 10.0  
**Primary Dependencies**: ASP.NET Core 10.0, Entity Framework Core 10.0.2, Npgsql 10.0.0, Swashbuckle 7.2.0  
**Storage**: PostgreSQL (new tables: quests, quest_stages, quest_objectives, quest_progress, quest_rewards, quest_dependencies)  
**Testing**: xUnit (existing test projects: DiceEngine.API.Tests, DiceEngine.Application.Tests)  
**Target Platform**: Linux container (Docker), RESTful API service  
**Project Type**: Web API (existing clean architecture: Domain, Application, Infrastructure, API layers)  
**Performance Goals**: <200ms p95 for all quest endpoints including dependency checks and progress calculations  
**Constraints**: <200ms API responses, stateless communication, support concurrent active quests without degradation  
**Scale/Scope**: Support 50+ quests, 10+ concurrent active quests per player, complex prerequisite chains (DAG), state persistence

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. RESTful Design ✅

| Requirement              | Status  | Evidence                                                                       |
| ------------------------ | ------- | ------------------------------------------------------------------------------ |
| Noun-based resources     | ✅ PASS | `/adventures/{id}/quests`, `/quests/{id}/progress`, `/quests/{id}/stages`      |
| Semantic HTTP methods    | ✅ PASS | POST (accept quest), GET (view progress), PUT (update stage), DELETE (abandon) |
| Hierarchical URIs        | ✅ PASS | Quest progress nested under quest, stages nested under quest                   |
| Stateless communication  | ✅ PASS | No session state, all context in request/response                              |
| Appropriate status codes | ✅ PASS | 200 OK, 201 Created, 400 Bad Request, 409 Conflict (dependency check failed)   |

**Verdict**: PASS - All endpoints follow REST conventions

### II. Documentation Clarity ✅

| Requirement               | Status  | Evidence                                                          |
| ------------------------- | ------- | ----------------------------------------------------------------- |
| OpenAPI 3.0.1 spec        | ✅ PASS | Generated in Phase 1: `/contracts/openapi.yaml`                   |
| Complete schemas          | ✅ PASS | All request/response bodies defined with types and constraints    |
| All parameters documented | ✅ PASS | Path (questId, stageId), query (filters), body documented         |
| Status codes documented   | ✅ PASS | Success (200, 201, 204) and errors (400, 404, 409, 422)           |
| Examples provided         | ✅ PASS | Sample requests for accept quest, update progress, complete stage |

**Verdict**: PASS - Full OpenAPI documentation to be generated in Phase 1

### III. Testability ✅

| Requirement                   | Status  | Evidence                                                             |
| ----------------------------- | ------- | -------------------------------------------------------------------- |
| Unit tests for business logic | ✅ PASS | QuestService, StageProgressService, DependencyResolver tests planned |
| Critical paths covered        | ✅ PASS | Quest acceptance, stage transitions, success/failure evaluation >90% |
| Isolated, repeatable tests    | ✅ PASS | Mock EF DbContext, in-memory test data for quest chains              |
| Fast execution                | ✅ PASS | <100ms per unit test (no database I/O in unit tests)                 |
| Clear test naming             | ✅ PASS | `AcceptQuest_PrerequisiteNotMet_ReturnsForbidden()` pattern          |
| Tests block deployment        | ✅ PASS | CI/CD pipeline enforces test pass before merge                       |

**Verdict**: PASS - Comprehensive test coverage planned for quest operations

### IV. Simplicity ✅

| Requirement                 | Status  | Evidence                                                                   |
| --------------------------- | ------- | -------------------------------------------------------------------------- |
| YAGNI applied               | ✅ PASS | No quest branching, repeatable quests, or dynamic objectives (not in spec) |
| Avoid premature abstraction | ✅ PASS | Direct EF Core, no repository pattern (follows existing code)              |
| Proven technologies         | ✅ PASS | EF Core, PostgreSQL, existing stack (no new frameworks)                    |
| Self-documenting code       | ✅ PASS | Clear entity names (Quest, QuestStage, QuestProgress), expressive methods  |
| Minimal configuration       | ✅ PASS | Reuse existing DbContext, connection strings                               |
| Justified dependencies      | ✅ PASS | No new NuGet packages (leverage existing EF Core)                          |

**Verdict**: PASS - Design follows existing patterns, no unnecessary complexity

### V. Performance ✅

| Requirement                   | Status  | Evidence                                                                      |
| ----------------------------- | ------- | ----------------------------------------------------------------------------- |
| <200ms response time          | ✅ PASS | Target: accept quest <50ms, progress check <30ms, dependency validation <20ms |
| Optimized queries             | ✅ PASS | Indexes on adventure_id, quest_id, FK constraints                             |
| N+1 elimination               | ✅ PASS | `.Include()` for stages, objectives, dependencies in single query             |
| Appropriate pagination        | ✅ PASS | Quest list queries paginated (limit 50 default)                               |
| Caching deterministic results | ✅ PASS | Quest definitions and dependency DAG cached in memory after first load        |
| Performance testing           | ✅ PASS | Integration tests measure endpoint latency, fail >200ms                       |

**Verdict**: PASS - Design meets <200ms requirement with caching and indexing

---

### Constitution Compliance Summary

| Principle         | Status  | Notes                                                             |
| ----------------- | ------- | ----------------------------------------------------------------- |
| I. RESTful Design | ✅ PASS | Standard REST patterns, noun-based resources, proper status codes |
| II. Documentation | ✅ PASS | OpenAPI contracts in Phase 1                                      |
| III. Testability  | ✅ PASS | Unit tests for all quest logic                                    |
| IV. Simplicity    | ✅ PASS | No over-engineering, reuses existing architecture                 |
| V. Performance    | ✅ PASS | <200ms achievable with caching and indexing                       |

**All gates PASS. Proceeding to Phase 0 research and Phase 1 design.**

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Clean Architecture - .NET 10.0
src/
├── DiceEngine.Domain/              # Domain entities and value objects
│   ├── Entities/
│   │   ├── Quest.cs                # Quest aggregate root
│   │   ├── QuestStage.cs           # Stage entity
│   │   ├── QuestObjective.cs       # Objective entity
│   │   ├── QuestProgress.cs        # Progress tracking entity
│   │   ├── QuestReward.cs          # Reward definition entity
│   │   └── QuestDependency.cs      # Dependency relationship entity
│   └── ValueObjects/
│       ├── StageNumber.cs
│       ├── QuestStatus.cs
│       └── ObjectiveProgress.cs
│
├── DiceEngine.Application/          # Application services and DTOs
│   ├── Services/
│   │   ├── QuestService.cs         # Accept, abandon, view quests
│   │   ├── StageProgressService.cs # Update stage progress
│   │   ├── DependencyResolver.cs   # Validate prerequisites
│   │   └── RewardService.cs        # Grant rewards on completion
│   └── Models/
│       ├── QuestDto.cs
│       ├── StageProgressDto.cs
│       └── QuestProgressDto.cs
│
├── DiceEngine.Infrastructure/       # Database persistence
│   ├── Migrations/
│   │   └── 20260129_AddQuestSystem.cs
│   └── Persistence/
│       └── QuestRepository.cs       # EF Core queries (if needed)
│
└── DiceEngine.API/                  # HTTP endpoints
    └── Controllers/
        ├── QuestsController.cs      # GET /quests, POST /quests/{id}/accept
        ├── StagesController.cs      # PUT /quests/{id}/stages/{stageId}
        └── ProgressController.cs    # GET /quests/{id}/progress

tests/
├── DiceEngine.Domain.Tests/
│   ├── Entities/
│   │   └── QuestTests.cs
│   └── ValueObjects/
│
├── DiceEngine.Application.Tests/
│   ├── Services/
│   │   ├── QuestServiceTests.cs
│   │   ├── StageProgressServiceTests.cs
│   │   └── DependencyResolverTests.cs
│   └── Models/
│
└── DiceEngine.API.Tests/
    ├── QuestsControllerTests.cs
    ├── StagesControllerTests.cs
    └── ProgressControllerTests.cs
```

**Structure Decision**: Using existing clean architecture pattern (Domain, Application, Infrastructure, API). Quest entities in Domain, services in Application, EF Core persistence in Infrastructure, HTTP endpoints in API. Follows established patterns from inventory system and dice engine features.

## Complexity Tracking

**No constitution violations. All design decisions comply with the five core principles.**

No complexity trade-offs required. The quest system naturally fits within existing architecture patterns established by inventory and dice engine features.
