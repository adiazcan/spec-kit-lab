# Phase 0 Research: Dice Rolling Engine

**Date**: 2026-01-27  
**Purpose**: Resolve technical decisions and establish best practices for implementation

## 1. ASP.NET Core 10 Web API Best Practices

**Decision**: Use ASP.NET Core 10 minimal APIs or controller-based approach  
**Rationale**: Controller-based approach provides cleaner dependency injection setup and aligns with Clean Architecture pattern. Minimal APIs are more lightweight but less structured.  
**Alternatives Considered**:

- Minimal APIs: Lighter weight, less ceremony, but less structured for complex features
- gRPC: Overkill for dice rolling API; REST is simpler and more discoverable
- GraphQL: Over-engineered for single-purpose rolling endpoint

**Best Practices Selected**:

- Use controller-based API with dependency injection for services
- Leverage `IAsyncResult` for non-blocking I/O (though RNG computation is synchronous and fast)
- Use action filters for validation and error handling
- Structure responses with standardized envelope pattern (success/error)

---

## 2. Cryptographically Secure RNG Implementation

**Decision**: Use `System.Security.Cryptography.RNGCryptoServiceProvider` or `System.Security.Cryptography.RandomNumberGenerator` (static method available in .NET 6+)  
**Rationale**:

- `RNGCryptoServiceProvider` is the standard for cryptographic RNG in .NET
- Use `RandomNumberGenerator.GetBytes()` for modern .NET versions (simpler static API)
- Cannot be seeded or predicted, meeting security requirement FR-003
- Sufficient entropy for dice roll randomization

**Implementation Pattern**:

```csharp
// Instance-based (recommended for performance in loop)
var rng = new RNGCryptoServiceProvider();
var bytes = new byte[4];
rng.GetBytes(bytes);
int roll = (BitConverter.ToInt32(bytes) & int.MaxValue) % sides + 1; // 1-sided
```

OR (for .NET 6+):

```csharp
// Static method (simpler, similar performance)
Span<byte> bytes = new byte[4];
RandomNumberGenerator.Fill(bytes);
int roll = (BitConverter.ToInt32(bytes) & int.MaxValue) % sides + 1;
```

**Alternatives Considered**:

- `System.Random`: Not cryptographically secure, can be predicted
- Seeded RNG: Cannot be seeded with crypto RNG; use separate instance for testing
- External service: Overkill; local RNG sufficient for game use

---

## 3. Regex-Based Expression Parser Design

**Decision**: Use `System.Text.RegularExpressions` for tokenization, sequential parsing for composition  
**Rationale**:

- Simple, proven approach for domain-specific language parsing
- Single-pass regex validation before parsing prevents invalid state
- Straightforward to test and reason about
- Acceptable performance for expected input size

**Pattern Strategy**:

- First regex validates overall structure: `^(\d+d\d+(?:[+-]\d+)?(?:\s*[+-]\s*\d+d\d+)?)*([ad])?$` (simplified)
- Second regex extracts components: `(\d+d\d+|[+-]\d+)`
- Sequential parsing builds AST-like structure (DiceExpression object)

**Key Patterns**:

```
Basic: \d+d\d+ (e.g., 2d6, 1d20)
Modifier: [+-]\d+ (e.g., +5, -2)
Flags: [ad] at end (advantage/disadvantage)
```

**Alternatives Considered**:

- Full hand-written recursive descent parser: More complex, slower to build, tests harder
- ANTLR grammar: Over-engineered; adds external dependency and build step
- Pure string splitting: Error-prone, harder to validate, no clear boundaries

**Testing Approach**:

- Unit tests for each regex pattern
- Property-based tests for parser with generated inputs
- Boundary tests: "0d6", "1d-5", "2d6++1d4", etc.

---

## 4. Clean Architecture Layering for C# Projects

**Decision**: 4-layer structure (API → Application → Domain → Infrastructure)  
**Rationale**:

- API Layer: Controllers, routing, HTTP concerns
- Application Layer: Business logic services (DiceService, DiceExpressionParser, DiceRoller)
- Domain Layer: Core entities and value objects (DiceExpression, DiceRoll, RollResult)
- Infrastructure Layer: Data access, external services (DbContext, migrations)

**Dependency Flow**: API → (depends on) Application → (depends on) Domain ← Infrastructure

**Why This Structure**:

- Domain layer has zero external dependencies, easy to test
- Application services orchestrate domain logic
- API layer thin and focused on HTTP concerns
- Infrastructure can be swapped without touching business logic

