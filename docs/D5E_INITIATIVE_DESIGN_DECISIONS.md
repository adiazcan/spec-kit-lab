# D&D 5e Initiative System - Design Decisions Deep Dive

**Date**: January 29, 2026  
**Purpose**: Comprehensive rationale for each architectural decision in initiative system  
**Audience**: Architecture review, implementation team, future maintenance

---

## Decision Framework

For each decision, this document provides:

1. **Context**: Why this decision matters
2. **Options Considered**: Alternative approaches evaluated
3. **Decision**: What was chosen
4. **Rationale**: Why this is best
5. **Cost/Benefit**: Tradeoffs
6. **Risks**: What could go wrong
7. **Mitigation**: How to handle risks

---

## Decision 1: Initiative Calculation Timing

### Context

When should initiative be rolled: once at combat start, per-round, or continuously?

### Options Considered

#### Option A: Roll Once at Combat Start (CHOSEN)

- Single d20 + DEX modifier roll per combatant at `StartCombat()`
- Initiative order locked for entire encounter
- No re-rolling under any circumstances

| Aspect             | Evaluation                   |
| ------------------ | ---------------------------- |
| D&D Compliance     | ✅ RAW standard (PHB 189)    |
| Fairness           | ✅ No randomness mid-combat  |
| Implementation     | ✅ Simple, one calculation   |
| Player Expectation | ✅ Aligns with 5e experience |
| System Load        | ✅ Minimal (single loop)     |
| Dynamic Feel       | ⚠️ Static if combat extends  |

#### Option B: Re-roll Each Round

- Roll initiative at start of each round
- Reflects "dynamic readiness"
- More dramatic but unpredictable

| Aspect             | Evaluation                                  |
| ------------------ | ------------------------------------------- |
| D&D Compliance     | ❌ Non-standard (weird for 5e)              |
| Fairness           | ❌ Penalizes slow roles, rewards lucky ones |
| Implementation     | ⚠️ Track in each round loop                 |
| Player Expectation | ❌ Violates 5e standard                     |
| System Load        | ⚠️ O(n) per round                           |
| Dynamic Feel       | ✅ Very dramatic each round                 |

#### Option C: Progressive Initiative Degradation

- DEX modifier locked, d20 re-rolled each round
- Reflects "fatigue/adaptation"
- Hybrid approach

| Aspect             | Evaluation                            |
| ------------------ | ------------------------------------- |
| D&D Compliance     | ❌ House rule only                    |
| Fairness           | ⚠️ Consistent degradation predictable |
| Implementation     | ⚠️ Track history per combatant        |
| Player Expectation | ❌ Requires explanation               |
| System Load        | ⚠️ O(n) per round                     |
| Dynamic Feel       | ⚠️ Moderate improvement               |

### Decision

**Option A: Roll Once at Combat Start**

### Rationale

1. **D&D 5e Standard**: PHB §189 and DMG §271 both prescribe single initiative roll
   - Players expect this from official rules
   - Aligns with broader D&D ecosystem tools (Roll20, Fantasy Grounds)
   - Certification/compatibility concern if deviating

2. **Fairness**: Single roll prevents situations where:
   - Lucky combatants dominate multiple rounds
   - Unlucky combatants spiral downward
   - Players feel punished by "rigged" randomness
3. **Simplicity**:

   ```csharp
   // Single call at start
   encounter.StartCombat(calculator); // Done

   // Not repeated each round
   foreach (round in combat) { /* no re-roll */ }
   ```

4. **Player Psychology**:
   - Initiative roll becomes memorable moment
   - High rolls feel rewarding throughout combat
   - Strategic depth comes from positioning/actions, not luck

### Cost/Benefit

**Benefits**:

- ✅ Simple implementation (one IDiceRoller call per combatant)
- ✅ Deterministic order (players know who acts each round)
- ✅ Fair and transparent
- ✅ Aligns player expectations

**Costs**:

- ❌ No dynamic flavor for 3+ round combats
- ❌ Can't respond to "my character got a burst of speed"
- ❌ House rule (advantage on init) requires special handling

### Risks & Mitigation

**Risk**: Players feel "locked in" if early roles are bad

- **Mitigation**: Emphasize action economy over turn order in design
- **Mitigation**: Allow conditional bonuses from spells/abilities (not re-roll)

**Risk**: Long combats feel monotonous (same order every round)

- **Mitigation**: Combat is ~3-5 rounds typically
- **Mitigation**: Action variety (different attacks each turn) compensates

### Implementation Artifacts

```csharp
// ✅ Simple: Single calculation point
public void StartCombat(InitiativeCalculator calculator)
{
    var allCombatants = _playerParty.Concat(_enemyParty);
    _initiativeOrder = calculator.CalculateInitiative(allCombatants);
    CurrentRound = 1;
}

// ✅ No re-rolling in turn loop
public CombatTurnResult ResolveTurn(IActionExecutor executor)
{
    // _initiativeOrder never changes
    var current = _initiativeOrder.GetCurrentCombatant();
    // ... resolve action ...
    _initiativeOrder.AdvanceToNextTurn(); // Pointer advancement only
}
```

