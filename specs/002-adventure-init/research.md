# Phase 0: Research - Adventure Initialization System

**Status**: Complete  
**Date**: 2026-01-27  
**Researcher**: Plan Agent

## Overview

This document consolidates research findings for the Adventure Initialization System feature. All technical decisions leverage the proven DiceEngine architecture and existing .NET Stack.

---

## Decision 1: Extend Existing ASP.NET Core Backend

**Decision**: Use ASP.NET Core 10 with Entity Framework Core and PostgreSQL (same as DiceEngine)

**Rationale**:

- Proven stack already deployed and tested in production
- Existing infrastructure, connection pooling, and database migrations are established
- Team familiarity reduces development time and cognitive load
- Clean Architecture patterns already in place reduce architectural decisions
- No new dependencies or tooling required

**Alternatives Considered**:

- **Separate microservice**: Would introduce service-to-service communication complexity, distributed data consistency issues, and operational overhead. DiceEngine and Adventure are better served as a monolithic service with clear domain boundaries.
- **NoSQL storage**: Would sacrifice schema validation, ACID transactions, and relationship integrity needed for consistent game state. PostgreSQL is adequate for current scale needs.
- **GraphQL API**: While GraphQL offers flexibility, REST is simpler for CRUD operations and fully sufficient for adventure management. Can migrate to GraphQL later if needed.

---

## Decision 2: Store Game State as JSON in PostgreSQL

**Decision**: Game state persisted as JSONB column in Adventure table

**Rationale**:

- Flexible schema allows adventures to store different types of game state without schema migrations
- PostgreSQL JSONB provides full queryability and indexing if needed
- No need for separate normalized tables (YAGNI principle)
- Simple, straightforward approach aligns with Constitution IV (Simplicity)
- Can evolve schema freely without database migrations

**Alternatives Considered**:

- **Separate normalized tables**: Would require separate tables for inventory, flags, variables, etc. Adds complexity for join queries and schema management. Current adventure count doesn't justify relativity.
- **DocumentDB or MongoDB**: Adds operational complexity and abandons ACID guarantees. PostgreSQL JSONB is perfectly adequate.

---

## Decision 3: Clean Architecture with Repository Pattern

**Decision**:

- Domain layer: Adventure aggregate root with GameState value object
- Application layer: AdventureService with CRUD operations
- Infrastructure layer: AdventureRepository for EF Core data access
- API layer: AdventuresController following REST conventions

**Rationale**:

- Proven pattern from DiceEngine; consistency across codebase
- Repository abstraction allows easy testing with in-memory implementations
- Domain-driven design keeps business logic isolated and testable
- Clean separation enables independent testing of each layer

**Alternatives Considered**:

- **Anemic model with EF Core DbContext directly in service**: Simpler initially but couples business logic to ORM. Violates separation of concerns and makes testing harder.
- **CQRS pattern**: Unnecessary complexity at MVP stage. Can introduce later if read/write patterns diverge significantly.

---

## Decision 4: RESTful CRUD API Design

**Decision**:

- POST `/api/adventures` → Create
- GET `/api/adventures/{id}` → Retrieve single
- PUT `/api/adventures/{id}` → Update
- DELETE `/api/adventures/{id}` → Delete
- GET `/api/adventures?page=1&limit=20` → List with pagination

**Rationale**:

- Follows REST conventions and Constitution I requirement
- Standard HTTP semantics reduce cognitive load for API consumers
- Pagination on list prevents N+1 issues and supports large collections
- Consistent with DiceEngine API patterns

**Alternatives Considered**:

- **Custom RPC endpoints** (`/api/startAdventure`, `/api/continueAdventure`): Violates REST principles, makes API less discoverable, harder to document.
- **GraphQL**: Adds complexity for straightforward CRUD. REST is simpler for this feature.

---

## Decision 5: No Authentication/Authorization at Feature Level

**Decision**: Feature assumes authentication/authorization handled at API gateway or middleware level

**Rationale**:

- Spec mentions "users can only access their own adventures" but assumes external authentication system
- Simplifies Adventure service to focus on core functionality
- Common pattern in microservices (auth as cross-cutting concern)
- Can be added later without Adventure service changes

