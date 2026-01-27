# Phase 1 Design: Data Model

**Date**: 2026-01-27  
**Purpose**: Define domain entities, value objects, and relationships for the Dice Rolling Engine

---

## Domain Model Overview

The Dice Rolling Engine operates on a simple three-tier model:

1. **DiceExpression** (root aggregate): Represents a parsed dice notation string
2. **DiceRoll** (component): Represents a single dice group within an expression (e.g., "2d6")
3. **RollResult** (output): The computed outcome of rolling an expression

```
DiceExpression (input)
  ├─ Original Expression String
  ├─ Parsed Rolls: DiceRoll[]
  ├─ Modifiers: int[] (+ and - values)
  ├─ Advantage Flag: bool
  └─ Disadvantage Flag: bool
          ↓ (roll operation)
  RollResult (output)
  ├─ Individual Roll Values: int[]
  ├─ Roll Subtotals by Group: Dictionary<DiceRoll, int>
  ├─ Applied Modifiers: int
  ├─ Final Total: int
  ├─ Is Advantage Roll: bool
  ├─ Timestamp: DateTime
  └─ Metadata: RollMetadata
```

---

## Entity Definitions

### 1. DiceExpression (Root Aggregate)

**Purpose**: Represents a validated, parsed dice expression ready for rolling  
**Ownership**: Immutable after construction; created by parser

#### Properties

| Property           | Type                    | Constraints             | Purpose                            |
| ------------------ | ----------------------- | ----------------------- | ---------------------------------- |
| OriginalExpression | string                  | Non-null, max 255 chars | For logging/replay                 |
| DiceRolls          | IReadOnlyList<DiceRoll> | Min 1 element, max 100  | The individual dice groups         |
| Modifiers          | IReadOnlyList<int>      | Min 0 elements          | Cumulative +/- values              |
| HasAdvantage       | bool                    | N/A                     | If true, highest of two rolls used |
| HasDisadvantage    | bool                    | N/A                     | If true, lowest of two rolls used  |
| TotalModifier      | int (computed)          | Sum of Modifiers        | Convenience property               |

#### Validation Rules

- **VR-001**: `DiceRolls.Count >= 1` — Must have at least one dice group
- **VR-002**: `DiceRolls.Count <= 100` — Prevent absurdly large expressions (performance gate)
- **VR-003**: `OriginalExpression.Length <= 255` — Reasonable string length limit
- **VR-004**: `HasAdvantage && HasDisadvantage == false` — Cannot be both advantage AND disadvantage
- **VR-005**: `TotalModifier` range: -1000 to +1000 (derived from + and - modifiers, validation inherited from DiceRoll)

#### Key Methods

```csharp
// Factory method - preferred way to create
public static Result<DiceExpression> Parse(string expression)
{
    // Implementation in DiceExpressionParser service
}

// Computed property
public int TotalModifier => Modifiers.Sum();

// Validation
public ValidationResult Validate() => ...;
```

---

### 2. DiceRoll (Value Object)