---

## Decision 2: Tiebreaker Resolution Hierarchy

### Context

What happens when two combatants roll same initiative score?

### Options Considered

#### Option A: DEX Modifier, Then Random (CHOSEN)

**Precedence**:

1. Highest initiative score (d20 + DEX)
2. Highest DEX modifier
3. Random coin flip (Guid)

```
Combatant A: d20=10, DEX=+3 → score=13
Combatant B: d20=10, DEX=+2 → score=12  ← A wins immediately
Combatant C: d20=12, DEX=+1 → score=13
Combatant D: d20=12, DEX=+1 → score=13  ← Random tiebreaker
```

| Aspect         | Evaluation                         |
| -------------- | ---------------------------------- |
| D&D Compliance | ✅ RAW (DMG 271)                   |
| Fairness       | ✅ DEX reflects agility, then luck |
| Determinism    | ✅ Consistent outcomes             |
| Explanation    | ✅ Intuitive to players            |
| Implementation | ✅ Simple LINQ sort                |

#### Option B: All Random Immediately

- Skip DEX tiebreaker, go straight to coin flip
- Equal treatment to all scenarios

| Aspect         | Evaluation                       |
| -------------- | -------------------------------- |
| D&D Compliance | ❌ Violates RAW                  |
| Fairness       | ⚠️ True random, but devalues DEX |
| Determinism    | ✅ One method throughout         |
| Explanation    | ❌ "Why roll DEX at all?"        |
| Implementation | ✅ One sort criterion            |

#### Option C: Creation Order (ID-based)

- Fixed order based on when combatant was added
- Completely deterministic, no randomness

| Aspect         | Evaluation                           |
| -------------- | ------------------------------------ |
| D&D Compliance | ❌ Non-standard                      |
| Fairness       | ❌ Favors whoever was added first    |
| Determinism    | ✅ Absolutely reproducible           |
| Explanation    | ❌ Requires implementation knowledge |
| Implementation | ✅ Just use Guid comparison          |

#### Option D: Position-based (PCs before NPCs)

- Prefer player controlled combatants
- Asymmetric but player-favorable

| Aspect         | Evaluation                      |
| -------------- | ------------------------------- |
| D&D Compliance | ❌ Explicit advantage to PCs    |
| Fairness       | ❌ System biased toward players |
| Determinism    | ✅ Consistent                   |
| Explanation    | ⚠️ "House rule" feel            |
| Implementation | ⚠️ Categorization required      |

#### Option E: Multiple Tiebreaker Methods

- Support multiple methods (random, DEX, position) as config option
- Flexible system design

| Aspect         | Evaluation                          |
| -------------- | ----------------------------------- |
| D&D Compliance | ⚠️ Can conform, but complex         |
| Fairness       | ⚠️ Depends on method chosen         |
| Determinism    | ⚠️ Config-dependent                 |
| Explanation    | ❌ Players need to know which       |
| Implementation | ❌ Enum patterns, multiple branches |

### Decision

**Option A: DEX Modifier → Random**

### Rationale

1. **D&D 5e RAW (Rules As Written)**

   > "If a tie occurs, the creature with the higher Dexterity score goes first. If the Dexterity scores are the same, the order is determined randomly." (DMG p. 271)
   - Players familiar with 5e expect this exact behavior
   - Certification/compatibility with official materials

2. **Mechanical Sense**:
   - DEX represents agility/reflexes → logical for initiative secondary criteria
   - Combatant with higher DEX is "faster" even on equal d20 rolls
   - Makes DEX a valuable attribute (not just AC)

3. **Fairness**:
   - Random as last resort when truly tied
   - Not unfair to anyone (random is unpredictable for all)
   - Prevents "soft bias" like creation order

4. **Clean Implementation**:
   ```csharp
   var sorted = initiatives
       .OrderByDescending(e => e.InitiativeScore)        // Primary
       .ThenByDescending(e => e.DexModifier)             // Tiebreaker 1
       .ThenBy(e => e.TiebreakerKey)                      // Tiebreaker 2
       .ToList();
   ```

   - LINQ naturally handles cascade
   - No special case logic
   - Deterministic sorting algorithm

### Cost/Benefit

**Benefits**:

- ✅ Aligns with player expectations
- ✅ DEX becomes more valuable
- ✅ Clear, understandable rules
- ✅ Minimal implementation complexity
- ✅ Fair for all combatants

**Costs**:

- ❌ Slightly more complex than pure-random
- ❌ Requires communicating tiebreaker rules

### Risks & Mitigation

**Risk**: Players with same DEX don't understand "coin flip"

- **Mitigation**: UI explicitly shows tiebreaker process
- **Mitigation**: Log/display: "A (DEX+3) → wins", "B (DEX+3) → loses coin flip"

**Risk**: Multiple ties in same combat (rare but possible)

- **Mitigation**: Tiebreaker assigned at initialization, never changes
- **Mitigation**: Same Guid used throughout encounter

