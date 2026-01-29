# Phase 0: Research & Clarifications

**Date**: January 29, 2026  
**Purpose**: Resolve technical unknowns and establish design decisions for the multi-stage quest system

---

## Research Findings

### 1. Quest State Management Architecture

**Question**: How should quest state be managed - as part of player progress or as independent entities?

**Decision**: Independent quest progress entities linked to quests via player ID + quest ID composite key.

**Rationale**:

- Follows EF Core relationship patterns observed in existing inventory system
- Enables efficient queries for "active quests for player" without joining through players table
- Allows quest definition reuse across multiple players
- Supports concurrent operation on different players' quest states

**Alternatives Considered**:

- Store progress as JSON blob in single table: Rejected - makes querying individual stage progress inefficient, complicates indexing
- Embed progress directly in player aggregate: Rejected - violates bounded context separation, makes player entity unwieldy

---

### 2. Success/Failure Condition Evaluation Model

**Question**: How should success and failure conditions be evaluated - as data or as rules logic?

**Decision**: Data-driven model with condition definitions stored in database, evaluated by a `ConditionEvaluator` service.

**Pattern Used**:

```
SuccessCondition Entity
├── condition_type: enum (KillCount, ItemCollected, LocationVisit, NpcInteraction)
├── target_amount: int
└── metadata: JSON (for extensibility)

ObjectiveProgress Entity
├── objective_id: FK
├── current_progress: int
├── is_completed: bool
└── completed_at: DateTime?
```

**Rationale**:

- Data-driven allows non-programmers (game designers) to create quests without code changes
- Evaluator service can be tested independently with different condition sets
- Easy to add new condition types by extending enum and evaluator logic
- JSON metadata field supports future complex conditions (geofencing, item combinations, etc.)

**Alternatives Considered**:

- Hard-coded condition logic in quest definitions: Rejected - requires code deployment for each new quest
- Expression evaluation engine (e.g., Expression<T>): Rejected - over-engineering for current scope

---

### 3. Quest Dependency Graph Validation

**Question**: How to efficiently validate quest dependencies and detect circular references?

**Decision**: Build dependency DAG in memory on application startup, validate before accepting quests.

**Pattern Used**:

```csharp
// Topological sort on startup
var questDependencies = LoadQuestDependencies();
_dependencyGraph = BuildDAG(questDependencies);

// Check before quest acceptance
var canAccept = _dependencyGraph.AllPrerequisitesMet(questId, playerProgress);
```

**Rationale**:

- Dependency graph is static (defined at design time, not runtime changes)
- In-memory caching provides <5ms validation (well under 200ms constraint)
- Topological sort ensures DAG validity and detects circular refs at startup (fail-fast)
- Single database query to load all dependencies during initialization

**Alternatives Considered**:

- Database-side recursive CTE queries: Rejected - slower than in-memory, complex SQL maintenance
- No validation: Rejected - violates spec requirement FR-005, can break game progression

---

### 4. Stage Transition & Progress Persistence

**Question**: Should stage transitions happen synchronously or async (eventual consistency)?

**Decision**: Synchronous updates via optimistic locking in EF Core.

**Implementation**:

```csharp
// EF Core optimistic locking on QuestProgress
[ConcurrencyCheck]
public byte[] RowVersion { get; set; }

// Update pattern
try
{
    questProgress.CurrentStage++;
    questProgress.LastModified = DateTime.UtcNow;
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    // Handle conflict - reload and retry or return 409 Conflict
}
```

**Rationale**:

- Synchronous ensures player sees consistent state immediately (better UX)
- Optimistic locking prevents lost updates when concurrent requests modify same quest
- Matches <200ms response time goal (sync is faster than async + polling)
- Aligns with existing inventory system patterns (observed in 004-inventory-system)

**Alternatives Considered**:

- Event sourcing with event store: Rejected - over-engineering for single-player game
- Eventual consistency with message queue: Rejected - adds latency, complexity for no benefit
- Pessimistic locks: Rejected - can cause deadlocks in concurrent scenario

---

### 5. Quest Abandonment & Resume Model

**Question**: Should abandoned quests be resumable or require restart?

**Decision**: Abandoned quests can be resumed from where they were left (progress preserved).

**Implementation**:

- `QuestProgress.AbandonedAt` nullable DateTime
- Reaccepting quest checks if progress exists, restores if available
- Clear messaging to player about previous progress when resuming

**Rationale**:

- Matches player expectation from modern RPGs (e.g., Skyrim, Dragon's Dogma)
- Spec assumes "optional ability to resume" based on edge case discussion
- Provides better player experience than forcing complete restart
- Database storage cost minimal (one nullable column)

---

### 6. Reward Granting & Inventory Integration

**Question**: How to ensure rewards are granted atomically alongside quest completion?

**Decision**: Use distributed transaction with inventory service or single-phase commit if same database.

**Assumption**: Inventory system is same database (PostgreSQL), so use single transaction.

**Pattern Used**:

```csharp
using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    // 1. Mark quest complete
    questProgress.Status = QuestStatus.Completed;
    questProgress.CompletedAt = DateTime.UtcNow;

    // 2. Grant rewards (items, currency, experience)
    foreach (var reward in quest.Rewards)
    {
        await _inventoryService.GrantReward(reward, playerId);
    }

    // 3. Update character stats (experience)
    await _characterService.AddExperience(playerId, questXp);

    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

**Rationale**:

- Single transaction ensures atomic operation (all-or-nothing)
- Same database allows ACID guarantees
- Prevents edge case where quest completes but rewards don't grant

---

### 7. Concurrent Active Quests & Performance

**Question**: Performance target for checking 10+ concurrent active quests per player?

**Decision**: Index on `(player_id, status)` and eagerly load with `.Include()`.

**Query Pattern**:

```csharp
// Single query with eager loading
var activeQuests = await _context.QuestProgress
    .Where(qp => qp.PlayerId == playerId && qp.Status == QuestStatus.Active)
    .Include(qp => qp.Quest)
    .Include(qp => qp.Stages)
    .AsNoTracking()
    .ToListAsync();
```

**Expected Performance**:

- 10 active quests: <30ms (index seek + includes)
- 50 quests in system: <50ms (still index seek)
- 1000 quests in system: <50ms (query independent of total quests)

**Rationale**:

- Composite index ensures B-tree optimization
- AsNoTracking() reduces EF Core overhead (no change tracking needed for read)
- Single round-trip to database (vs. N+1 with separate stage queries)

---

## Technology Decisions

### ORM & Data Access

- **Decision**: Entity Framework Core 10.0.2 (existing stack)
- **Rationale**: Proven in existing features (inventory, dice engine), built-in optimistic locking, LINQ queries

### API Versioning

- **Decision**: URI path versioning not needed; API is internal (not public-facing)
- **Rationale**: Following existing API design (no version in DiceEngine.API routes observed)

### Caching Strategy

- **Decision**: In-memory cache for quest definitions and dependency graph; no Redis
- **Rationale**: Data is static; in-memory cache sufficient for single-instance deployment; reduces operational complexity

### Date/Time Handling

- **Decision**: All timestamps UTC, stored as `DateTime` with `Kind = UTC` in EF Core
- **Rationale**: Prevents timezone-related bugs; matches existing patterns in DiceEngine models

---

## Definition: "Active Quest"

For FR-006 and FR-012 compliance:

```
A quest is "active" for a player when:
1. Player has accepted the quest (quest exists in QuestProgress)
2. Status is Active (not Completed, Failed, or Abandoned)
3. Player can only have ONE active instance of each quest type
   (verified by unique index on (quest_id, player_id, status))
```

This prevents the edge case in FR-012: duplicate active instances are impossible by design.

---

## Edge Cases Incorporated into Design

| Edge Case                    | Specification                         | Implementation                                                  |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| Failed prerequisite quest    | See spec edge case discussion         | DependencyResolver checks completion status, not just existence |
| Stage failure                | Sequential stages, entire quest fails | QuestProgress.Status = Failed when any stage fails              |
| Mid-transition disconnect    | Session ends during stage completion  | Optimistic locking ensures consistent final state on reconnect  |
| Multiple concurrent attempts | Player presses "complete stage" twice | Optimistic locking + Status check prevents double-completion    |
| Abandoned quest resumed      | Player resumes previous progress      | AbandonedAt field preserved, previous progress restored         |
| Conflicting quest objectives | FR-010 mentions shared stages         | No shared stages in MVP (each quest has own stage instances)    |

---

## Out of Scope (Explicitly Not Researched)

The following items are mentioned in spec but intentionally excluded from Phase 0 research because they fall outside MVP scope or depend on other decisions:

- **Dynamic Quest Generation**: Spec assumes quests are pre-defined by designers
- **Branching Paths**: Spec assumes linear sequential stages
- **Multi-player Quest Sharing**: Quest progress is per-player (no party mechanics in MVP)
- **Time-limited Quests**: No deadline/expiration mechanics in MVP
- **Repeatable Quests**: Each quest type limited to one active instance per player
- **Cross-game Persistence**: Assumes single-game session (no cloud sync)

These can be researched in future phases if needed.

---

## Research Completion Status

✅ All NEEDS CLARIFICATION items resolved  
✅ All technology choices justified  
✅ All edge cases addressed in design  
✅ Ready for Phase 1: Design & Contracts
