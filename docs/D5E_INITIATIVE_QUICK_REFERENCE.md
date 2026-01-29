# D&D 5e Initiative System - Quick Reference & Integration Guide

**Date**: January 29, 2026  
**Purpose**: Fast lookup reference for key concepts and integration steps  
**Best for**: During implementation and code review

---

## Quick Reference: Key Formulas & Rules

### Initiative Calculation

```
Initiative Score = d20 roll + DEX Modifier

Example:
- Goblin (DEX +1) rolls d20 → 12 → Initiative = 12 + 1 = 13
- Fighter (DEX +2) rolls d20 → 12 → Initiative = 12 + 2 = 14 ← Wins
```

### D&D 5e Tiebreaker (PHB 189)

```
If Initiative Scores equal:
  1. Compare DEX modifiers
     If still tied:
  2. Coin flip (random)

Example:
- Rogue (d20=10, DEX+3) = 13
- Monk (d20=10, DEX+3) = 13
- Both tied → Random determines order
```

### Combatant States

```
Active  → Takes turns, can act
  ↓
Defeated → Health ≤ 0, removed from initiative
  ↓
Fled    → Escaped combat, removed from initiative
```

### Round Structure

```
Round 1:
  Turn 1: Highest initiative combatant acts
  Turn 2: Next highest acts
  Turn 3: ...
  Last: Lowest initiative acts

Round 2 Begins:
  Turn 1: (Same as Round 1, order unchanged)
```

---

## Quick Reference: Core Data Structures

### InitiativeEntry (Immutable)

```csharp
// Created once per combatant at combat start
InitiativeEntry
├── D20Roll : int (1-20)
├── DexModifier : int (-4 to +4)
├── InitiativeScore : int (d20 + dex)  [Computed]
├── Combatant : ICombatant
├── TiebreakerKey : Guid (for random tiebreaks)
└── TurnOrder : int (0-based index after sorting)
```

### InitiativeOrder (Collection with State)

```csharp
// Manages the linked list and current turn pointer
InitiativeOrder
├── GetCurrentCombatant() : ICombatant
├── AdvanceToNextTurn() : bool (true = new round)
├── RemoveCombatant(ICombatant) : void
├── Contains(ICombatant) : bool
├── GetTurnPosition(ICombatant) : int?
├── GetRemainingCombatants() : IEnumerable
├── GetAllEntries() : IEnumerable
└── Count : int
```

### CombatEncounter (Aggregate Root)

```csharp
// Highest-level combat orchestrator
CombatEncounter
├── Id : Guid
├── CurrentRound : int
├── State : CombatState (NotStarted | Active | Ended)
├── PlayerParty : IReadOnlyList<ICombatant>
├── EnemyParty : IReadOnlyList<ICombatant>
├── InitiativeOrder : InitiativeOrder? (null until started)
├── AddPlayerCombatant(ICombatant) : void
├── AddEnemyCombatant(ICombatant) : void
├── StartCombat(InitiativeCalculator) : void
├── ResolveTurn(IActionExecutor) : CombatTurnResult
├── GetCurrentCombatant() : ICombatant?
└── GetInitiativeDetails() : IEnumerable<InitiativeEntry>
```

---

## Quick Reference: Key Algorithms

### Algorithm 1: Calculate Initiative (at StartCombat)

```
Input: List<ICombatant> combatants
Output: InitiativeOrder (sorted, with current turn = first)

Steps:
  1. For each combatant:
       a. Roll "1d20" using DiceRoller
       b. Extract d20 result (1-20)
       c. Create InitiativeEntry(d20, combatant)

  2. Sort all entries by:
       a. InitiativeScore DESC (highest first)
       b. DexModifier DESC (tiebreaker 1)
       c. TiebreakerKey ASC (tiebreaker 2, random)

  3. Assign TurnOrder to each (0, 1, 2, ...)

  4. Create InitiativeOrder from sorted list
       _currentTurn = first entry

  5. Return InitiativeOrder
```

### Algorithm 2: Resolve One Turn

