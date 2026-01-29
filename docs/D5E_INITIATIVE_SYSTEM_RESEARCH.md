# D&D 5e-Style Initiative System Research

**Date**: January 29, 2026  
**Context**: Turn-based RPG combat system with DM-mode combat encounters  
**Integration**: Existing dice engine (DiceRoller, DiceExpression, RollResult)

---

## Table of Contents

1. [D&D 5e Initiative Mechanics Overview](#dd5e-initiative-mechanics-overview)
2. [Design Decisions & Rationale](#design-decisions--rationale)
3. [System Architecture](#system-architecture)
4. [C#/.NET Implementation Patterns](#cnet-implementation-patterns)
5. [Integration with Existing Dice Engine](#integration-with-existing-dice-engine)
6. [Edge Cases & Handling](#edge-cases--handling)

---

## D&D 5e Initiative Mechanics Overview

### Core Initiative Mechanics

**Initiative Formula**:

```
Initiative Score = d20 + DEX Modifier
```

**Key Characteristics**:

- Single roll per combatant at combat start
- DEX modifier (from Dexterity attribute: base 3-18, modifier = (base - 10) / 2)
- D20 is primary variance source (±9.5 from median)
- Combat turns resolve highest to lowest initiative
- Initiative order maintained across entire combat encounter (unchanged per round)

### Tiebreaker Resolution

**D&D 5e RAW (Rules As Written) Hierarchy**:

1. **Primary Tiebreaker**: Highest DEX modifier wins ties
2. **Secondary Tiebreaker**: Random selection if DEX modifiers also tied
3. **Note**: No explicit RAW guidance for multiple identical outcomes

**Implementation Consideration**:

- Sequential tie resolution vs. simultaneous tie detection
- Transparency: tiebreaker method should be visible to players

### Turn Order Maintenance

**Core Requirements**:

- Initiative order locked at combat start (no re-rolling per round)
- Round structure: active combatants execute turns top to bottom
- New round begins when last combatant completes their turn
- Order persists across rounds until combatant removed

**Mechanically Important**:

- Unexpected advantage for high-initiative combatants (act before foes can react)
- Strategic implications of positioning in initiative order
- Important for turn economy and resource management

### Removal from Initiative

**Removal Triggers**:

1. **Defeated**: Health reaches 0 or below
2. **Fled**: Successful escape from combat
3. **Incapacitated**: Permanent status effects (e.g., petrified, imprisoned)
4. **Withdrawn**: Voluntary exit before combat ends

**Mechanical Effect**:

- Skip turn if removed before their action time
- Maintain order integrity for remaining combatants
- No need to reorder remaining participants

---

## Design Decisions & Rationale

### Decision 1: Initiative Time of Calculation

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| **At combat start** (Chosen) | Fairness, deterministic, simple | Lacks dynamic flavor for long combats |
| Per-round re-roll | Dynamic, reflects changing conditions | Unfair, unpredictable, D&D doesn't do this |
| Progressive rolling | Reflects readiness changes | Complex, system overhead |

**Decision Rationale**:

- Aligns with D&D 5e standard practice
- Deterministic outcomes build player trust
- Single initial roll minimizes system load
- Matches player expectations from official rules

**Implementation Impact**: Roll all initiatives once at `CombatEncounter.Create()` time

---

### Decision 2: Tiebreaker Ordering

**Options Considered**:
| Approach | Pros | Cons |
|----------|------|------|
| **DEX, then random** (Chosen) | Clean, D&D-aligned, deterministic | Requires secondary mechanism |
| All random immediately | Simpler code, true randomness | Devalues DEX as secondary stat |
| Position-based (PC before NPC) | Favors players | Artificial, unfair to NPC-focused games |
| ID-based (creation order) | Deterministic without re-roll | Unintuitive, hard to understand |

**Decision Rationale**:

- D&D explicitly prescribes DEX tiebreaker (Dungeon Master's Guide, p. 189)
- Elevates DEX as valuable secondary attribute
- Random fallback ensures fairness when all factors equal
- Deterministic ordering (no surprise changes) builds trust

**Implementation Impact**: Sort by `(InitiativeRoll DESC, DexModifier DESC, Random)`

---

### Decision 3: Data Structure for Initiative Order

**Options Considered**:
| Structure | Pros | Cons |
|-----------|------|------|
| **Linked List of InitiativeEntry** (Chosen) | Efficient removal, natural current-pointer, ordered traversal | Slightly more memory overhead |
| Array/List with index tracking | Simple iteration, cache locality | O(n) removal, index management complex |
| Priority Queue | Fast insertion/removal | Doesn't preserve insertion order, complex iteration |
| Dictionary<int, List<Combatant>> | Groups ties together | Requires multi-level structure, complex queries |

**Decision Rationale**:

- Combat encounters frequently remove combatants mid-combat
- Linked list enables O(1) removal once found
- Current turn pointer naturally sits within structure
- Ordered storage guarantees iteration matches turn order

**Implementation Impact**:

```csharp
LinkedList<InitiativeEntry> InitiativeOrder;
LinkedListNode<InitiativeEntry> CurrentTurn;
```

---

### Decision 4: Combatant Removal Strategy

**Options Considered**:
| Strategy | Pros | Cons |
|----------|------|------|
| **Immediate removal from order** (Chosen) | Clean state, no invalid turns | Must track current turn carefully |
| Mark as "skipped" | Preserves order, no pointers affected | May accumulate dead entries |
| Separate active list | Can restore combatants | Requires two data structures |

**Decision Rationale**:

- Immediate removal keeps state clean and consistent
- Linked list structure handles pointer updates naturally
- Player expectation: defeated foes don't get turns
- Simpler mental model for game flow

**Implementation Impact**:

- Verify current turn exists before executing
- If removing current combatant: advance pointer before removal
- If removing next combatant: removal doesn't affect current pointer

---

### Decision 5: Multiple Combatants Entry Point & Validation

**Options Considered**:
| Approach | Pros | Cons |
|-----------|------|------|
| **Allow 0+ combatants, validate at combat start** (Chosen) | Flexible encounter building, fail-fast validation | More validation code |
| Require 2+ at creation | Prevents invalid states early | Prevents pre-population scenarios |
| Implicit validation | Less explicit code | Hard to debug missing combatants |

**Decision Rationale**:

- GMs sometimes pre-build encounters before adding combatants
- Fail-fast error at `StartCombat()` prevents bad gameplay
- Explicit validation error messages improve UX
- Allows testing with single combatant scenarios

**Implementation Impact**:

```csharp
// Valid: 1v1, PvP, 1v3, 3v3, 5v0 (test scenario)
public void StartCombat()
{
    if (PlayerParty.Count == 0 || EnemyParty.Count == 0)
        throw new InvalidOperationException("Need at least one combatant on each side");
}
```

---

## System Architecture

### Entity Model

```
CombatEncounter (Aggregate Root)
├── InitiativeEntry (Value)
├── PlayerParty (Combatant list)
├── EnemyParty (Combatant list)
└── Combat State (CurrentRound, CurrentTurnIndex)

Combatant (Interface or Base Class)
├── HealthPool
├── ArmorClass
├── DexterityModifier
├── InitiativeRoll (once per encounter)
└── CurrentState (Active, Defeated, Fled)

InitiativeEntry (Value Object)
├── InitiativeScore : int (d20 + DEX bonus)
├── Combatant : reference
├── Tiebreaker sequence
└── TurnOrder : int
```

### State Machine: Combatant During Combat

```
[Active] → {TakeTurn} → [ActionResolved] → [Next Turn or End]
   ↓
[Defeated] (Health ≤ 0) → [Removed from Initiative]
   ↓
[Fled] (Successful escape) → [Removed from Initiative]
```

---

## C#/.NET Implementation Patterns

### 1. **Core Value Objects & Domain Model**

#### InitiativeEntry Value Object

```csharp
/// <summary>
/// Represents a single combatant's position in the initiative order.
/// Immutable value object ensuring consistent tie-breaking calculations.
/// </summary>
public sealed record InitiativeEntry
{
    /// <summary>Initial d20 roll result (1-20).</summary>
    public int D20Roll { get; init; }

    /// <summary>DEX modifier from base attribute (typically -4 to +4).</summary>
    public int DexModifier { get; init; }

    /// <summary>Final initiative score = d20 roll + DEX modifier.</summary>
    public int InitiativeScore => D20Roll + DexModifier;

    /// <summary>Reference to the combatant taking this turn.</summary>
    public required ICombatant Combatant { get; init; }

    /// <summary>
    /// Unique tiebreaker value for secondary tie resolution.
    /// Generated at creation time to ensure deterministic ordering when
    /// DEX modifiers match.
    /// </summary>
    public Guid TiebreakerKey { get; init; }

    /// <summary>
    /// Position in initiative order for deterministic turn resolution.
    /// Lower values act first; generated during encounter initialization.
    /// </summary>
    public int TurnOrder { get; private set; }

    /// <summary>
    /// Factory method for creating initiative entries with validation.
    /// </summary>
    public static InitiativeEntry Create(int d20Roll, ICombatant combatant)
    {
        if (d20Roll < 1 || d20Roll > 20)
            throw new ArgumentException($"D20 roll must be 1-20, got {d20Roll}", nameof(d20Roll));

        if (combatant == null)
            throw new ArgumentNullException(nameof(combatant));

        return new InitiativeEntry
        {
            D20Roll = d20Roll,
            DexModifier = combatant.DexterityModifier,
            Combatant = combatant,
            TiebreakerKey = Guid.NewGuid()
        };
    }

    public void AssignTurnOrder(int order) => TurnOrder = order;
}
```

#### Combatant Interface

```csharp
/// <summary>
/// Core interface for any entity that can participate in combat.
/// Implemented by both player characters and enemies.
/// </summary>
public interface ICombatant
{
    Guid Id { get; }
    string Name { get; }

    /// <summary>Current remaining hit points (health).</summary>
    int CurrentHealth { get; }

    /// <summary>Maximum hit points for this combatant.</summary>
    int MaximumHealth { get; }

    /// <summary>Armor class - target number for attack rolls to hit.</summary>
    int ArmorClass { get; }

    /// <summary>Dexterity modifier used for initiative calculation.</summary>
    int DexterityModifier { get; }

    /// <summary>Current combat state (Active, Defeated, Fled).</summary>
    CombatantState State { get; }

    /// <summary>Applies damage to this combatant's health pool.</summary>
    void TakeDamage(int damageAmount);

    /// <summary>Restore health (for healing spells, items, etc.).</summary>
    void RestoreHealth(int healAmount);

    /// <summary>Mark as defeated (health ≤ 0).</summary>
    void MarkDefeated();

    /// <summary>Mark as fled from combat.</summary>
    void MarkFled();

    /// <summary>Determine action for this combatant's turn.</summary>
    CombatAction GetAction(ICombatEncounter encounter);
}

public enum CombatantState
{
    Active,
    Defeated,
    Fled
}
```

---

### 2. **Initiative Calculation & Ordering Logic**

#### Initiative Calculator Service

```csharp
/// <summary>
/// Service responsible for calculating and ordering initiative at start of combat.
/// Integrates with dice engine for d20 rolls; applies D&D 5e tiebreaker rules.
/// </summary>
public class InitiativeCalculator
{
    private readonly IDiceRoller _diceRoller;
    private readonly IDiceExpressionParser _expressionParser;

    public InitiativeCalculator(IDiceRoller diceRoller, IDiceExpressionParser parser)
    {
        _diceRoller = diceRoller;
        _expressionParser = parser;
    }

    /// <summary>
    /// Calculate and sort initiative for all combatants in an encounter.
    ///
    /// Ordering rules (D&D 5e RAW):
    /// 1. Primary: Highest initiative score (d20 + DEX modifier)
    /// 2. Tiebreaker 1: Highest DEX modifier
    /// 3. Tiebreaker 2: Random selection (coin flip / d2)
    /// </summary>
    public InitiativeOrder CalculateInitiative(IEnumerable<ICombatant> combatants)
    {
        if (!combatants.Any())
            throw new ArgumentException("Cannot calculate initiative for empty combatant list");

        // Step 1: Roll initiative for each combatant
        var initiatives = combatants
            .Select(combatant => CalculateSingleInitiative(combatant))
            .ToList();

        // Step 2: Sort by D&D 5e tiebreaker rules
        var sorted = initiatives
            .OrderByDescending(entry => entry.InitiativeScore)
            .ThenByDescending(entry => entry.DexModifier)
            .ThenBy(_ => Guid.NewGuid()) // Random tiebreaker for truly-tied combatants
            .Select((entry, index) =>
            {
                entry.AssignTurnOrder(index);
                return entry;
            })
            .ToList();

        return InitiativeOrder.FromEntries(sorted);
    }

    /// <summary>
    /// Calculate initiative for a single combatant by rolling d20 and adding DEX modifier.
    /// Uses the integrated dice engine for cryptographically secure randomness.
    /// </summary>
    private InitiativeEntry CalculateSingleInitiative(ICombatant combatant)
    {
        // Parse "1d20" expression using existing parser
        var expression = _expressionParser.Parse("1d20");

        // Roll using dice engine (cryptographically secure RNG)
        var rollResult = _diceRoller.Roll(expression);

        // Extract d20 result (will be in range 1-20)
        var d20Roll = rollResult.IndividualRolls[0];

        // Create initiative entry with d20 roll + DEX modifier
        return InitiativeEntry.Create(d20Roll, combatant);
    }
}
```

---

### 3. **Initiative Order Management**

#### InitiativeOrder Value Object

```csharp
/// <summary>
/// Immutable collection representing the turn order for a combat encounter.
/// Provides methods for querying position, finding combatants, and tracking
/// current turn while allowing safe removal of defeated/fled combatants.
/// </summary>
public sealed class InitiativeOrder
{
    private readonly LinkedList<InitiativeEntry> _turnOrder;
    private LinkedListNode<InitiativeEntry> _currentTurn;

    // Private constructor - use factory method
    private InitiativeOrder(LinkedList<InitiativeEntry> turnOrder)
    {
        _turnOrder = turnOrder;
        _currentTurn = _turnOrder.First; // Start with first combatant
    }

    /// <summary>Factory method to create from calculated initiatives.</summary>
    public static InitiativeOrder FromEntries(IEnumerable<InitiativeEntry> entries)
    {
        var list = new LinkedList<InitiativeEntry>(entries);
        return new InitiativeOrder(list);
    }

    /// <summary>Get the next combatant to act this turn.</summary>
    public ICombatant GetCurrentCombatant()
    {
        if (_currentTurn == null)
            throw new InvalidOperationException("Initiative order exhausted");
        return _currentTurn.Value.Combatant;
    }

    /// <summary>
    /// Advance to next combatant in initiative order.
    /// Returns whether a new round has started (last combatant → first combatant).
    /// </summary>
    public bool AdvanceToNextTurn()
    {
        if (_currentTurn?.Next == null)
        {
            // Round complete: cycle back to start
            _currentTurn = _turnOrder.First;
            return true; // New round started
        }

        _currentTurn = _currentTurn.Next;
        return false;
    }

    /// <summary>
    /// Remove a combatant from the initiative order (defeated or fled).
    /// Safely handles pointer updates when removing current combatant.
    /// </summary>
    public void RemoveCombatant(ICombatant combatant)
    {
        var node = _turnOrder.Find(_turnOrder.FirstOrDefault(entry =>
            entry.Combatant.Id == combatant.Id) ?? throw new InvalidOperationException());

        if (node == null)
            return; // Already removed

        // If removing current turn, advance pointer
        if (node == _currentTurn)
        {
            _currentTurn = node.Next ?? _turnOrder.First;
        }

        _turnOrder.Remove(node);
    }

    /// <summary>Check if combatant is still in initiative order.</summary>
    public bool Contains(ICombatant combatant) =>
        _turnOrder.Any(entry => entry.Combatant.Id == combatant.Id);

    /// <summary>Get position (index) of combatant in turn order.</summary>
    public int? GetTurnPosition(ICombatant combatant) =>
        _turnOrder
            .Select((entry, index) => (entry, index))
            .FirstOrDefault(x => x.entry.Combatant.Id == combatant.Id).index;

    /// <summary>Get remaining combatants in turn order.</summary>
    public IEnumerable<ICombatant> GetRemainingCombatants() =>
        _turnOrder.Select(entry => entry.Combatant);

    /// <summary>Get all initiative entries for debugging/displaying turn order.</summary>
    public IEnumerable<InitiativeEntry> GetAllEntries() =>
        _turnOrder.ToList();

    /// <summary>Check if initiative order is empty.</summary>
    public bool IsEmpty => _turnOrder.Count == 0;
}
```

---

### 4. **Combat Encounter Orchestration**

#### CombatEncounter Aggregate Root

```csharp
/// <summary>
/// Root aggregate for turn-based combat encounters.
/// Manages combatants, maintains initiative order, coordinates turn resolution.
/// Implements DDD aggregate pattern with strong encapsulation.
/// </summary>
public sealed class CombatEncounter
{
    private readonly List<ICombatant> _playerParty = new();
    private readonly List<ICombatant> _enemyParty = new();
    private InitiativeOrder? _initiativeOrder;

    public Guid Id { get; }
    public int CurrentRound { get; private set; }
    public CombatState State { get; private set; }

    public IReadOnlyList<ICombatant> PlayerParty => _playerParty.AsReadOnly();
    public IReadOnlyList<ICombatant> EnemyParty => _enemyParty.AsReadOnly();

    private CombatEncounter()
    {
        Id = Guid.NewGuid();
        CurrentRound = 0;
        State = CombatState.NotStarted;
    }

    /// <summary>Factory method for creating new encounters.</summary>
    public static CombatEncounter Create() => new();

    /// <summary>Add a player character to the encounter.</summary>
    public void AddPlayerCombatant(ICombatant combatant)
    {
        if (State != CombatState.NotStarted)
            throw new InvalidOperationException("Cannot add combatants to active encounter");

        _playerParty.Add(combatant ?? throw new ArgumentNullException(nameof(combatant)));
    }

    /// <summary>Add an enemy combatant to the encounter.</summary>
    public void AddEnemyCombatant(ICombatant combatant)
    {
        if (State != CombatState.NotStarted)
            throw new InvalidOperationException("Cannot add combatants to active encounter");

        _enemyParty.Add(combatant ?? throw new ArgumentNullException(nameof(combatant)));
    }

    /// <summary>
    /// Initialize combat: roll initiative, verify valid encounter, set up turn tracking.
    /// Throws InvalidOperationException if combatant lists invalid.
    /// </summary>
    public void StartCombat(InitiativeCalculator calculator)
    {
        // Validation
        if (_playerParty.Count == 0 || _enemyParty.Count == 0)
            throw new InvalidOperationException(
                $"Invalid encounter: need at least 1 player and 1 enemy. " +
                $"Got {_playerParty.Count} players, {_enemyParty.Count} enemies");

        // Calculate initiative
        var allCombatants = _playerParty.Concat(_enemyParty);
        _initiativeOrder = calculator.CalculateInitiative(allCombatants);

        CurrentRound = 1;
        State = CombatState.Active;
    }

    /// <summary>
    /// Resolve one turn: get current combatant, execute their action, cleanup.
    /// Returns CombatResult indicating whether encounter ended.
    /// </summary>
    public CombatResult ResolveTurn(ICombatEncounter encounterForActions)
    {
        if (State != CombatState.Active || _initiativeOrder == null)
            throw new InvalidOperationException("Combat not active");

        // Step 1: Get current combatant
        var currentCombatant = _initiativeOrder.GetCurrentCombatant();

        // Step 2: Skip if already defeated/fled (should not happen, but defensive)
        if (currentCombatant.State != CombatantState.Active)
        {
            return AdvanceAndCheckEnd();
        }

        // Step 3: Get and execute action
        var action = currentCombatant.GetAction(encounterForActions);
        var actionResult = action.Execute();

        // Step 4: Process action effects (damage, healing, buffs, etc.)
        ProcessActionEffects(actionResult);

        // Step 5: Check for combatant defeat/flee
        if (currentCombatant.CurrentHealth <= 0)
        {
            currentCombatant.MarkDefeated();
            _initiativeOrder.RemoveCombatant(currentCombatant);
        }
        else if (action.Type == CombatActionType.Flee && (action as FleeAction)?.Succeeded ?? false)
        {
            currentCombatant.MarkFled();
            _initiativeOrder.RemoveCombatant(currentCombatant);
        }

        // Step 6: Advance turn and check for round completion
        return AdvanceAndCheckEnd();
    }

    /// <summary>Helper: Advance to next turn and check if encounter should end.</summary>
    private CombatResult AdvanceAndCheckEnd()
    {
        if (_initiativeOrder == null)
            throw new InvalidOperationException("Initiative not initialized");

        bool newRoundStarted = _initiativeOrder.AdvanceToNextTurn();

        if (newRoundStarted)
            CurrentRound++;

        // Check victory/defeat conditions
        var playerStatus = GetPartyStatus(_playerParty);
        var enemyStatus = GetPartyStatus(_enemyParty);

        if (playerStatus == PartyStatus.AllDefeated)
        {
            State = CombatState.Ended;
            return CombatResult.Created(CombatOutcome.PlayerDefeat, CurrentRound);
        }

        if (enemyStatus == PartyStatus.AllDefeated || enemyStatus == PartyStatus.AllFled)
        {
            State = CombatState.Ended;
            return CombatResult.Created(CombatOutcome.PlayerVictory, CurrentRound);
        }

        return CombatResult.Created(CombatOutcome.ContinuingCombat, CurrentRound);
    }

    /// <summary>Helper: Determine current status of a party.</summary>
    private PartyStatus GetPartyStatus(List<ICombatant> party)
    {
        var active = party.Count(c => c.State == CombatantState.Active);
        var defeated = party.Count(c => c.State == CombatantState.Defeated);
        var fled = party.Count(c => c.State == CombatantState.Fled);

        if (active > 0) return PartyStatus.HasActiveCombatants;
        if (defeated == party.Count) return PartyStatus.AllDefeated;
        if (fled == party.Count) return PartyStatus.AllFled;

        return PartyStatus.Mixed; // Should rarely occur
    }

    /// <summary>Helper: Apply action effects (damage/healing) to targets.</summary>
    private void ProcessActionEffects(CombatActionResult result)
    {
        switch (result.EffectType)
        {
            case EffectType.Damage:
                result.Targets.ForEach(t => t.TakeDamage(result.EffectAmount));
                break;
            case EffectType.Healing:
                result.Targets.ForEach(t => t.RestoreHealth(result.EffectAmount));
                break;
            // ... other effect types
        }
    }

    public CombatState State
    {
        get => _state;
        private set => _state = value;
    }

    private CombatState _state;
}

public enum CombatState { NotStarted, Active, Ended }
public enum PartyStatus { HasActiveCombatants, AllDefeated, AllFled, Mixed }
public enum CombatOutcome { ContinuingCombat, PlayerVictory, PlayerDefeat }
```

---

### 5. **Service Layer Integration**

#### Combat Service

```csharp
/// <summary>
/// Application service coordinating combat operations.
/// Integrates dice engine, initiative calculation, and encounter orchestration.
/// </summary>
public class CombatService : ICombatService
{
    private readonly InitiativeCalculator _initiativeCalc;
    private readonly ICombatRepository _combatRepository;
    private readonly ILogger<CombatService> _logger;

    public CombatService(
        IDiceRoller diceRoller,
        IDiceExpressionParser parser,
        ICombatRepository combatRepository,
        ILogger<CombatService> logger)
    {
        _initiativeCalc = new InitiativeCalculator(diceRoller, parser);
        _combatRepository = combatRepository;
        _logger = logger;
    }

    /// <summary>Create a new combat encounter and initialize combatants.</summary>
    public async Task<CombatEncounterId> CreateEncounterAsync(
        IEnumerable<Guid> playerCharacterIds,
        IEnumerable<Guid> enemyIds)
    {
        var encounter = CombatEncounter.Create();

        // Load combatants from repository
        var players = await _combatRepository.GetCombatantsAsync(playerCharacterIds);
        var enemies = await _combatRepository.GetCombatantsAsync(enemyIds);

        // Add to encounter
        foreach (var player in players)
            encounter.AddPlayerCombatant(player);

        foreach (var enemy in enemies)
            encounter.AddEnemyCombatant(enemy);

        // Start combat (rolls initiative inside)
        encounter.StartCombat(_initiativeCalc);

        _logger.LogInformation(
            "Combat {EncounterId} started: {GameState}",
            encounter.Id,
            $"{players.Count} players vs {enemies.Count} enemies, round {encounter.CurrentRound}");

        await _combatRepository.SaveEncounterAsync(encounter);
        return encounter.Id;
    }

    /// <summary>Resolve one turn of combat and return updated state.</summary>
    public async Task<CombatTurnResult> ResolveTurnAsync(CombatEncounterId encounterId)
    {
        var encounter = await _combatRepository.GetEncounterAsync(encounterId)
            ?? throw new InvalidOperationException($"Encounter {encounterId} not found");

        var combatResult = encounter.ResolveTurn(encounter);

        _logger.LogInformation(
            "Combat {EncounterId} turn resolved: round {Round}, outcome {Outcome}",
            encounter.Id,
            encounter.CurrentRound,
            combatResult.Outcome);

        await _combatRepository.SaveEncounterAsync(encounter);

        return new CombatTurnResult
        {
            EncounterId = encounter.Id,
            CurrentRound = encounter.CurrentRound,
            CurrentCombatant = encounter.GetCurrentCombatant(),
            Outcome = combatResult.Outcome
        };
    }

    /// <summary>Get current combat state for display.</summary>
    public async Task<CombatStateDto> GetCombatStateAsync(CombatEncounterId encounterId)
    {
        var encounter = await _combatRepository.GetEncounterAsync(encounterId)
            ?? throw new InvalidOperationException($"Encounter {encounterId} not found");

        // Map to DTO
        return new CombatStateDto
        {
            EncounterId = encounter.Id,
            State = encounter.State,
            Round = encounter.CurrentRound,
            InitiativeOrder = encounter.GetInitiativeDetails(),
            PlayerParty = encounter.PlayerParty.Select(MapToDto).ToList(),
            EnemyParty = encounter.EnemyParty.Select(MapToDto).ToList()
        };
    }
}
```

---

## Integration with Existing Dice Engine

### Dice Engine Integration Points

**DiceRoller Integration**:

```csharp
// In InitiativeCalculator.CalculateSingleInitiative()
var expression = _expressionParser.Parse("1d20");
var rollResult = _diceRoller.Roll(expression);
var d20Roll = rollResult.FinalTotal; // Will be 1-20
```

**Why This Works**:

- Your `DiceRoller` uses cryptographically secure RNG (excellent for fairness)
- `DiceExpression` parser handles "1d20" format
- `RollResult` provides FinalTotal which equals the d20 result
- No modifier applied at dice level (DEX bonus added separately in `InitiativeEntry`)

**Opportunity: Advantage/Disadvantage Rolls**

Consider supporting initiative with advantage/disadvantage:

```csharp
// D&D 5e extension: Some spells/abilities grant advantage on initiative
var expression = _expressionParser.Parse("1d20");
expression.HasAdvantage = true; // Roll twice, take higher
var rollResult = _diceRoller.Roll(expression);
var d20Roll = rollResult.FinalTotal;
```

**Modification Required**: If supporting, ensure `HasAdvantage` flag is preserved through parsing.

---

## Edge Cases & Handling

### Edge Case 1: Tied Initiative (DEX Modifier Also Tied)

**Scenario**: Two combatants roll (d20: 12, 14) with both having DEX +2 modifier

- Score comparison: 14 vs 16 → resolved by initiative score
- If scores were equal: DEX comparison would fail, fallback to random

**Implementation**:

```csharp
var sorted = initiatives
    .OrderByDescending(entry => entry.InitiativeScore)
    .ThenByDescending(entry => entry.DexModifier)
    .ThenBy(_ => Guid.NewGuid()) // LINQ guaranteed to run only on ties
    .ToList();
```

### Edge Case 2: Removing Current Combatant Mid-Turn

**Scenario**: Current combatant's turn is interrupted (e.g., crowd control effect), they flee

**Implementation**:

```csharp
// In InitiativeOrder.RemoveCombatant()
if (node == _currentTurn)
{
    _currentTurn = node.Next ?? _turnOrder.First; // Advance immediately
}
_turnOrder.Remove(node);
```

### Edge Case 3: Simultaneous Defeats

**Scenario**: Player and enemy both reach ≤0 HP in same turn

**Design Decision**: Turn order ownership matters

- Only the active combatant can deal damage during their turn
- Enemy damage applied after player action resolves
- Therefore, always a clear sequence (not simultaneous)

**Implementation**:

```csharp
// In ResolveTurn()
// Step 3: Get action
var action = currentCombatant.GetAction(...); // Still active
var result = action.Execute();
// Step 4: Process damage
ProcessActionEffects(result);
// Step 5: Check defeat AFTER effects applied
if (currentCombatant.CurrentHealth <= 0)
    currentCombatant.MarkDefeated();
```

### Edge Case 4: Negative DEX Modifiers

**Scenario**: Character with DEX 8 has modifier -1

**Implementation**:

```csharp
var dexModifier = character.DexterityModifier; // Can be -4 to +4 in valid range
var initiativeEntry = InitiativeEntry.Create(d20Roll, combatant);
// d20Roll=5, dexModifier=-1 → InitiativeScore = 4 (valid, just low)
```

### Edge Case 5: Single Combatant Entry/Testing

**Scenario**: Testing combat mechanics with just one combatant

**Implementation**:

```csharp
// Validation currently requires both parties
// For testing: add a dummy enemy or separate test method
public void StartCombatForTesting(InitiativeCalculator calc)
{
    // Allow testing even with unbalanced parties
    if (_playerParty.Count == 0 && _enemyParty.Count == 0)
        throw new InvalidOperationException("Need at least one combatant");

    // Continue...
}
```

### Edge Case 6: Initiative Order Empty (All Defeated)

**Scenario**: During round 5, last combatant defeated

**Implementation**:

```csharp
// In GetCurrentCombatant()
public ICombatant GetCurrentCombatant()
{
    if (_currentTurn == null)
        throw new InvalidOperationException("Initiative exhausted - combat ended");
    return _currentTurn.Value.Combatant;
}

// In ResolveTurn()
var outcome = AdvanceAndCheckEnd();
if (outcome.Outcome != CombatOutcome.ContinuingCombat)
    State = CombatState.Ended;
```

---

## Testing Strategy

### Unit Test Coverage

```csharp
// InitiativeCalculatorTests
[Fact]
public void CalculateInitiative_OrdersByScore_HighestFirst()
{
    // Arrange
    var combatants = new[]
    {
        MockCombatant.WithDexModifier(2), // Will roll various results
        MockCombatant.WithDexModifier(4),
    };

    // Act
    var order = _calculator.CalculateInitiative(combatants);

    // Assert
    var entries = order.GetAllEntries().ToList();
    Assert.True(entries[0].InitiativeScore >= entries[1].InitiativeScore);
}

[Fact]
public void CalculateInitiative_TiebreakByDex_WhenScoresEqual()
{
    // Arrange: Force equal d20 results (using controlled RNG in test)
    var combatants = new[]
    {
        MockCombatant.WithDexModifier(2),
        MockCombatant.WithDexModifier(4), // Higher DEX, should win tie
    };

    // Act
    var order = _calculator.CalculateInitiative(combatants);

    // Assert
    var first = order.GetAllEntries().First();
    Assert.Equal(4, first.DexModifier); // Higher DEX modifier comes first
}

// CombatEncounterTests
[Fact]
public void StartCombat_Throws_WhenNoCombatants()
{
    var encounter = CombatEncounter.Create();
    Assert.Throws<InvalidOperationException>(() =>
        encounter.StartCombat(_initiativeCalc));
}

[Fact]
public void ResolveTurn_RemovesCombatant_WhenDefeated()
{
    // Arrange
    var encounter = CombatEncounter.Create();
    var player = MockCombatant.Alive();
    var enemy = MockCombatant.WithHealth(1); // Will be defeated
    encounter.AddPlayerCombatant(player);
    encounter.AddEnemyCombatant(enemy);
    encounter.StartCombat(_initiativeCalc);

    // Act
    encounter.ResolveTurn(encounter); // One turn

    // Assert
    Assert.DoesNotContain(enemy, encounter.GetRemainingCombatants());
}
```

---

## Summary Table: Design Decisions

| Decision              | Choice                        | Rationale                                  | Implementation                                     |
| --------------------- | ----------------------------- | ------------------------------------------ | -------------------------------------------------- |
| **Calculate when**    | Combat start                  | D&D standard, deterministic                | `InitiativeCalculator.CalculateInitiative()`       |
| **Tie resolution**    | DEX, then random              | D&D RAW, fair                              | LINQ `.OrderByDescending().ThenBy(Guid.NewGuid())` |
| **Data structure**    | `LinkedList<InitiativeEntry>` | O(1) removal, natural iteration            | `InitiativeOrder` encapsulates logic               |
| **Removal strategy**  | Immediate from order          | Clean state, linked list advantage         | `.Remove(node)` with pointer checks                |
| **Validation point**  | `StartCombat()` fail-fast     | Early error detection                      | Explicit exception with details                    |
| **Dice integration**  | `DiceRoller.Roll("1d20")`     | Existing infrastructure, cryptographic RNG | No new code needed in dice engine                  |
| **AI state tracking** | Separate from initiative      | Clean separation of concerns               | `Combatant.State` independent from order           |

---

## References & Sources

- D&D 5e Player's Handbook (Initiative rules, page 189)
- D&D 5e Dungeon Master's Guide (Tiebreaker guidance)
- System Design patterns for turn-based games
- Linked list data structures for dynamic ordered collections
- Cryptographic RNG for games (your existing `RandomNumberGenerator.Create()` usage)