**Common Pitfall to Avoid**:

- Don't create entity classes in Infrastructure; entities belong in Domain
- Don't put business logic in controllers; use Application services
- Don't inject repositories into domain entities

---

## 5. Entity Framework Core with PostgreSQL

**Decision**: Use Entity Framework Core 10 with PostgreSQL provider  
**Rationale**:

- EF Core is industry-standard ORM for .NET
- PostgreSQL is robust, open-source, widely supported
- Current design doesn't require complex queries (RNG done in-process)
- Can add roll history/caching later without major refactoring

**Initial Design**:

- Minimal database schema for MVP (may be empty or contain roll history if persisting)
- DbContext in Infrastructure layer
- Migrations via EF Core CLI
- Connection string in `appsettings.json` (environment-specific)

**Performance Considerations**:

- Dice rolling is compute-bound (not I/O-bound), so database isn't bottleneck
- Future: Consider caching for repeated expressions
- No N+1 issues expected at MVP scope

**Alternatives Considered**:

- Dapper (micro-ORM): Overkill for simple schema; EF Core simpler
- Raw SQL: Less maintainable; EF Core LINQ provides type safety
- In-memory database: Fine for testing; PostgreSQL needed for real deployments

---

## 6. xUnit Test Framework and Testing Strategy

**Decision**: Use xUnit with Arrange-Act-Assert (AAA) pattern and inline data/theory tests  
**Rationale**:

- xUnit is modern, lightweight, and integrates seamlessly with .NET
- Theory attribute enables parameterized testing (multiple inputs in single test method)
- No mandatory base classes; cleaner test code
- Built-in fixtures for setup/teardown

**Test Organization**:

```
DiceEngine.Application.Tests/
├── DiceServiceTests.cs          # Integration-style tests of full service
├── DiceExpressionParserTests.cs # Unit tests for parser regex + logic
└── DiceRollerTests.cs           # Unit tests for RNG and statistics
```

**Key Testing Patterns**:

```csharp
// Theory pattern for multiple inputs
[Theory]
[InlineData("2d6", 2, 6)]
[InlineData("1d20+5", 1, 20)]
public void Parse_ValidNotation_ReturnsCorrectExpression(string input, int expectedDice, int expectedSides)
{
    // Test body
}

// Inline mocking for deterministic RNG
[Fact]
public void Roll_WithSeededRng_ProducesExpectedResult()
{
    // Mock RNG to return specific bytes, verify output
}
```

**Coverage Target**: >90% for DiceService, parser, and roller  
**Performance Target**: <100ms per test

**Alternatives Considered**:

- NUnit: Older, still good; xUnit is more modern and cleaner
- MSTest: Microsoft-provided but less elegant DSL
- SpecFlow: Over-engineered for this domain; plain xUnit sufficient

---

## 7. Handling Advantage/Disadvantage Mechanics

**Decision**: Model as flags on DiceExpression (not separate service)  
**Rationale**:

- Advantage/disadvantage is expression-level modifier, not a separate service
- Simpler to reason about: parse flag, perform double roll, select winner
- Fits cleanly into existing parser regex

**Implementation Approach**:

- Parser extracts 'a' (advantage) or 'd' (disadvantage) flag from end of expression
- DiceExpression.AdvantageFlag and DiceExpression.DisadvantageFlag properties
- DiceRoller.Roll() method checks flags and executes double-roll logic if needed
- Both rolls returned in RollResult for transparency (user sees both outcomes)

**Conflict Resolution**:

- If both flags present, return error: "Cannot specify both advantage and disadvantage"
- Validate during parsing, not at roll time

---

## 8. Performance Benchmarking Strategy

**Decision**: Manual performance validation using Stopwatch; benchmarking library only if needed  
**Rationale**:

- <50ms target is generous; expected actual time <1ms on modern hardware
- Stopwatch sufficient for basic validation
- BenchmarkDotNet overkill for initial release
- If future optimizations needed, add BenchmarkDotNet then

**Validation Approach**:

- Test 100 rolls of various complexities (basic, complex, advantage)
- Measure end-to-end time including serialization
- Log results to verify <50ms threshold consistently
- If any roll exceeds 50ms, investigate before release

---

## 9. API Response Format and Standardization

**Decision**: Use standard envelope pattern with success/failure responses  
**Rationale**:

- Consistent format across all endpoints
- Explicit error codes and messages for client handling
- Extensible for future features (pagination, metadata)

**Response Format**:

```json
{
  "success": true,
  "data": {
    "rolls": [2, 4, 1],
    "subtotal": 7,
    "modifier": 5,
    "total": 12,
    "timestamp": "2026-01-27T10:30:00Z",
    "isAdvantage": false
  },
  "error": null,
  "timestamp": "2026-01-27T10:30:00Z"
}
```

**Error Response**:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_EXPRESSION",
    "message": "Expression '2x6' is invalid. Expected format: <NdS±M>",
    "details": null
  },
  "timestamp": "2026-01-27T10:30:00Z"
}
```

---

## 10. Database Schema and EF Core Mapping

**Decision**: Minimal schema for MVP; roll history stored in RollHistory table  
**Rationale**:

- MVP focuses on rolling service, not historical analysis
- Simple schema allows future auditing/analytics without major refactoring
- Deterministic RNG means historical replays don't require input storage

**Initial Schema**:

```sql
-- Optional: for future analytics
CREATE TABLE RollHistory (
    Id BIGSERIAL PRIMARY KEY,
    Expression VARCHAR(255) NOT NULL,
    Result JSONB NOT NULL, -- Entire RollResult serialized
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IsAdvantage BOOLEAN NOT NULL DEFAULT FALSE,
    IsDisadvantage BOOLEAN NOT NULL DEFAULT FALSE
);
```

**EF Core Setup**:

```csharp
public class DiceEngineDbContext : DbContext
{
    public DbSet<RollHistory> RollHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RollHistory>()
            .HasIndex(rh => rh.CreatedAt); // Index for time-range queries
    }
}
```

---

## 11. Regex Expression Pattern Finalization

**Decision**: Multi-stage regex with validation then extraction  
**Rationale**:

- Composition expressions require careful ordering: `2d6+1d4+3` vs `2d6+1d4+3a` (flag at end)
- Modifiers can be negative: `2d6-1d4-5`
- Whitespace must be trimmed but allowed: `2d6 + 1d4` equivalent to `2d6+1d4`

**Final Patterns**:

**Stage 1 - Validation (full expression)**:

```regex
^(\d+d\d+([+-]\d+)?(\s*[+-]\s*\d+d\d+([+-]\d+)?)*|(\d+d\d+([+-]\d+)?)?)\s*[ad]?$
```

Matches: valid notation with optional flags

**Stage 2 - Component Extraction**:

```regex
(\d+d\d+|[+-]\d+)
```

Extracts: individual dice rolls and modifiers in sequence

**Examples Covered**:

- ✅ "2d6" → rolls: [2d6], modifiers: []
- ✅ "2d6+5" → rolls: [2d6], modifiers: [+5]
- ✅ "2d6+1d4+3" → rolls: [2d6, 1d4], modifiers: [+3]
- ✅ "2d6+1d4+3a" → rolls: [2d6, 1d4], modifiers: [+3], flag: advantage
- ❌ "2x6" → rejected
- ❌ "2d6++1" → rejected
- ❌ "d6" (no count) → rejected per FR-002

---

## Summary of Technical Decisions

| Component     | Technology      | Approach                              | Rationale                                            |
| ------------- | --------------- | ------------------------------------- | ---------------------------------------------------- |
| Language      | C# 10           | ASP.NET Core 10                       | Modern, performant, native .NET ecosystem            |
| Web Framework | ASP.NET Core 10 | Controllers + DI                      | Structured, testable, aligns with Clean Architecture |
| RNG           | FCL             | RandomNumberGenerator (crypto-secure) | Built-in, cryptographically sound, no external deps  |
| Parser        | Regex           | Multi-stage validation + extraction   | Simple, tested, performant for expected inputs       |
| ORM           | EF Core 10      | DbContext + migrations                | Industry standard, flexible for future scenarios     |
| Database      | PostgreSQL      | Container-ready                       | Robust, open-source, production-grade                |
| Testing       | xUnit           | AAA pattern + Theory                  | Modern, lightweight, excellent .NET integration      |
| Architecture  | N/A             | 4-layer Clean Architecture            | Clear separation of concerns, testable, maintainable |

---

## Next Steps

**Phase 1 Deliverables**:

1. Create `data-model.md` with entity diagrams and relationships
2. Create `/contracts/openapi.yaml` with all API endpoints and schemas
3. Create `quickstart.md` with setup, build, and first-roll instructions
4. Initialize ASP.NET Core solution structure
5. Update agent context with new technologies and patterns

All research decisions are finalized and unambiguous. Ready to proceed to Phase 1.