```
Input: CombatencounterState, IActionExecutor
Output: CombatTurnResult(outcome, round)

Steps:
  1. Get current combatant from InitiativeOrder

  2. Verify combatant.State == Active
     (defensive, skip if defeated)

  3. Ask: action = combatant.GetAction(encounter)

  4. Execute: actionResult = action.Execute()

  5. Process effects:
       - If Damage: target.TakeDamage()
       - If Healing: target.RestoreHealth()
       - etc.

  6. Check defeat:
       - If combatant.Health ≤ 0:
           a. combatant.MarkDefeated()
           b. initiativeOrder.RemoveCombatant()
       - If combatant fled successfully:
           a. combatant.MarkFled()
           b. initiativeOrder.RemoveCombatant()

  7. Advance turn:
       - newRound = initiativeOrder.AdvanceToNextTurn()
       - If newRound: CurrentRound++

  8. Check victory:
       - If all players defeated → return PlayerDefeat
       - If all enemies defeated/fled → return PlayerVictory
       - Else → return ContinuingCombat

  9. Return CombatTurnResult
```

### Algorithm 3: Remove Combatant Safely

```
Input: CombatEncounter, ICombatant toRemove
Output: (none, modifies state)

// Inside InitiativeOrder.RemoveCombatant(combatant)

Steps:
  1. Find LinkedListNode for combatant
     (linear search, small n)

  2. If node == _currentTurn:
       a. If _currentTurn.Next exists:
            _currentTurn = _currentTurn.Next
          Else if _currentTurn.Previous exists:
            _currentTurn = _currentTurn.Previous
          Else:
            _currentTurn = null (last combatant)

  3. _turnOrder.Remove(node)  [O(1) operation]

  4. If _currentTurn now null:
       Encounter should check combat ended
```

---

## File Organization Checklist

### ✅ Step 1: Create Domain Entities

```
src/DiceEngine.Domain/Entities/
├── [ ] ICombatant.cs (Interface + enums)
│   └─ Exports: ICombatant, CombatantState
│              CombatAction, AttackAction, FleeAction
│              CombatActionType, CombatActionResult, EffectType
│              Weapon
│
├── [ ] InitiativeEntry.cs (Record value object)
│   └─ Exports: InitiativeEntry (sealed record)
│
└── [ ] CombatEncounter.cs (Aggregate root)
    └─ Exports: CombatEncounter
               CombatState, PartyStatus, CombatOutcome
               IActionExecutor, CombatTurnResult
```

### ✅ Step 2: Create Value Objects

```
src/DiceEngine.Domain/ValueObjects/
├── [ ] InitiativeOrder.cs (LinkedList wrapper)
    └─ Exports: InitiativeOrder (collection)
```

### ✅ Step 3: Create Application Services

```
src/DiceEngine.Application/Services/
├── [ ] InitiativeCalculator.cs
│   └─ Exports: InitiativeCalculator
│       Dependencies: IDiceRoller, IDiceExpressionParser
│
├── [ ] CombatService.cs
│   └─ Exports: CombatService, ICombatService
│       Dependencies: InitiativeCalculator, ICombatRepository, ILogger
│
└── [ ] (Keep existing: DiceRoller, DiceExpressionParser)
    └─ Already provide d20 rolls
```

### ✅ Step 4: Create DTOs

```
src/DiceEngine.Application/Models/
├── [ ] CombatStateDto.cs
│   └─ Exports: CombatStateDto, InitiativeEntryDto, CombatantStateDto
│
└── [ ] CombatTurnResultDto.cs (may be same file)
    └─ Exports: CombatTurnResultDto
```

### ✅ Step 5: Create Repositories

```
src/DiceEngine.Application/Repositories/
├── [ ] ICombatRepository.cs
    └─ Exports: ICombatRepository
       Methods: GetCombatantsAsync, GetEncounterAsync, SaveEncounterAsync
```

### ✅ Step 6: Create API Controllers

```
src/DiceEngine.API/Controllers/
├── [ ] CombatController.cs
    └─ Endpoints:
       POST /api/combats (create encounter)
       GET /api/combats/{id} (get state)
       POST /api/combats/{id}/turn (resolve turn)
```

### ✅ Step 7: Wire Dependency Injection

```
src/DiceEngine.API/Program.cs
├── [ ] Register InitiativeCalculator
│       services.AddScoped<InitiativeCalculator>();
│
├── [ ] Register CombatService
│       services.AddScoped<ICombatService, CombatService>();
│
└── [ ] Register ICombatRepository
        services.AddScoped<ICombatRepository, CombatRepository>();
```

---

## Testing Checklist

### Unit Tests: InitiativeCalculator

