# Implementation Plan: Character Management System

**Branch**: `003-character-management` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-character-management/spec.md`

**Status**: ✅ Phase 0-1 Complete (Planning, Research, Design)

## Summary

Build a character management system extending the DiceEngine backend with Character entity linked to Adventure, attribute system with automatic modifier calculation, and snapshot/versioning for character history. Users can create characters with D&D-style attributes (STR, DEX, INT, CON, CHA), retrieve/update character data with automatic modifier recalculation, save character snapshots for game saves, and delete characters. Store characters in PostgreSQL with RESTful API endpoints.

## Technical Context

**Language/Version**: C# with ASP.NET Core 10  
**Primary Dependencies**: ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL, Swashbuckle  
**Storage**: PostgreSQL database with Entity Framework Core ORM (extending existing schema)  
**Testing**: xUnit for unit testing  
**Target Platform**: Web API service (Linux/Windows server)  
**Project Type**: Web API backend (extending existing DiceEngine.API and Adventure features)  
**Architecture**: Clean Architecture with DDD principles; extends DiceEngine layers (Domain, Application, Infrastructure)  
**Performance Goals**: All API endpoints <200ms response time (per constitution)  
**Constraints**: <200ms per character operation, support character versions/snapshots, automatic modifier calculation with no floating-point precision errors  
**Scale/Scope**: MVP character management supporting CRUD, attributes, modifiers, snapshots, linked to adventures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. RESTful Design ✅

- Character resource-based API: POST `/api/adventures/{adventureId}/characters` (create), GET `/api/adventures/{adventureId}/characters` (list), GET `/api/adventures/{adventureId}/characters/{id}` (retrieve), PUT `/api/adventures/{adventureId}/characters/{id}` (update), DELETE `/api/adventures/{adventureId}/characters/{id}` (delete)
- Snapshots as sub-resource: GET `/api/characters/{id}/snapshots`, POST `/api/characters/{id}/snapshots` (create snapshot)
- Stateless HTTP operations with appropriate HTTP methods and status codes
- No RPC-style endpoints; resources managed via HTTP verbs

### II. Documentation Clarity ✅

- Full OpenAPI 3.0.1 spec in `/contracts/openapi.yaml` documenting all character CRUD endpoints
- Request/response schemas with Character, CharacterAttribute, CharacterSnapshot entities
- Error responses with proper HTTP status codes and descriptive messages (400 for validation, 404 for not-found, 409 for conflicts)
- Example payloads for create, retrieve, update, delete, snapshot operations
- Pagination for list endpoint (optional query params: page, limit)

### III. Testability ✅

- Unit tests for CharacterService (create, retrieve, update, delete, list, snapshot operations)
- Unit tests for modifier calculation (attribute conversion from base value to modifier)
- Repository tests for data access layer (EF Core character and snapshot persistence)
- Controller tests for HTTP contract validation
- Fast tests (<100ms each) with in-memory database or mocked repository
- Target >90% code coverage for Character entity, service logic, and modifier calculations

### IV. Simplicity ✅

- Single CharacterService with clear CRUD responsibility plus snapshot management
- Character entity with core fields: ID, Name, five Attributes (STR/DEX/INT/CON/CHA), AdventureId
- Attribute as value object with base value and calculated modifier (immutable computation)
- Snapshots stored as denormalized copies (timestamp + all attribute state) for simplicity
- Standard EF Core patterns and Clean Architecture layers (no event sourcing, no complex state machines)
- Modifier calculation is pure function: (base - 10) / 2 rounded down (floor division)

### V. Performance ✅

- Database queries optimized with primary key lookups (O(1) for individual character retrieval)
- Pagination required for list endpoint (prevents loading 10k+ character records at once)
- Modifier calculation is in-process, not database-computed (simple arithmetic)
- Connection pooling via EF Core to PostgreSQL
- No N+1 issues (single SELECT per operation; snapshots batched if retrieved together)
- Target <200ms for all operations; character management simpler than dice engine (primarily CRUD)

**Gate Result: PASS** - All five core principles satisfied. No complexity justifications needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-character-management/
├── plan.md              # This file (✅ COMPLETE)
├── research.md          # Phase 0 output (✅ COMPLETE)
├── data-model.md        # Phase 1 output (✅ COMPLETE)
├── quickstart.md        # Phase 1 output (✅ COMPLETE)
├── contracts/           # Phase 1 output (✅ COMPLETE)
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── spec.md              # Feature specification (✅ DONE)
```

### Source Code (repository root)