### Implementation Artifacts

```csharp
// InitiativeEntry has TiebreakerKey assigned at creation
public static InitiativeEntry Create(int d20Roll, ICombatant combatant)
{
    return new InitiativeEntry
    {
        D20Roll = d20Roll,
        DexModifier = combatant.DexterityModifier,
        Combatant = combatant,
        TiebreakerKey = Guid.NewGuid()  // ← Fixed for encounter
    };
}

// Sort applies all three criteria
var sorted = initiatives
    .OrderByDescending(e => e.InitiativeScore)
    .ThenByDescending(e => e.DexModifier)
    .ThenBy(e => e.TiebreakerKey)
    .ToList();
```

---

## Decision 3: Initiative Order Data Structure

### Context

How to store and manage the turn sequence? Must support:

- Fast iteration (turn resolution)
- Removal (combatant defeated/fled)
- Current turn tracking
- Round transitions

### Options Considered

#### Option A: LinkedList<InitiativeEntry> (CHOSEN)

```csharp
private readonly LinkedList<InitiativeEntry> _turnOrder;
private LinkedListNode<InitiativeEntry> _currentTurn;
```

**Operations**:
| Operation | Time | Notes |
|-----------|------|-------|
| Iterate | O(n) | Natural while-loop behavior |
| Removal | O(1) | Node already found from iteration |
| Current→Next | O(1) | Pointer arithmetic |
| Find (by ID) | O(n) | Only on removal |

| Aspect              | Evaluation                    |
| ------------------- | ----------------------------- |
| Removal Performance | ✅ O(1) after located         |
| Current Pointer     | ✅ Natural memory of position |
| Iteration           | ✅ For-each or while loops    |
| Memory              | ⚠️ Extra pointer per node     |
| Round Advancement   | ✅ Just follow next pointer   |

#### Option B: Array/List<InitiativeEntry> with Index

```csharp
private List<InitiativeEntry> _turnOrder;
private int _currentIndex;
```

**Operations**:
| Operation | Time | Notes |
|-----------|------|-------|
| Iteration | O(n) | Cache-locality good |
| Removal | O(n) | Must shift elements |
| Current→Next | O(1) | Index increment |
| Find (by ID) | O(n) | Linear search |

| Aspect              | Evaluation                    |
| ------------------- | ----------------------------- |
| Removal Performance | ❌ O(n) for array shifting    |
| Current Pointer     | ⚠️ Index can become invalid   |
| Iteration           | ✅ Cache-friendly             |
| Memory              | ✅ Dense array layout         |
| Round Advancement   | ❌ Wrap-around at end complex |

#### Option C: Priority Queue<int, InitiativeEntry>

```csharp
private PriorityQueue<InitiativeEntry, int> _turnOrder;
```

**Operations**:
| Operation | Time | Notes |
|-----------|------|-------|
| Removal | O(ln n) | Not guaranteed efficient |
| Peek | O(1) | Top of heap |
| Next | O(ln n) | Re-heap after removal |
| Current Pointer | ❌ Queue, not positioned |

| Aspect              | Evaluation                    |
| ------------------- | ----------------------------- |
| Removal Performance | ⚠️ O(ln n), not O(1)          |
| Current Pointer     | ❌ Doesn't track position     |
| Iteration           | ❌ Must re-dequeue            |
| Memory              | ✅ Efficient                  |
| Round Advancement   | ❌ Must re-insert or re-queue |

#### Option D: SortedSet<InitiativeEntry> (IComparable)

```csharp
private SortedSet<InitiativeEntry> _turnOrder;
private var _currentNode;
```

**Operations**:
| Operation | Time | Notes |
|--------|------|-------|
| Removal | O(ln n) | Tree rebalance |
| Iteration (in-order) | O(n) | Natural tree traversal |
| Current Pointer | ⚠️ Node tracking complex |

| Aspect              | Evaluation                 |
| ------------------- | -------------------------- |
| Removal Performance | ⚠️ O(ln n) tree rebalance  |
| Current Pointer     | ⚠️ Possible but complex    |
| Iteration           | ✅ Natural in-order        |
| Memory              | ✅ Balanced tree           |
| Round Advancement   | ⚠️ Must navigate structure |

### Decision

**Option A: LinkedList<InitiativeEntry>**

### Rationale

1. **Removal Performance**:
   - Combat frequently removes combatants (defeated, fled)
   - LinkedList: O(1) removal once node located
   - Array/List: O(n) for element shifting
   - ~3-5 rounds × ~6 combatants = ~20 removals possible

   ```csharp
   // LinkedList: One operation
   _turnOrder.Remove(nodeToRemove);  // O(1)

   // List: Multiple operations
   _turnOrder.RemoveAt(index);       // O(n) - shifts all after
   ```