```
[ ] Test: Parses "1d20" correctly
[ ] Test: Rolls produce range 1-20
[ ] Test: D20 + DEX modifier = correct score
[ ] Test: Sorts by InitiativeScore DESC
[ ] Test: Tiebreaks by DexModifier DESC
[ ] Test: Tiebreaks randomly when fully tied
[ ] Test: Assigns TurnOrder 0, 1, 2, ...
[ ] Test: Handles empty combatant list (exception)
[ ] Test: Handles single combatant
[ ] Test: Works with 10+ combatants
```

### Unit Tests: InitiativeOrder

```
[ ] Test: GetCurrentCombatant returns first after creation
[ ] Test: AdvanceToNextTurn advances pointer
[ ] Test: AdvanceToNextTurn returns false in-round
[ ] Test: AdvanceToNextTurn returns true on new round
[ ] Test: AdvanceToNextTurn cycles back to first
[ ] Test: RemoveCombatant removes from list O(1)
[ ] Test: RemoveCombatant handles current-turn removal
[ ] Test: RemoveCombatant handles next-turn removal
[ ] Test: RemoveCombatant handles last-in-round removal
[ ] Test: Contains returns true for present combatants
[ ] Test: Contains returns false for removed combatants
[ ] Test: GetTurnPosition returns correct index
[ ] Test: GetRemainingCombatants returns in order
[ ] Test: IsEmpty reflects count
```

### Unit Tests: CombatEncounter

```
[ ] Test: Create returns NotStarted state
[ ] Test: AddPlayerCombatant adds to party
[ ] Test: AddEnemyCombatant adds to enemy party
[ ] Test: StartCombat fails when no players (exception)
[ ] Test: StartCombat fails when no enemies (exception)
[ ] Test: StartCombat transitions to Active
[ ] Test: StartCombat creates InitiativeOrder
[ ] Test: ResolveTurn fails when not active (exception)
[ ] Test: ResolveTurn removes defeated combatant
[ ] Test: ResolveTurn removes fled combatant
[ ] Test: ResolveTurn increments round on transition
[ ] Test: ResolveTurn returns PlayerVictory when enemies gone
[ ] Test: ResolveTurn returns PlayerDefeat when players gone
[ ] Test: ResolveTurn returns ContinuingCombat mid-battle
[ ] Test: GetCurrentCombatant returns active participant
```

### Integration Tests: Full Combat Loop

```
[ ] Test: Single player vs single enemy (basic)
[ ] Test: Player party vs enemy party (multiple combatants)
[ ] Test: Turn order maintained across 3+ rounds
[ ] Test: Defeated combatants skipped (not in order)
[ ] Test: D20 rolls vary (randomness)
[ ] Test: Combat ends with victor determined
[ ] Test: Initiative order displayed correctly
```

### Dice Engine Integration Tests

```
[ ] Test: DiceExpressionParser("1d20") parses correctly
[ ] Test: DiceRoller.Roll("1d20") produces 1-20
[ ] Test: Multiple rolls show variance (not all same)
[ ] Test: Cryptographic RNG used (no pattern detectable)
```

---

## Integration Workflow

### Phase 1: Create Core Domain Classes

1. Copy `ICombatant.cs` from implementation code
2. Copy `InitiativeEntry.cs`
3. Copy `CombatEncounter.cs`
4. Copy `InitiativeOrder.cs`
5. Verify: Classes compile, no external dependencies on application layer

### Phase 2: Create Application Services

1. Copy `InitiativeCalculator.cs`
2. Copy `CombatService.cs` and `ICombatService.cs`
3. Update dependency injection in Program.cs
4. Verify: Services registered and instantiate

### Phase 3: Create DTOs and Repositories

1. Copy `CombatStateDto.cs` and related DTOs
2. Create `ICombatRepository.cs` interface
3. Implement `CombatRepository.cs` using EF Core DbContext
4. Verify: Mapping from entities to DTOs works

### Phase 4: Create API Controller

1. Create `CombatController.cs` with:
   - `POST /api/combats` → CreateEncounterAsync
   - `GET /api/combats/{id}` → GetCombatStateAsync
   - `POST /api/combats/{id}/turn` → ResolveTurnAsync
2. Map DTO responses
3. Verify: Swagger shows endpoints

### Phase 5: End-to-End Testing

1. Create encounter via API
2. Verify initiative rolled
3. Resolve turns via API
4. Verify turn order maintained
5. Verify combat ends with victor

---

## Quick Troubleshooting

### "Initiative order empty" exception

- **Cause**: All combatants removed from initiative
- **Check**: CombatEncounter checked victory condition?
- **Fix**: Verify ResolveTurn() calls AdvanceAndCheckEnd()

