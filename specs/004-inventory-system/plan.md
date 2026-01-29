# Implementation Plan: Inventory Management System

**Branch**: `004-inventory-system` | **Date**: 2026-01-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-inventory-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an inventory management system supporting stackable items (potions, arrows) and unique equipment (weapons, armor) with seven equipment slots (head, chest, hands, legs, feet, main hand, off hand). Implement loot table generation using weighted random selection integrated with existing dice engine. Support item effect modifiers that apply to character stats when equipped.

## Technical Context

**Language/Version**: C# / .NET 10.0  
**Primary Dependencies**: ASP.NET Core 10.0, Entity Framework Core 10.0.2, Npgsql 10.0.0, Swashbuckle 7.2.0  
**Storage**: PostgreSQL (existing database, new tables: items, inventory_entries, equipment_slots, loot_tables, loot_table_entries)  
**Testing**: xUnit (existing test projects: DiceEngine.API.Tests, DiceEngine.Application.Tests)  
**Target Platform**: Linux container (Docker), RESTful API service  
**Project Type**: Web API (existing clean architecture: Domain, Application, Infrastructure, API layers)  
**Performance Goals**: <200ms p95 for all endpoints including loot generation (constitutional requirement)  
**Constraints**: <200ms API responses, integrate with existing dice system for weighted loot, optimistic locking for equipment changes  
**Scale/Scope**: Support 100 items per inventory, 100 items per stack, typical single-player adventure game scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. RESTful Design ✅

| Requirement | Status | Evidence |
|------------|--------|----------|
| Noun-based resources | ✅ PASS | `/adventures/{id}/inventory`, `/characters/{id}/equipment`, `/loot-tables/{id}` |
| Semantic HTTP methods | ✅ PASS | POST (add items), DELETE (remove), PUT (equip), GET (retrieve) |
| Hierarchical URIs | ✅ PASS | Inventory nested under adventure, equipment under character |
| Stateless communication | ✅ PASS | No session state, all context in request/response |
| Appropriate status codes | ✅ PASS | 200 OK, 201 Created, 404 Not Found, 409 Conflict (version mismatch) |

**Verdict**: PASS - All endpoints follow REST conventions

### II. Documentation Clarity ✅

| Requirement | Status | Evidence |
|------------|--------|----------|
| OpenAPI 3.0.1 spec | ✅ PASS | Generated in Phase 1: `/contracts/openapi.yaml` |
| Complete schemas | ✅ PASS | All request/response bodies defined with types |
| All parameters documented | ✅ PASS | Path (adventureId, itemId), query (filters), body documented |
| Status codes documented | ✅ PASS | Success (200, 201, 204) and errors (400, 404, 409, 500) |
| Examples provided | ✅ PASS | Sample requests for add item, equip item, generate loot |

**Verdict**: PASS - Full OpenAPI documentation to be generated in Phase 1

### III. Testability ✅

| Requirement | Status | Evidence |
|------------|--------|----------|
| Unit tests for business logic | ✅ PASS | ItemService, EquipmentService, LootGenerator tests planned |
| Critical paths covered | ✅ PASS | Stack merging, equipment slot validation, loot dice integration >90% |
| Isolated, repeatable tests | ✅ PASS | Mock EF DbContext, in-memory test data |
| Fast execution | ✅ PASS | <100ms per unit test (no database I/O in unit tests) |
| Clear test naming | ✅ PASS | `AddStackableItem_IdenticalItemExists_MergesStacks()` pattern |
| Tests block deployment | ✅ PASS | CI/CD pipeline enforces test pass before merge |

**Verdict**: PASS - Comprehensive test coverage planned for inventory operations

### IV. Simplicity ✅

| Requirement | Status | Evidence |
|------------|--------|----------|
| YAGNI applied | ✅ PASS | No item durability, enchantments, or crafting (not in spec) |
| Avoid premature abstraction | ✅ PASS | Direct EF Core, no repository pattern (follows existing code) |
| Proven technologies | ✅ PASS | EF Core, PostgreSQL, existing stack (no new frameworks) |
| Self-documenting code | ✅ PASS | Clear entity names (StackableItem, EquipmentSlot), expressive methods |
| Minimal configuration | ✅ PASS | Reuse existing DbContext, connection strings |
| Justified dependencies | ✅ PASS | No new NuGet packages (leverage existing EF Core) |

**Verdict**: PASS - Design follows existing patterns, no unnecessary complexity

### V. Performance ✅