**Assumptions**:

- An authenticated user context is available in `HttpContext.User`
- User ID is extracted from claims and passed to service layer
- Authorization checks happen in controller or middleware

---

## Decision 6: Timestamps Managed by Server

**Decision**: System generates `CreatedAt` and `LastUpdatedAt` on server; clients cannot override

**Rationale**:

- Prevents client clock skew from corrupting temporal data
- Ensures consistent audit trail
- Simpler business logic (no need to validate client timestamps)
- Aligns with assumption in spec

**Implementation**:

- Entity Framework Core automatically sets `CreatedAt` on insert
- `LastUpdatedAt` set on insert and updated on every PUT operation

---

## Decision 7: Hard Delete for Abandoned Adventures

**Decision**: DELETE operation removes adventure record entirely (hard delete)

**Rationale**:

- Spec explicitly states "no archival or recovery mechanism required"
- Simpler data model (no delete flags, archive tables, or recovery logic)
- Cleaner from user perspective (deleted means gone)
- GDPR-compliant deletion if needed

**Alternatives Considered**:

- **Soft delete (flag-based)**: Adds complexity with filters on every query, recovery logic, and archive management. Not required by spec.

---

## Decision 8: Performance Constraints

**Decision**: Target <200ms p95 for all operations (Adventure-specific target can be <100ms)

**Rationale**:

- Constitution V requires <200ms for all endpoints
- Adventure CRUD is simpler than dice engine (no computation)
- PostgreSQL primary key lookups are O(1), naturally fast
- Pagination prevents large result sets

**Implementation**:

- Index on Adventure.Id (primary key)
- Index on Adventure.CreatedAt and LastUpdatedAt for potential sorting
- Connection pooling via EF Core
- No complex joins; single table queries

---

## Decision 9: Validation Strategy

**Decision**:

- Domain layer: Entity validation in constructor (CreatedAt, LastUpdatedAt cannot be null)
- Application layer: Service validates business rules (adventure exists before update/delete)
- API layer: Controller validates input schema (required fields, types)

**Rationale**:

- Layered validation prevents invalid data from entering system
- Clear responsibility separation
- FluentValidation or data annotations for API layer
- Domain entities enforce invariants

---

## Decision 10: Pagination Design

**Decision**:

- Default: page=1, limit=20
- Max limit: 100 to prevent DOS
- Response includes total count and hasMore flag

**Rationale**:

- Prevents loading 10k+ adventures at once (memory/network issue)
- offset-based pagination simple and sufficient for MVP
- Cursor-based pagination can be added later if needed
- Reasonable defaults reduce client complexity

---

## Technical Dependencies Summary

| Dependency                            | Version | Purpose               |
| ------------------------------------- | ------- | --------------------- |
| ASP.NET Core                          | 10.0    | Web framework         |
| Entity Framework Core                 | 10.0    | ORM                   |
| Npgsql.EntityFrameworkCore.PostgreSQL | 10.0    | PostgreSQL driver     |
| Swashbuckle.AspNetCore                | 7.2.0   | OpenAPI documentation |
| xUnit                                 | Latest  | Unit testing          |
| Moq                                   | Latest  | Mocking (for tests)   |

---

## Risk Analysis

| Risk                                 | Probability | Impact                  | Mitigation                                        |
| ------------------------------------ | ----------- | ----------------------- | ------------------------------------------------- |
| GameState JSON grows too large       | Low         | Performance degradation | Implement max-size validation upfront             |
| Database connection pool exhaustion  | Very Low    | Connection timeouts     | EF Core default pooling sufficient for MVP        |
| Concurrent updates to same adventure | Low         | Lost updates            | Add optimistic concurrency via RowVersion column  |
| Schema evolution needed              | Medium      | Migration required      | Use flexible JSONB; can normalize later if needed |

---

## Next Steps (Phase 1)

1. Create domain entities and value objects (Adventure, GameState)
2. Design OpenAPI specification for all CRUD endpoints
3. Create data model documentation
4. Generate API contracts
5. Update agent context with new technologies/patterns