2. **Current Turn Tracking**:
   - LinkedList node naturally holds position
   - Index-based requires recalculation after each removal
   - Pointer-based semantics match "whose turn is it now?"

   ```csharp
   // LinkedList: Current is literal node
   var current = _currentTurn;  // Still valid after removal of other nodes

   // Array: Current index may be invalid
   var current = _turnOrder[_currentIndex];  // What if element removed before?
   ```

3. **Round Transitions**:
   - `_currentTurn.Next == null` → new round (clean sentinel logic)
   - No wrap-around index calculation needed

   ```csharp
   if (_currentTurn.Next == null)
   {
       _currentTurn = _turnOrder.First;  // Cycle
       return true; // New round
   }
   ```

4. **Iteration Semantics**:
   - Combat turn resolution is sequential walk through list
   - While-loop naturally follows LinkedList structure
   - No concurrent modification issues

### Cost/Benefit

**Benefits**:

- ✅ O(1) removal (frequent operation)
- ✅ Natural current turn tracking
- ✅ Clean sentinel logic (null = end)
- ✅ Matches game semantics ("whose turn")

**Costs**:

- ❌ Extra memory (per-node pointers)
- ❌ Less cache-friendly than array
- ❌ Slightly slower iteration (pointer following vs. array indexing)

### Risks & Mitigation

**Risk**: Memory overhead from extra pointers

- **Mitigation**: Typical combat has 3-6 combatants, << 1KB overhead
- **Mitigation**: Other data structures have similar overhead

**Risk**: Cache misses from pointer-following

- **Mitigation**: Combat isn't tight inner loop (UI/network latency dominates)
- **Mitigation**: Not optimizing for sub-millisecond performance

### Implementation Artifacts

```csharp
public class InitiativeOrder
{
    private readonly LinkedList<InitiativeEntry> _turnOrder;
    private LinkedListNode<InitiativeEntry> _currentTurn;

    public void RemoveCombatant(ICombatant combatant)
    {
        var node = _turnOrder.FirstOrDefault(...);

        // Safe removal even if current
        if (node == _currentTurn)
            _currentTurn = node.Next ?? _turnOrder.First;

        _turnOrder.Remove(node);  // O(1)
    }

    public bool AdvanceToNextTurn()
    {
        if (_currentTurn?.Next == null)
        {
            _currentTurn = _turnOrder.First;
            return true; // New round
        }

        _currentTurn = _currentTurn.Next;
        return false;
    }
}
```

---

## Decision 4: Combatant Removal Strategy

### Context

When a combatant is defeated or flees, how should they be handled in initiative order?

### Options Considered

#### Option A: Immediate Removal (CHOSEN)

- Remove from `InitiativeOrder` immediately when defeated
- skipped turns or "empty" entries

```csharp
private void ProcessDefeatedCombatant(ICombatant combatant)
{
    combatant.MarkDefeated();
    _initiativeOrder.RemoveCombatant(combatant);  // Gone from order
}
```

| Aspect            | Evaluation                          |
| ----------------- | ----------------------------------- |
| State Consistency | ✅ Active combatants = has turns    |
| Cognitive Load    | ✅ No "dead" entries to skip        |
| Restoration       | ❌ No way to bring back (if needed) |
| Memory            | ✅ Minimal                          |
| Implementation    | ✅ Simple removal                   |

#### Option B: Mark as Skipped

- Keep in `InitiativeOrder`, mark as "defeated"
- Skip their turns without removing

```csharp
private void ProcessDefeatedCombatant(ICombatant combatant)
{
    combatant.MarkDefeated();
    // Leave in order, skip during turn resolution
}

public bool ResolveTurn()
{
    var current = _initiativeOrder.GetCurrentCombatant();
    if (current.State != CombatantState.Active)
    {
        _initiativeOrder.AdvanceToNextTurn();
        return ResolveTurn(); // Skip, try next
    }
    // ...
}
```

| Aspect            | Evaluation                       |
| ----------------- | -------------------------------- |
| State Consistency | ⚠️ Order out of sync with active |
| Cognitive Load    | ❌ Skipping adds complexity      |
| Restoration       | ✅ Can resurrect easily          |
| Memory            | ❌ Dead entries accumulate       |
| Implementation    | ⚠️ Skip logic in multiple places |

#### Option C: Separate Active List

- Maintain `List<ICombatant> ActiveCombatants`
- Keep full initiative order separately
- Two data structures in sync

```csharp
private LinkedList<InitiativeEntry> _initOrder;     // Full
private List<ICombatant> _activeCombatants;         // Subset
```

| Aspect            | Evaluation                       |
| ----------------- | -------------------------------- |
| State Consistency | ⚠️ Two structures to sync        |
| Cognitive Load    | ❌ Business logic for sync       |
| Restoration       | ✅ Full order preserved          |
| Memory            | ❌ Duplicate data                |
| Implementation    | ❌ Complex invariant maintenance |

#### Option D: Tombstone Entries

- Replace combatant reference with sentinel
- Keep structure but mark "removed"

```csharp
public sealed record InitiativeEntry {
    public ICombatant? Combatant { get; set; }  // Can be null
}

if (entry.Combatant == null)
    skip();  // Tombstone
```

