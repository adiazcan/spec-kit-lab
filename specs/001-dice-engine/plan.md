# Implementation Plan: Dice Rolling Engine

**Branch**: `001-dice-engine` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dice-engine/spec.md`

**Status**: Phase 1 Complete (Research, Design, API Contracts)

## Summary

Build a cryptographically secure dice rolling engine that parses standard RPG dice notation and complex expressions. Support single rolls (NdS±M), complex expressions (2d6+1d4+3), and advantage/disadvantage mechanics using ASP.NET Core Web API with Entity Framework Core and PostgreSQL backend.

## Technical Context

**Language/Version**: C# with ASP.NET Core 10  
**Primary Dependencies**: ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL  
**Storage**: PostgreSQL database with Entity Framework Core ORM  
**Testing**: xUnit for unit testing  
**Target Platform**: Web API service (Linux/Windows server)  
**Project Type**: Web API backend  
**Architecture**: Clean Architecture pattern with DiceService (parser + roller), regex-based expression parsing  
**Performance Goals**: All API endpoints <50ms response time (within constitution 200ms threshold)  
**Constraints**: Cryptographically secure RNG, <50ms per roll, sub-100ms for complex expressions  
**Scale/Scope**: MVP feature supporting basic rolling, complex expressions, and advantage/disadvantage mechanics

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. RESTful Design ✅

- Dice rolling as resource-based API: `/api/roll` (POST), GET result history
- Stateless HTTP operations with appropriate status codes
- No architectural violations planned

### II. Documentation Clarity ✅

- Full OpenAPI 3.0.1 spec will be generated in `/contracts/openapi.yaml`
- All endpoints documented with request/response schemas and examples
- Migration path for future API versions included

### III. Testability ✅

- xUnit tests with >90% coverage target for DiceService, parser, and roller components
- Isolated unit tests for expression parsing (~15-20 tests) and roll generation (~20-30 tests)
- Fast tests (<100ms each) using mocked RNG for deterministic validation

### IV. Simplicity ✅

- Single responsibility: DiceService owns parsing and rolling logic
- Regex-based parser (straightforward pattern matching, no complex AST)
- Standard ASP.NET Core patterns (dependency injection, services)
- No premature abstraction beyond Clean Architecture layers

### V. Performance ✅

- Performance target: <50ms for all roll operations (well below 200ms threshold)
- No complex database queries (rolls computed in-process)
- Crypto-secure RNG from `System.Security.Cryptography.RandomNumberGenerator`
- No N+1 issues or unnecessary I/O

**Gate Result: PASS** - All five core principles satisfied. No complexity justifications needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-dice-engine/
├── spec.md              # Feature specification (✅ DONE)
├── plan.md              # This file (✅ DONE)
├── research.md          # Phase 0 output (✅ DONE)
├── data-model.md        # Phase 1 output (✅ DONE)
├── quickstart.md        # Phase 1 output (✅ DONE)
├── contracts/           # Phase 1 output (✅ DONE)
│   └── openapi.yaml
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
# Single project structure (C# ASP.NET Core Web API)
src/
├── DiceEngine.API/
│   ├── Program.cs
│   ├── appsettings.json
│   └── Controllers/
│       └── RollController.cs
├── DiceEngine.Application/
│   ├── Services/
│   │   ├── DiceService.cs          # Core rolling/parsing logic
│   │   ├── DiceExpressionParser.cs # Regex-based parser
│   │   └── DiceRoller.cs           # Crypto-secure roller
│   └── Models/
│       ├── DiceExpression.cs
│       ├── DiceRoll.cs
│       └── RollResult.cs
├── DiceEngine.Domain/
│   ├── Entities/
│   └── ValueObjects/
└── DiceEngine.Infrastructure/
    ├── Persistence/
    │   └── DiceEngineDbContext.cs

tests/
├── DiceEngine.Application.Tests/
│   ├── DiceServiceTests.cs
│   ├── DiceExpressionParserTests.cs
│   └── DiceRollerTests.cs
└── DiceEngine.API.Tests/
    └── RollControllerTests.cs

.sln                                 # Solution file
```

**Structure Decision**: Single ASP.NET Core project using Clean Architecture with layered organization (API → Application → Domain → Infrastructure). This provides clear separation of concerns while avoiding over-engineering for the MVP scope.

## Complexity Tracking

No complexity justifications needed - design adheres to all constitution principles.
