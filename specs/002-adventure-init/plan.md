# Implementation Plan: Adventure Initialization System

**Branch**: `002-adventure-init` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-adventure-init/spec.md`

**Status**: Phase 0-1 Planning (Technical Context & Design)

## Summary

Build a text adventure management system extending the DiceEngine backend with Adventure entity, CRUD operations, scene management, and game state persistence. Users can create adventures with unique IDs, retrieve their adventure list, update scene/state progression, and delete completed adventures. Store adventures in PostgreSQL with RESTful API endpoints.

## Technical Context

**Language/Version**: C# with ASP.NET Core 10  
**Primary Dependencies**: ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL, Swashbuckle  
**Storage**: PostgreSQL database with Entity Framework Core ORM  
**Testing**: xUnit for unit testing  
**Target Platform**: Web API service (Linux/Windows server)  
**Project Type**: Web API backend (extending existing DiceEngine.API)  
**Architecture**: Clean Architecture with DDD principles; extends existing DiceEngine layers  
**Performance Goals**: All API endpoints <200ms response time (per constitution)  
**Constraints**: <200ms per adventure operation, support 10k concurrent adventures, strong consistency  
**Scale/Scope**: MVP adventure management supporting CRUD, scene navigation, game state tracking

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. RESTful Design ✅

- Adventure resource-based API: POST `/api/adventures` (create), GET `/api/adventures` (list), GET `/api/adventures/{id}` (retrieve), PUT `/api/adventures/{id}` (update), DELETE `/api/adventures/{id}` (delete)
- Scene as sub-resource: GET `/api/adventures/{id}/scenes/{sceneId}` for optional navigation
- Stateless HTTP operations with appropriate status codes (201 Created, 200 OK, 404 Not Found, 409 Conflict, etc.)
- No RPC-style endpoints; resources managed via HTTP methods

### II. Documentation Clarity ✅

- Full OpenAPI 3.0.1 spec in `/contracts/openapi.yaml` documenting all CRUD endpoints
- Request/response schemas with Adventure, GameState, scene references, pagination
- Error responses with proper HTTP status codes and descriptive messages
- Example payloads for create, retrieve, update, delete operations
- Pagination for list endpoint (optional query params: page, limit)

### III. Testability ✅

- Unit tests for AdventureService (create, retrieve, update, delete, list operations)
- Repository tests for data access layer (EF Core)
- Controller tests for HTTP contract validation
- Fast tests (<100ms each) with in-memory database or mocked repository
- Target >90% code coverage for Adventure entity and service logic

### IV. Simplicity ✅

- Single AdventureService with clear CRUD responsibility
- Adventure entity with core fields: ID, CreatedAt, LastUpdatedAt, CurrentSceneId, GameState
- Game state stored as JSON (flexible, no schema migration required)
- Standard EF Core patterns and Clean Architecture layers
- No complex business logic; straightforward CRUD operations
- Scene references are just IDs; actual scene resolution deferred to future feature

### V. Performance ✅

- Database queries optimized with primary key lookups (O(1) for individual adventure retrieval)
- Pagination required for list endpoint (prevents loading 10k+ records at once)
- GameState JSON indexed for potential future filtering
- Connection pooling via EF Core to PostgreSQL
- No N+1 issues (single SELECT per operation)
- Target <200ms for all operations; simpler than dice engine (no compute complexity)

**Gate Result: PASS** - All five core principles satisfied. No complexity justifications needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-adventure-init/
├── spec.md              # Feature specification (✅ DONE)
├── plan.md              # This file (IN PROGRESS)
├── research.md          # Phase 0 output (TODO)
├── data-model.md        # Phase 1 output (TODO)
├── quickstart.md        # Phase 1 output (TODO)
├── contracts/           # Phase 1 output (TODO)
│   └── openapi.yaml
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
# Extended ASP.NET Core backend (continuing DiceEngine structure)
src/
├── DiceEngine.API/
│   ├── Program.cs (updated with Adventure controller registration)
│   ├── appsettings.json
│   └── Controllers/
│       ├── RollController.cs (existing)
│       └── AdventuresController.cs (NEW)
├── DiceEngine.Application/
│   ├── Services/
│   │   ├── DiceService.cs (existing)
│   │   └── AdventureService.cs (NEW)
│   └── Models/
│       ├── Adventure.cs (NEW)
│       ├── GameState.cs (NEW)
│       ├── CreateAdventureRequest.cs (NEW)
│       └── UpdateAdventureRequest.cs (NEW)
├── DiceEngine.Domain/
│   ├── Entities/
│   │   └── Adventure.cs (NEW aggregate root)
│   └── ValueObjects/
│       └── GameState.cs (NEW value object)
└── DiceEngine.Infrastructure/
    ├── Persistence/
    │   ├── DiceEngineDbContext.cs (updated with DbSet<Adventure>)
    │   └── Repositories/
    │       └── AdventureRepository.cs (NEW)

tests/
├── DiceEngine.Application.Tests/
│   ├── DiceServiceTests.cs (existing)
│   └── AdventureServiceTests.cs (NEW)
├── DiceEngine.API.Tests/
│   ├── RollControllerTests.cs (existing)
│   └── AdventuresControllerTests.cs (NEW)
```

**Structure Decision**: Extend existing Clean Architecture by adding Adventure domain entity, application service, API controller, and repository. Leverage existing EF Core setup and PostgreSQL connection. Minimal disruption to DiceEngine; Adventure is self-contained feature following same patterns.

## Complexity Tracking

No complexity justifications needed - design adheres to all constitution principles while extending proven architecture patterns.