| Aspect            | Evaluation                     |
| ----------------- | ------------------------------ |
| State Consistency | ⚠️ Nullability adds complexity |
| Cognitive Load    | ❌ Null checking throughout    |
| Restoration       | ⚠️ Possible but messy          |
| Memory            | ⚠️ Structure remains           |
| Implementation    | ❌ Null propagation            |

### Decision

**Option A: Immediate Removal**

### Rationale

1. **State Consistency**:
   - Invariant: `ActiveCombatants == CombatantsInInitiativeOrder`
   - Single source of truth
   - No logic to "skip" defeated combatants
2. **Clean Implementation**:

   ```csharp
   // No special cases
   var current = _initiativeOrder.GetCurrentCombatant();
   var action = current.GetAction();  // Current always active

   // vs. with skipping
   var current = _initiativeOrder.GetCurrentCombatant();
   while (current.State != Active) {  // What if all defeated?
       advance();
       current = ...;
   }
   ```

3. **Player Expectation**:
   - "X is defeated" → "X no longer acts" (natural)
   - Not: "X is here but we skip them" (confusing)

4. **Supports Round Victory Checks**:

   ```csharp
   // Clean: if party empty, combat ends
   var allDefeated = _initiativeOrder.IsEmpty;

   // vs. with skipping
   var allDefeated = _initiativeOrder
       .GetRemainingCombatants()
       .All(c => c.State != Active);  // Filter logic needed
   ```

### Cost/Benefit

**Benefits**:

- ✅ State consistency (one data structure)
- ✅ No skip logic needed
- ✅ Clean victory condition checks
- ✅ Simpler mental model

**Costs**:

- ❌ Can't resurrect if needed (use spell, item)
- ❌ Slightly harder to implement restoration

### Risks & Mitigation

**Risk**: "Resurrection" not supported if a spell brings combatant back

- **Mitigation**: Rare in combat (not in MVP)
- **Mitigation**: If needed: recreate CombatEncounter or rebuild initiative
- **Reference**: D&D 5e resurrections are out-of-combat mechanics typically

### Implementation Artifacts

```csharp
// ResolveTurn
public CombatTurnResult ResolveTurn(IActionExecutor executor)
{
    // ... resolve action ...

    if (currentCombatant.CurrentHealth <= 0)
    {
        currentCombatant.MarkDefeated();
        _initiativeOrder.RemoveCombatant(currentCombatant);  // ← Remove
    }

    // Check: if all active, combat ends
    // (InitiativeOrder.IsEmpty implies all defeated/fled)
    return AdvanceToNextTurnAndCheckEnd();
}
```

---

## Decision 5: Validation Point for Combat Start

### Context

When should invalid encounter configurations be detected? Immediately or at start?

### Options Considered

#### Option A: Fail at StartCombat() (CHOSEN)

- Allow pre-population of empty parties
- Validate only when `StartCombat()` called
- Explicit error with details

```csharp
public void StartCombat(InitiativeCalculator calculator)
{
    if (_playerParty.Count == 0 || _enemyParty.Count == 0)
        throw InvalidOperationException("Need at least 1 player and 1 enemy");
}
```

| Aspect          | Evaluation                     |
| --------------- | ------------------------------ |
| Flexibility     | ✅ Pre-populate scenarios      |
| Error Clarity   | ✅ Detailed message            |
| Early Detection | ❌ Not until start             |
| API Safety      | ⚠️ Add method doesn't validate |
| UI UX           | ✅ Clear error point           |

#### Option B: Validate at Add() Time

- Check invariants when combatant added
- Prevent invalid combinations

```csharp
public void AddPlayerCombatant(ICombatant combatant)
{
    _playerParty.Add(combatant);

    // If both parties now populated, could auto-start?
    if (_playerParty.Count > 0 && _enemyParty.Count > 0)
        TryStartAutomatically();  // No! User should control
}
```

| Aspect | Evaluation |
|--------|=========|
| Flexibility | ❌ Can't pre-build |
| Error Clarity | ⚠️ Depends on state |
| Early Detection | ✅ Immediate |
| API Safety | ❌ Modifies state on Add |
| UI UX | ❌ Implicit behavior |

#### Option C: Optional Validation (configurable)

- Allow `new CombatEncounter(validateAtStart: true/false)`
- Different modes for different scenarios

| Aspect | Evaluation |
|--------|=========|
| Flexibility | ✅ Max control |
| Error Clarity | ⚠️ Mode-dependent |
| Early Detection | ⚠️ Optional |
| API Safety | ❌ Complex |
| UI UX | ❌ Unexpected behavior |

#### Option D: Require 2+ Combatants at Creation

- Force constructor to validate minimum
- No invalid states possible

```csharp
public static CombatEncounter Create(
    ICombatant player1,
    IEnumerable<ICombatant> enemies)  // Requires at minimum
{
    // Always valid
}
```