```text
# Extended ASP.NET Core backend (continuing DiceEngine structure)
src/
├── DiceEngine.API/
│   ├── Program.cs (updated with Character controller registration)
│   ├── appsettings.json
│   └── Controllers/
│       ├── RollController.cs (existing)
│       ├── AdventuresController.cs (existing)
│       └── CharactersController.cs (NEW)
├── DiceEngine.Application/
│   ├── Services/
│   │   ├── DiceService.cs (existing)
│   │   ├── AdventureService.cs (existing)
│   │   └── CharacterService.cs (NEW)
│   └── Models/
│       ├── Character.cs (NEW)
│       ├── CharacterAttribute.cs (NEW)
│       ├── CharacterSnapshot.cs (NEW)
│       ├── CreateCharacterRequest.cs (NEW)
│       └── UpdateCharacterRequest.cs (NEW)
├── DiceEngine.Domain/
│   ├── Entities/
│   │   └── Character.cs (NEW aggregate root)
│   └── ValueObjects/
│       └── CharacterAttribute.cs (NEW value object)
└── DiceEngine.Infrastructure/
    ├── Persistence/
    │   ├── DiceEngineDbContext.cs (updated with DbSet<Character> and DbSet<CharacterSnapshot>)
    │   └── Repositories/
    │       └── CharacterRepository.cs (NEW)

tests/
├── DiceEngine.Application.Tests/
│   ├── DiceServiceTests.cs (existing)
│   ├── AdventureServiceTests.cs (existing)
│   └── CharacterServiceTests.cs (NEW)
├── DiceEngine.API.Tests/
│   ├── RollControllerTests.cs (existing)
│   ├── AdventuresControllerTests.cs (existing)
│   └── CharactersControllerTests.cs (NEW)
```

**Structure Decision**: Extend existing Clean Architecture by adding Character domain entity, application service, API controller, and repository. Leverage existing EF Core setup and PostgreSQL connection. Character is linked to Adventure via AdventureId foreign key. Snapshots are stored as denormalized copies with full attribute state for simplicity and query performance.

## Phase 0-1 Completion Status

✅ **Research Phase**: [research.md](./research.md) complete with all technical findings:
- Modifier calculation formula (Math.Floor for floor division)
- Snapshot/versioning strategy (denormalized immutable copies)
- Concurrency handling (optimistic locking with version stamps)
- Entity Framework Core patterns
- Validation strategy (multi-layer approach)
- Performance considerations and indexing

✅ **Design Phase**: 
- [data-model.md](./data-model.md) complete with entity definitions, relationships, constraints, state machines
- [contracts/openapi.yaml](./contracts/openapi.yaml) complete with all CRUD endpoints and snapshots
- [quickstart.md](./quickstart.md) complete with implementation sequence, examples, and testing guide

✅ **Constitution Re-Check Post-Design**: PASS - All five principles validated

### Re-evaluated Constitution Check (Post-Design)

#### I. RESTful Design ✅ (CONFIRMED)

- **Resource-based API confirmed**: 10 endpoints (5 character CRUD + 3 snapshot operations + 2 batch)
- **Noun-based resources verified**: `/characters`, `/snapshots` vs verbs
- **HTTP semantics correct**: POST (create), GET (read), PUT (update), DELETE (remove)
- **Proper status codes**: 201 Created, 200 OK, 204 No Content, 400 Bad Request, 404 Not Found, 409 Conflict
- **Stateless communication**: Each request independent, version token for conflict detection
- **Sub-resource hierarchy**: Snapshots as `/characters/{id}/snapshots` correctly nested

#### II. Documentation Clarity ✅ (CONFIRMED)

- **OpenAPI 3.0.1 spec**: Complete with all endpoints, schemas, examples, error cases
- **All parameters documented**: Path (adventureId, characterId), query (page, pageSize), body (request payloads)
- **Success & error responses**: Each endpoint documents 2-4 response codes with descriptions
- **Example payloads included**: Standard character, minimal attributes, conflict scenarios
- **Data constraints documented**: Attribute ranges (3-18), modifier formula explained
- **Pagination documented**: page/pageSize query parameters with defaults and limits

#### III. Testability ✅ (CONFIRMED)

- **Unit test strategy defined**: Modifier calculation, entity validation, service CRUD
- **Test isolation confirmed**: In-memory database for repository tests, mocked repository for service
- **Fast tests guaranteed**: No I/O operations in unit layer, <100ms per test
- **Coverage target >90%**: Character entity, CharacterService, modifier calculation identified
- **Test examples provided**: Quickstart includes CharacterModifierCalculationTests

#### IV. Simplicity ✅ (CONFIRMED)

- **No over-engineering**: Single CharacterService (YAGNI principle)
- **Proven patterns only**: EF Core (existing), Clean Architecture (existing), optimistic locking (standard)
- **No unnecessary abstractions**: Attributes as simple int properties, not complex objects
- **Modifier as pure function**: (base - 10) / 2 with Math.Floor, no side effects
- **Snapshots simple design**: Denormalized copies, not event sourcing
- **Configuration minimal**: Dependency injection, DbContext mapping, standard ASP.NET Core

#### V. Performance ✅ (CONFIRMED)

- **Target <200ms verified**: Primarily CRUD operations, no expensive computations
- **Optimized queries confirmed**: Primary key lookups (O(1)), indexed snapshot queries
- **N+1 prevention**: Single SELECT per operation, no lazy loading chains
- **Pagination required**: Prevents 10k+ record loads (list operations)
- **In-process modifier calc**: No database computation overhead
- **Connection pooling via EF Core**: Standard PostgreSQL pool management

**Gate Result**: ✅ **PASS** - All five constitutional principles CONFIRMED post-design. No violations. Ready for Phase 2 (implementation tasks).

## Complexity Tracking

> No complexity justifications needed - design adheres to all constitution principles while extending proven architecture patterns.