**Purpose**: Represents a single dice group (e.g., "2d6)", immutable  
**Ownership**: Created by parser, owned by DiceExpression

#### Properties

| Property     | Type | Constraints    | Purpose                          |
| ------------ | ---- | -------------- | -------------------------------- |
| NumberOfDice | int  | 1-1000         | How many dice to roll            |
| SidesPerDie  | int  | 1-1000         | How many sides each die has      |
| Modifier     | int  | -1000 to +1000 | Per-roll modifier (e.g., +2, -1) |

#### Validation Rules

- **VR-001**: `NumberOfDice >= 1` — Cannot roll zero dice (FR-002)
- **VR-002**: `NumberOfDice <= 1000` — Prevent performance issues
- **VR-003**: `SidesPerDie >= 1` — Cannot have 0 or negative sides (FR-002)
- **VR-004**: `SidesPerDie <= 1000` — Prevent absurdly high side counts
- **VR-005**: `Modifier` in range [-1000, +1000] — Reasonable bounds

#### Key Methods

```csharp
// Computed property
public int MinimumRoll => NumberOfDice + Modifier;
public int MaximumRoll => (NumberOfDice * SidesPerDie) + Modifier;

// Validation
public ValidationResult Validate() => ...;

// Equality (value object semantics)
public override bool Equals(object obj) => ...;
public override int GetHashCode() => ...;
```

#### Immutability Strategy

- All properties are init-only (C# record or init properties)
- No setters after construction
- Parser is sole factory

---

### 3. RollResult (Output DTO)

**Purpose**: Represents the computed outcome of rolling a DiceExpression  
**Ownership**: Transient; created on each roll operation, serialized to HTTP response

#### Properties

| Property             | Type                      | Constraints                  | Purpose                                   |
| -------------------- | ------------------------- | ---------------------------- | ----------------------------------------- |
| Expression           | string                    | Copy of original             | For response context                      |
| IndividualRolls      | int[]                     | All rolls in order           | Transparency: show all dice outcomes      |
| RollsByGroup         | Dictionary<string, int[]> | Grouped by DiceRoll          | Breakdown by expression component         |
| SubtotalsByGroup     | Dictionary<string, int>   | Before-modifier totals       | Intermediate results                      |
| TotalModifier        | int                       | Applied value                | For context                               |
| FinalTotal           | int                       | Sum of all rolls + modifiers | Primary result                            |
| IsAdvantage          | bool                      | Reflects flag                | Metadata                                  |
| IsDisadvantage       | bool                      | Reflects flag                | Metadata                                  |
| AdvantageRollResults | RollResult[]              | [optional]                   | If advantage=true, both outcomes          |
| Timestamp            | DateTime                  | UTC ISO 8601                 | When roll occurred                        |
| Metadata             | RollMetadata              | Nested object                | Additional context (execution time, etc.) |

#### Key Methods

```csharp
// Serialization friendly (public properties, no logic)
// Used directly by controller for JSON response
// Can be extended with helper methods if needed
```

---

### 4. RollMetadata (Value Object)

**Purpose**: Additional context about a roll execution

#### Properties

| Property        | Type   | Constraints                         | Purpose                                       |
| --------------- | ------ | ----------------------------------- | --------------------------------------------- |
| ExecutionTimeMs | double | ≥ 0                                 | How long roll took (for performance tracking) |
| RngAlgorithm    | string | Constant "RNGCryptoServiceProvider" | Which RNG was used                            |
| IsCached        | bool   | false (for MVP)                     | Whether result was cached                     |

---

## Relationships and Flow

### Parse → Roll → Return

```
User Input String
    │
    ├─ DiceExpressionParser.Parse()
    │
    └─ DiceExpression (validated)
         │
         ├─ DiceService.Roll(expression)
         │
         └─ RollResult (computed)
              │
              └─ JSON serialization for HTTP response
```

---

## State Machines

### DiceExpression Lifecycle

```
┌───────────────┐
│   Parsing     │
│   (in-memory) │
└────────┬──────┘
         │
         ├─ Valid
         │  ↓
    ┌────────────────┐
    │ DiceExpression │ ◄─ Can be rolled multiple times
    │   (immutable)  │    (stateless)
    └────────┬───────┘
             │
             ├─ Ready for rolling
             │  (no state transitions after creation)
             │
             └─ Discarded (end of scope)
```

### RollResult Lifecycle

```
┌──────────────────┐
│  RollResult      │
│  (computed once) │
└────────┬─────────┘
         │
         ├─ Serialized to JSON
         │
         └─ Sent in HTTP response
              │
              └─ Discarded (no persistence for MVP)
```

---

## Validation Strategy

### Layer 1: Parser Validation (Regex)

- **When**: During parsing (`DiceExpressionParser`)
- **What**: Structural validation (is this valid dice notation?)
- **Output**: Parsing error or validated DiceExpression

### Layer 2: Entity Validation (Business Rules)

- **When**: Entity construction (constructors or factory methods)
- **What**: Business rule constraints (is this feasible? non-negative? bounds?)
- **Output**: Validation result with detailed error messages

### Layer 3: API Validation (Contracts)

- **When**: API endpoint receives request
- **What**: Input schema validation (is this a string? does it exist?)
- **Output**: 400 Bad Request or pass to service

### Example Error Paths

```
Scenario 1: "2x6"
  API → Parser → Regex rejects → ValidationException → 400 Bad Request
  Message: "Invalid dice notation. Expected format: NdS±M (e.g., 2d6, 1d20+5)"

Scenario 2: "0d6"
  API → Parser → DiceRoll validation fails → ValidationException → 400 Bad Request
  Message: "Number of dice must be >= 1. Received: 0"

Scenario 3: "1d20a" + "1d20d"
  API → Parser → DiceExpression validation fails → ValidationException → 400 Bad Request
  Message: "Cannot specify both advantage and disadvantage"

Scenario 4: Valid expression, roll succeeds
  API → Parser → RollResult → 200 OK + JSON payload
```

---

## Design Decisions and Rationale

### 1. Immutable DiceExpression and DiceRoll

**Decision**: Both are immutable after construction  
**Why**:

- Prevents accidental state corruption between rolls
- Simplifies testing (no mutable state surprises)
- Enables potential caching/memoization in future
- Thread-safe by default

### 2. DiceRoll as Value Object (not Entity)

**Decision**: DiceRoll has no identity; equality based on properties  
**Why**:

- Two "2d6" rolls are interchangeable (no unique ID needed)
- Simplifies comparison and testing
- No database persistence needed for MVP

### 3. RollResult as Transfer Object (not Entity)

**Decision**: RollResult is compute-once, not stored (MVP)  
**Why**:

- Stateless API (each call independent)
- No historical tracking needed for MVP
- Can add persistence later without breaking API contract
- Serializes directly to JSON response

### 4. Aggregation in DiceExpression

**Decision**: DiceExpression is the aggregate root; DiceRoll is contained  
**Why**:

- Parser operates on entire expression at once
- Rolls are only meaningful within expression context
- Easier to pass entire validated object to roller
- Clear ownership hierarchy

### 5. Modifiers as List (not attached to DiceRoll)

**Decision**: Modifiers are expression-level, not per-dice-group  
**Why**:

- Spec doesn't distinguish "2d6+1d4+3" as "2d6+1d4, then +3"
- Simpler mental model: roll all dice, sum modifiers
- Matches common RPG notation (modifiers at end)
- If future spec requires per-group modifiers, can refactor DiceRoll

### 6. Advantage/Disadvantage as Flags (not separate logic)

**Decision**: Stored as booleans on DiceExpression  
**Why**:

- Simple binary flags requiring no extra entity
- Parsed from expression suffix (e.g., "2d6a")
- Prevents conflicting states (validated at parse time)

---

## Constraints Summary

| Constraint                   | Limit              | Source                       | Rationale                                     |
| ---------------------------- | ------------------ | ---------------------------- | --------------------------------------------- |
| Max DiceRolls per expression | 100                | FR-011 (prevent perf issues) | Prevent DoS; 100+ rolls is pathological       |
| Max NumberOfDice per roll    | 1000               | Domain rule                  | Reasonable upper bound, prevents int overflow |
| Max SidesPerDie per roll     | 1000               | Domain rule                  | Reasonable upper bound                        |
| Max Modifier value           | ±1000              | Domain rule                  | Reasonable upper bound for game mechanics     |
| Max expression string length | 255                | Domain rule                  | Fits database VARCHAR, prevents abuse         |
| Advantage + Disadvantage     | Mutually exclusive | FR-009                       | Business rule on DiceExpression               |

---

## Future Extensions (Not MVP)

These are deferred to Phase 2+, mentioned here for context:

1. **Roll History Persistence**: Add RollHistory entity, save results to PostgreSQL
2. **Named Expressions**: Allow users to save/reuse expressions (e.g., "damage", "stealth_check")
3. **Seeded Rolls**: For testing/replays (separate from crypto RNG)
4. **Bulk Rolling**: Roll multiple times in single request
5. **Advanced Modifiers**: Conditional modifiers (e.g., if roll >= 15, add bonus)

---

## Summary

The domain model is deliberately simple:

- **DiceExpression**: Validated input (parsed once, immutable)
- **DiceRoll**: Atomic dice group (value object)
- **RollResult**: Computed output (transient, serialized)
- **Clear validation layers**: Parser → Entity → API
- **Stateless operations**: No state machines, no temporal concerns
- **MVP-focused**: Only what's needed now; extensible for future features

This design satisfies all functional requirements (FR-001 through FR-011) and aligns with the constitution's simplicity principle.