| Aspect | Evaluation |
|--------|=========|
| Flexibility | ❌ No pre-population |
| Error Clarity | ✅ Early & explicit |
| Early Detection | ✅ At creation |
| API Safety | ✅ No invalid states |
| UI UX | ❌ Less fluid workflow |

### Decision

**Option A: Fail at StartCombat()**

### Rationale

1. **Flexibility for GMs**:
   - Common workflow: pre-build encounter spec, populate separately
   - Example: "Load adventure, create encounter, then populate from character sheet"
   - Forcing immediate validation blocks this pattern

2. **Explicit Error Point**:
   - Single method (`StartCombat()`) is the action boundary
   - Users expect validation when they "commit" to action
   - Clear cause-effect relationship

3. **Clear Error Messages**:

   ```csharp
   throw new InvalidOperationException(
       $"Invalid encounter: need at least 1 player and 1 enemy. " +
       $"Got {_playerParty.Count} players, {_enemyParty.Count} enemies.");
   ```

   - Specific numbers help debugging
   - Not: cryptic "invalid configuration"

4. **API Principle: Fail Fast**:
   - Don't allow invalid intermediate states
   - But validate at action boundaries, not property setters
   - Setters should be simple, action methods do validation

### Cost/Benefit

**Benefits**:

- ✅ Supports common GM workflow
- ✅ Clear error point
- ✅ Detailed error messages
- ✅ Standard API pattern

**Costs**:

- ❌ Can create invalid encounters (then fail)
- ❌ Slightly later detection than Option D

### Risks & Mitigation

**Risk**: User forgets to populate parties, calls StartCombat() and gets "need at least 1"

- **Mitigation**: Clear error message tells what's wrong
- **Mitigation**: API docs explain pre-population requirement
- **Mitigation**: UI guides users through correct sequence

### Implementation Artifacts

```csharp
public class CombatEncounter
{
    private List<ICombatant> _playerParty = new();
    private List<ICombatant> _enemyParty = new();

    public void AddPlayerCombatant(ICombatant combatant)
    {
        // No validation - allow any state
        _playerParty.Add(combatant);
    }

    public void StartCombat(InitiativeCalculator calculator)
    {
        // Validate here - explicit boundary
        if (_playerParty.Count == 0 || _enemyParty.Count == 0)
            throw new InvalidOperationException(
                $"Invalid encounter: got {_playerParty.Count} players, " +
                $"{_enemyParty.Count} enemies (need ≥1 each)");

        // ... proceed with combat start ...
    }
}
```

---

## Decision 6: Dice Engine Integration Method

### Context

How does initiative calculation use the existing DiceRoller?

### Options Considered

#### Option A: Direct "1d20" Expression (CHOSEN)

```csharp
var expression = _expressionParser.Parse("1d20");
var rollResult = _diceRoller.Roll(expression);
var d20Roll = rollResult.FinalTotal;  // 1-20
```

**Dependencies**: IDiceRoller, IDiceExpressionParser (already exist)

| Aspect | Evaluation |
|--------|=========|
| Leverages Existing | ✅ Uses proven engine |
| Integrates CryptoRNG | ✅ Cryptographic RNG |
| Simplicty | ✅ Straightforward |
| Separation of Concerns | ✅ Dice logic isolated |
| Future Flexibility | ✅ Easy to extend (advantage) |

#### Option B: Direct RNG (Bypass Dice Engine)

```csharp
using (var rng = RandomNumberGenerator.Create())
{
    var d20Roll = rng.Next(1, 21);  // Direct
}
```

**Dependencies**: RandomNumberGenerator only

| Aspect | Evaluation |
|--------|=========|
| Leverages Existing | ⚠️ Bypasses engine |
| Integrates CryptoRNG | ✅ Still secure |
| Simplicity | ✅ Direct call |
| Separation of Concerns | ❌ Duplicates RNG logic |
| Future Flexibility | ❌ Hard to support advantage |

#### Option C: New IDiceExpressionService.RollD20()

```csharp
var d20Roll = _diceService.RollD20();  // Convenience method
```

**Dependencies**: New service abstraction

| Aspect | Evaluation |
|--------|=========|
| Leverages Existing | ⚠️ New abstraction |
| Integrates CryptoRNG | ✅ Delegated |
| Simplicity | ✅ Single method |
| Separation of Concerns | ✅ Clear intent |
| Future Flexibility | ✅ Easy to enhance |

#### Option D: Inject RandomNumberGenerator Directly

```csharp
public InitiativeCalculator(RandomNumberGenerator rng)
{
    _rng = rng;
}

private int RollD20()
{
    Span<byte> buffer = stackalloc byte[4];
    _rng.GetBytes(buffer);
    var value = BitConverter.ToUInt32(buffer);
    return (int)(value % 20) + 1;
}
```

**Dependencies**: RandomNumberGenerator only

| Aspect | Evaluation |
|--------|=========|
| Leverages Existing | ❌ Implements own RNG logic |
| Integrates CryptoRNG | ✅ Uses cryptographic |
| Simplicity | ⚠️ Bit manipulation |
| Separation of Concerns | ❌ Duplicates DiceRoller logic |
| Future Flexibility | ❌ Tight coupling to RNG |