| Requirement | Status | Evidence |
|------------|--------|----------|
| <200ms response time | ✅ PASS | Target: inventory queries <50ms, loot generation <50ms, equip <30ms |
| Optimized queries | ✅ PASS | Indexes on adventure_id, character_id, FK constraints |
| N+1 elimination | ✅ PASS | `.Include()` for related entities (inventory with items) |
| Appropriate pagination | ✅ PASS | Inventory and loot table queries paginated (limit 100 default) |
| Caching deterministic results | ✅ PASS | Loot table definitions cached in memory after first load |
| Performance testing | ✅ PASS | Integration tests measure endpoint latency, fail >200ms |

**Verdict**: PASS - Design meets <200ms requirement with caching and indexing

---

### Constitution Compliance Summary

| Principle | Status | Notes |
|-----------|--------|-------|
| I. RESTful Design | ✅ PASS | Standard REST patterns, noun-based resources |
| II. Documentation | ✅ PASS | OpenAPI contracts in Phase 1 |
| III. Testability | ✅ PASS | Unit tests for all inventory logic |
| IV. Simplicity | ✅ PASS | No over-engineering, reuses existing architecture |
| V. Performance | ✅ PASS | <200ms achievable with indexing and caching |

**GATE RESULT**: ✅ **PASS** - All constitutional requirements met. Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/004-inventory-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml     # Complete API spec for inventory endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── DiceEngine.Domain/
│   ├── Entities/
│   │   ├── Adventure.cs           # Existing
│   │   ├── Character.cs           # Existing (from 003)
│   │   ├── Item.cs                # NEW: Base item entity
│   │   ├── StackableItem.cs       # NEW: Stackable item (extends Item)
│   │   ├── UniqueItem.cs          # NEW: Unique equipment (extends Item)
│   │   ├── InventoryEntry.cs      # NEW: Links items to adventures
│   │   ├── EquipmentSlot.cs       # NEW: Character equipment slots
│   │   ├── LootTable.cs           # NEW: Loot table aggregate root
│   │   └── LootTableEntry.cs      # NEW: Items in loot table with weights
│   └── ValueObjects/
│       ├── ItemEffect.cs          # NEW: Item effects (healing, stat modifiers)
│       └── StatModifier.cs        # NEW: Stat modification value object
│
├── DiceEngine.Application/
│   ├── Services/
│   │   ├── DiceService.cs         # Existing (integrate for loot weights)
│   │   ├── CharacterService.cs    # Existing (update for stat modifiers)
│   │   ├── InventoryService.cs    # NEW: Inventory CRUD operations
│   │   ├── EquipmentService.cs    # NEW: Equipment slot management
│   │   └── LootGeneratorService.cs# NEW: Loot table random generation
│   └── Models/
│       ├── AddItemRequest.cs      # NEW: Request DTOs
│       ├── EquipItemRequest.cs    # NEW
│       └── LootGenerationResult.cs# NEW
│
├── DiceEngine.Infrastructure/
│   └── Persistence/
│       ├── GameDbContext.cs       # UPDATE: Add new DbSets
│       └── Migrations/
│           └── 004_AddInventory.cs# NEW: Migration for inventory tables
│
└── DiceEngine.API/
    └── Controllers/
        ├── InventoryController.cs # NEW: GET/POST/DELETE inventory items
        ├── EquipmentController.cs # NEW: PUT/DELETE equipment
        └── LootTablesController.cs# NEW: POST generate loot

tests/
├── DiceEngine.Domain.Tests/       # NEW: Domain logic tests
│   ├── ItemTests.cs               # Stack merging, unique item identity
│   ├── LootTableTests.cs          # Weighted selection logic
│   └── StatModifierTests.cs       # Modifier calculations
│
├── DiceEngine.Application.Tests/
│   ├── InventoryServiceTests.cs   # NEW: CRUD operations
│   ├── EquipmentServiceTests.cs   # NEW: Slot validation, stat application
│   └── LootGeneratorTests.cs      # NEW: Dice integration, distribution
│
└── DiceEngine.API.Tests/
    ├── InventoryControllerTests.cs# NEW: API endpoint tests
    └── EquipmentControllerTests.cs# NEW
```

**Structure Decision**: Extending existing clean architecture (Domain, Application, Infrastructure, API). New inventory entities added to Domain layer, business logic in Application services, API controllers expose RESTful endpoints. Follows established project patterns from features 001-003.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. All constitutional principles satisfied.*