### "Combatant not in initiative order"

- **Cause**: Tried to remove already-removed combatant
- **Check**: RemoveCombatant() called twice?
- **Fix**: Add guard in RemoveCombatant: `if (node == null) return;`

### "D20 roll out of range"

- **Cause**: DiceRoller returned value outside 1-20
- **Check**: DiceExpressionParser handling "1d20" correctly?
- **Fix**: Test parser independently: `Parse("1d20").DiceRolls[0].SidesPerDie == 20`

### "Current turn is null"

- **Cause**: Tried to GetCurrentCombatant() on empty order
- **Check**: Combat in Active state but initiative empty?
- **Fix**: Add state check before GetCurrentCombatant()

### "Combatant health negative after heal"

- **Cause**: RestoreHealth doesn't cap at maximum
- **Check**: ICombatant.RestoreHealth implementation
- **Fix**: `CurrentHealth = Math.Min(MaximumHealth, CurrentHealth + healAmount);`

---

## Performance Baselines

**Goal**: Combat encounters resolve with <100ms latency per turn

| Operation                           | Time  | Notes               |
| ----------------------------------- | ----- | ------------------- |
| Roll 1d20 (DiceRoller)              | <1ms  | Crypto RNG          |
| Calculate initiative (6 combatants) | <5ms  | 6 rolls + sort      |
| Resolve one turn                    | <10ms | No I/O              |
| Remove combatant from order         | <1ms  | LinkedList O(1)     |
| Full round (6 combatants)           | <60ms | 6 × 10ms + overhead |

**Bottlenecks to Watch**:

- DB queries (persist after each turn) → Use transactions
- Serialization (DTO mapping) → Cache mappers
- Dice expression parsing (per turn?) → Parse once at start

---

## Monitoring & Logging

### Key Log Points in InitiativeCalculator

```csharp
_logger.LogInformation(
    "Initiative calculated for {CombatantCount} combatants in {ElapsedMs}ms",
    combatants.Count,
    stopwatch.ElapsedMilliseconds);

_logger.LogDebug(
    "Initiative entry: {Combatant} score={Score} (d20={D20}, dex={Dex})",
    entry.Combatant.Name,
    entry.InitiativeScore,
    entry.D20Roll,
    entry.DexModifier);
```

### Key Log Points in CombatEncounter

```csharp
_logger.LogInformation(
    "Combat {EncounterId} started: {PlayerCount} vs {EnemyCount} at round {Round}",
    encounter.Id,
    encounter.PlayerParty.Count,
    encounter.EnemyParty.Count,
    encounter.CurrentRound);

_logger.LogInformation(
    "Combat {EncounterId} turn resolved: {CurrentCombatant} action={Action} " +
    "outcome={Outcome}",
    encounter.Id,
    currentCombatant.Name,
    action.Type,
    result.Outcome);
```

---

## Future Enhancements (Post-MVP)

1. **Advantage/Disadvantage Rolls**
   - Modify DiceExpressionParser to support flag
   - DiceRoller already implements advantage logic
   - InitiativeCalculator.CalculateSingleInitiative passes through flag

2. **Conditional Initiative Modifiers**
   - Add effect system for +X initiative from spells
   - Apply bonus in CalculateSingleInitiative: `d20 + dexMod + effectBonus`

3. **Round-Based Ability Recharge**
   - Track which combatants can use limited resources
   - Recharge at new round boundary (newRound == true)

4. **Combat AI Difficulty Levels**
   - Different IActionExecutor implementations
   - Easy: random attacks
   - Hard: target lowest AC, prioritize dangerous foes
   - Legendary: multiple actions per unique turn

5. **Condition Tracking**
   - Add CombatantCondition enum (stunned, grappled, etc.)
   - Conditions prevent certain actions
   - Remove at end of turn or duration

---

## References in Repository

- **Spec**: `specs/005-combat-system/spec.md`
- **Existing Dice Engine**: `src/DiceEngine.Application/Services/DiceRoller.cs`
- **Character Entity**: `src/DiceEngine.Domain/Entities/Character.cs`
- **D&D 5e PHB**: Pages 189-191 (initiative, action economy)
- **D&D 5e DMG**: Pages 270-273 (encounter building)

---

## Contact & Questions

If decisions conflict with project goals or constraints:

1. Review **D5E_INITIATIVE_DESIGN_DECISIONS.md** for rationale
2. Check alternative options in decision sections
3. Propose modification with new tradeoff analysis
4. Document as new decision with context