### Decision

**Option A: Direct "1d20" Expression**

### Rationale

1. **Single Source of Truth for Randomness**:
   - All rolls go through `DiceRoller`
   - Cryptographic RNG logic centralized
   - Enables future enhancements (logging, seeding, statistics)

2. **Validates Dice Engine**:

   ```
   DiceEngine:
   - DiceExpressionParser.Parse("1d20")
   - DiceRoller.Roll(expression)

   Initiative uses same codepath:
   - Validates parser handles "1d20"
   - Ensures RollResult contains proper data
   ```

3. **Future-Proofs Advanced Features**:
   - If supporting advantage on initiative (some D&D subclasses):

   ```csharp
   var expression = _expressionParser.Parse("1d20");
   expression.HasAdvantage = true;  // If supported later
   var result = _diceRoller.Roll(expression);  // Just works
   ```

4. **Minimal Coupling**:
   - Constructor depends on standard interfaces (IDiceRoller, IDiceExpressionParser)
   - No knowledge of RNG implementation
   - Easy to mock for testing

### Cost/Benefit

**Benefits**:

- ✅ Uses proven, tested dice infrastructure
- ✅ Single randomness source
- ✅ Validates dice engine end-to-end
- ✅ Future advantage support simple

**Costs**:

- ❌ Tiny overhead (parse overhead negligible at startup)
- ❌ Requires DiceExpressionParser (but should exist for combat anyway)

### Risks & Mitigation

**Risk**: DiceExpressionParser not available during init

- **Mitigation**: Parser is core service (like DiceRoller)
- **Mitigation**: If missing, DI will fail at startup (correct behavior)

**Risk**: "1d20" parsing fails

- **Mitigation**: Parser should handle "XdY" format perfectly
- **Mitigation**: Unit test this path: call InitiativeCalculator with mocked parser

### Implementation Artifacts

```csharp
public class InitiativeCalculator
{
    private readonly IDiceRoller _diceRoller;
    private readonly IDiceExpressionParser _parser;

    public InitiativeCalculator(
        IDiceRoller diceRoller,
        IDiceExpressionParser parser)
    {
        _diceRoller = diceRoller;
        _parser = parser;
    }

    private InitiativeEntry CalculateSingleInitiative(ICombatant combatant)
    {
        // Use existing parser
        var expression = _parser.Parse("1d20");

        // Use existing roller (cryptographic RNG)
        var rollResult = _diceRoller.Roll(expression);

        // Extract d20 result
        var d20Roll = rollResult.FinalTotal;

        // Create entry
        return InitiativeEntry.Create(d20Roll, combatant);
    }
}
```

---

## Decision 7: ICombatant Interface vs. Base Class

### Context

Should combatant contracts be defined as interfaces or abstract base classes?

### Options Considered

#### Option A: Interface (CHOSEN)

```csharp
public interface ICombatant
{
    Guid Id { get; }
    string Name { get; }
    int CurrentHealth { get; }
    // ...
    void TakeDamage(int amount);
}
```

| Aspect | Evaluation |
|--------|=========|
| Multiple Implementation | ✅ Player, Enemy, NPC easily |
| Flexibility | ✅ No base state inheritance |
| Testing | ✅ Mock easily |
| Polymorphism | ✅ Runtime dispatch |
| DDD | ✅ Clear contract |

#### Option B: Abstract Base Class

```csharp
public abstract class Combatant
{
    public abstract Guid Id { get; }
    protected virtual void TakeDamage(int amount) { ... }
}

public class PlayerCharacter : Combatant { ... }
public class Enemy : Combatant { ... }
```

| Aspect | Evaluation |
|--------|=========|
| Multiple Implementation | ❌ Single hierarchy |
| Flexibility | ⚠️ Shared implementation possible |
| Testing | ⚠️ Must subclass for tests |
| Polymorphism | ✅ Virtual methods |
| DDD | ⚠️ mixing domains |

#### Option C: Hybrid (Interface + Base)

```csharp
public interface ICombatant { ... }

public abstract class CombatantBase : ICombatant { ... }

public class PlayerCharacter : CombatantBase { ... }
public class Enemy : CombatantBase { ... }
```

| Aspect | Evaluation |
|--------|=========|
| Multiple Implementation | ✅ Via interface |
| Flexibility | ✅ Base + interface |
| Testing | ✅ Both paths available |
| Polymorphism | ✅ Both patterns |
| DDD | ⚠️ More complex |

### Decision

**Option A: Interface**

### Rationale

1. **Multiple Distinct Types**:
   - PlayerCharacter (from existing `Character` entity)
   - Enemy (new, AI-driven)
   - NPC (potential future)
   - All should be combat participants, but different aggregates

   ```csharp
   // Different domains:
   ICombatant combatant1 = playerCharacter;  // From Character aggregate
   ICombatant combatant2 = enemy;            // From Enemy aggregate

   // Both combat-compatible without shared base
   ```

2. **Minimal Contract**:
   - Combat only needs: health, AC, DEX, actions
   - Shouldn't constrain Character or Enemy design
   - Interface captures just the combat contract

3. **Testing Mocks**:

   ```csharp
   // Easy to create test doubles
   var mockCombatant = Substitute.For<ICombatant>();
   mockCombatant.CurrentHealth.Returns(10);
   mockCombatant.DexterityModifier.Returns(2);
   ```

4. **DDD Aggregate Independence**:
   - Character aggregate independent from combat system
   - Character implements ICombatant when needed
   - Character can change without affecting other combatants

### Cost/Benefit

**Benefits**:

- ✅ Minimal coupling to existing Character
- ✅ Easy to test (mock)
- ✅ Clear contract
- ✅ Flexible implementation

**Costs**:

- ❌ Duplicate implementation of common methods (TakeDamage, etc.)
- ❌ No shared base for shared logic

### Risks & Mitigation

**Risk**: Duplicate health/damage logic across Player/Enemy/NPC

- **Mitigation**: Extract helper class (HealthPool value object)
- **Mitigation**: Composition over inheritance pattern

**Risk**: Character entity coupling to ICombatant interface

- **Mitigation**: Adapter pattern if needed (unlikely)
- **Mitigation**: Character.cs implements interface naturally

### Implementation Artifacts

```csharp
// Domain/Entities/ICombatant.cs
public interface ICombatant
{
    Guid Id { get; }
    string Name { get; }
    int CurrentHealth { get; }
    int MaximumHealth { get; }
    // ... more properties ...
    void TakeDamage(int damageAmount);
}

// Domain/Entities/Character.cs (existing)
public class Character : /* ... */ , ICombatant
{
    // Existing Character logic
    public Guid Id { get; }
    public string Name { get; set; }
    public int CurrentHealth { get; private set; }

    // Combat methods
    public void TakeDamage(int damageAmount)
    {
        CurrentHealth = Math.Max(0, CurrentHealth - damageAmount);
    }
}

// Domain/Entities/Enemy.cs (new)
public class Enemy : ICombatant
{
    // Enemy-specific logic
    public Guid Id { get; }
    public int CurrentHealth { get; private set; }

    public void TakeDamage(int damageAmount)
    {
        CurrentHealth = Math.Max(0, CurrentHealth - damageAmount);
    }
}
```

---

## Summary: Cross-Decision Dependencies

```
┌─────────────────────────────────────────────┐
│ Decision 1: Roll Once at Start              │
│ └─→ Locks initiative order (immutable)      │
└────────────┬────────────────────────────────┘
             │
             ├─→ Depends on: Decision 3 (LinkedList for efficiency)
             │   Rationale: Need to track round same order again
             │
             └─→ Relates to: Decision 2 (Tiebreaker)
                 Interaction: Single roll means tiebreaker matters
```

```
Decision 2 (Tiebreaker)
├─→ Uses: Decision 6 (Dice Engine)
│   No: Tiebreaker uses DEX + Random, not RNG
│
└─→ Supports: Decision 7 (ICombatant interface)
    Need DexterityModifier property
```

```
Decision 3 (LinkedList)
├─→ Enables: Decision 4 (Immediate Removal)
│   O(1) removal crucial for linked list choice
│
└─→ Implements: Decision 1 (Round transitions)
    .Next pointer naturally supports "cycle to start"
```

**All decisions cohesively support Option A: Single-Roll Initiative System**

---

## Future Decisions (Out of Scope for MVP)

### A1: Advantage/Disadvantage on Initiative

- **Dependency**: Decision 6 (Dice Engine support needed)
- **Proposal**: `expression.HasAdvantage = true` → rolls twice
- **Decision Point**: When adding spell/ability support

### A2: Conditional Initiative Bonuses

- **Dependency**: Weapon/effect system design
- **Proposal**: Spells like "Haste" grant +X initiative
- **Decision Point**: When adding buff/debuff system

### A3: Resurrection Mid-Combat

- **Dependency**: Decision 4 (Immediate Removal)
- **Challenge**: Removed combatants not in order
- **Proposal**: Recreate InitiativeOrder or add back
- **Decision Point**: When adding resurrection mechanics

### A4: Initiative Delay/Retraction

- **Proposal**: Combatant can choose to act after someone else
- **Example**: "I hold my action"
- **Decision Point**: When implementing action economy

---

## Conclusion

These seven decisions form a coherent system where:

1. **Single-roll initiative** (Decision 1) provides fairness and determinism
2. **D&D-aligned tiebreakers** (Decision 2) match player expectations
3. **LinkedList data structure** (Decision 3) enables efficient operations
4. **Immediate removal** (Decision 4) keeps state consistent
5. **StartCombat validation** (Decision 5) supports common workflows
6. **Dice engine integration** (Decision 6) validates existing infrastructure
7. **Interface contracts** (Decision 7) maintain aggregate independence

Each decision is well-reasoned, explicitly documented, and defensible to stakeholders.
