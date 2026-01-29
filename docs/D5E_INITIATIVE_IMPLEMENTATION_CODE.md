# D&D 5e Initiative System - Implementation Code Examples

**Date**: January 29, 2026  
**Purpose**: Ready-to-use code templates for implementing initiative system in DiceEngine  
**Target Location**: `src/DiceEngine.Domain` and `src/DiceEngine.Application`

---

## File Layout & Integration Map

```
DiceEngine.Domain/
├── Entities/
│   ├── CombatEncounter.cs (NEW - Aggregate root)
│   ├── Combatant.cs or ICombatant.cs (NEW - Interface for participants)
│   ├── InitiativeEntry.cs (NEW - Value object)
│   └── Action*.cs (NEW - Attack, Flee, Defend actions)
│
└── ValueObjects/
    ├── InitiativeOrder.cs (NEW - Ordering logic)
    └── CombatAction.cs (NEW - Action types)

DiceEngine.Application/
├── Services/
│   ├── InitiativeCalculator.cs (NEW - Dice integration)
│   ├── CombatService.cs (NEW - Orchestration)
│   └── ICombatService.cs (NEW - Service interface)
│
├── Models/
│   ├── CombatStateDto.cs (NEW - API response models)
│   ├── CombatTurnResultDto.cs (NEW)
│   └── InitiativeEntryDto.cs (NEW)
│
└── Repositories/
    └── ICombatRepository.cs (NEW - Combat persistence)
```

---

## Implementation Files: Ready to Use

### 1. Domain/Entities/ICombatant.cs

```csharp
using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Core interface for any entity participating in turn-based combat.
/// Implemented by player characters, enemies, and NPCs.
/// </summary>
public interface ICombatant
{
    /// <summary>Unique identifier for this combatant.</summary>
    Guid Id { get; }

    /// <summary>Display name for this combatant.</summary>
    string Name { get; }

    /// <summary>Current remaining hit points. 0 or negative means defeated.</summary>
    int CurrentHealth { get; }

    /// <summary>Maximum hit points for this combatant.</summary>
    int MaximumHealth { get; }

    /// <summary>Armor class - minimum attack roll needed to hit this combatant.</summary>
    int ArmorClass { get; }

    /// <summary>DEX modifier used for initiative calculation (initiative = d20 + this).</summary>
    int DexterityModifier { get; }

    /// <summary>Current state in combat: Active, Defeated, or Fled.</summary>
    CombatantState State { get; }

    /// <summary>Primary weapon or equipment for this combatant (if applicable).</summary>
    Weapon? EquippedWeapon { get; }

    /// <summary>Reduce this combatant's health by damageAmount.</summary>
    void TakeDamage(int damageAmount);

    /// <summary>Increase this combatant's health by healAmount (capped at maximum).</summary>
    void RestoreHealth(int healAmount);

    /// <summary>Mark this combatant as defeated (health ≤ 0).</summary>
    void MarkDefeated();

    /// <summary>Mark this combatant as fled from combat.</summary>
    void MarkFled();

    /// <summary>Determine what action this combatant takes during their turn.</summary>
    CombatAction GetAction(ICombatEncounter encounter);
}

/// <summary>State of a combatant during/after combat.</summary>
public enum CombatantState
{
    Active = 0,   // Can take turns
    Defeated = 1, // Health ≤ 0, no longer acts
    Fled = 2      // Successfully escaped combat
}

/// <summary>Represents a weapon or damage source for a combatant.</summary>
public sealed record Weapon(
    string Name,
    string DamageDiceExpression, // e.g., "1d8", "2d6+2"
    int AttackModifier = 0        // Bonus to hit from this weapon
);

/// <summary>Interface for accessing combat encounter state (used in GetAction).</summary>
public interface ICombatEncounter
{
    IReadOnlyList<ICombatant> PlayerParty { get; }
    IReadOnlyList<ICombatant> EnemyParty { get; }
    ICombatant? GetCurrentCombatant();
}

/// <summary>Action a combatant takes during their turn.</summary>
public abstract record CombatAction(ICombatant Actor)
{
    public abstract CombatActionType Type { get; }
    public abstract CombatActionResult Execute();
}

public enum CombatActionType
{
    Attack,
    Defend,
    Flee,
    Cast,
    UseItem,
    Skip
}

public sealed record AttackAction(
    ICombatant Attacker,
    ICombatant Defender,
    int AttackRoll,
    int Damage) : CombatAction(Attacker)
{
    public override CombatActionType Type => CombatActionType.Attack;
    public override CombatActionResult Execute() => new CombatActionResult(
        EffectType: EffectType.Damage,
        EffectAmount: Damage,
        Targets: new List<ICombatant> { Defender },
        Success: AttackRoll >= Defender.ArmorClass
    );
}

public sealed record FleeAction(
    ICombatant Actor,
    bool Succeeded) : CombatAction(Actor)
{
    public override CombatActionType Type => CombatActionType.Flee;
    public override CombatActionResult Execute() =>
        new CombatActionResult(
            EffectType: EffectType.Flee,
            EffectAmount: 0,
            Targets: new List<ICombatant> { Actor },
            Success: Succeeded
        );
}

public record CombatActionResult(
    EffectType EffectType,
    int EffectAmount,
    IList<ICombatant> Targets,
    bool Success
);

public enum EffectType
{
    Damage,
    Healing,
    Flee,
    Control,
    None
}
```

---

### 2. Domain/Entities/InitiativeEntry.cs

```csharp
using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Immutable value object representing one combatant's position in initiative order.
/// Stores the d20 roll, DEX modifier, and calculated initiative score.
/// Two InitiativeEntry objects are compared by InitiativeScore (descending),
/// then DexModifier (descending), then TiebreakerKey (random).
/// </summary>
public sealed record InitiativeEntry
{
    /// <summary>Result of the d20 roll for initiative (1-20).</summary>
    public int D20Roll { get; init; }

    /// <summary>Combatant's DEX modifier, included in initiative calculation.</summary>
    public int DexModifier { get; init; }

    /// <summary>Final initiative score = d20 roll + DEX modifier.</summary>
    public int InitiativeScore => D20Roll + DexModifier;

    /// <summary>Reference to the combatant with this initiative entry.</summary>
    public required ICombatant Combatant { get; init; }

    /// <summary>
    /// Unique value for pseudo-random tiebreaking when both InitiativeScore
    /// and DexModifier are equal. Assigned at creation time for determinism.
    /// </summary>
    public Guid TiebreakerKey { get; init; }

    /// <summary>
    /// Final position in turn order (0-based index).
    /// Assigned after sorting and never changes during combat.
    /// </summary>
    public int TurnOrder { get; private set; }

    /// <summary>
    /// Factory method to create an InitiativeEntry with validation.
    /// </summary>
    /// <param name="d20Roll">
    /// Result of rolling d20. Must be between 1 and 20 inclusive.
    /// </param>
    /// <param name="combatant">The combatant to add to initiative.</param>
    /// <returns>New InitiativeEntry, ready to be sorted.</returns>
    /// <exception cref="ArgumentException">
    /// Thrown if d20Roll is outside 1-20 range.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// Thrown if combatant is null.
    /// </exception>
    public static InitiativeEntry Create(int d20Roll, ICombatant combatant)
    {
        if (d20Roll < 1 || d20Roll > 20)
            throw new ArgumentException(
                $"D20 roll must be between 1 and 20, received {d20Roll}",
                nameof(d20Roll));

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

    /// <summary>
    /// Assign the final position in turn order.
    /// Called during InitiativeOrder initialization after sorting.
    /// </summary>
    public void AssignTurnOrder(int order)
    {
        if (order < 0)
            throw new ArgumentException("Turn order must be >= 0", nameof(order));
        TurnOrder = order;
    }

    public override string ToString() =>
        $"{Combatant.Name}: {InitiativeScore} (d20:{D20Roll}, DEX:{DexModifier:+#;-#;0})";
}
```

---

### 3. Domain/ValueObjects/InitiativeOrder.cs

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Immutable collection representing the complete turn order for a combat encounter.
/// Provides methods for querying combatant positions, managing current turn pointer,
/// and safely removing defeated/fled combatants.
///
/// Uses LinkedList internally for O(1) removal; exposes methods that hide this detail.
/// </summary>
public sealed class InitiativeOrder
{
    private readonly LinkedList<InitiativeEntry> _turnOrder;
    private LinkedListNode<InitiativeEntry>? _currentTurn;

    /// <summary>Private constructor - use FromEntries factory method.</summary>
    private InitiativeOrder(LinkedList<InitiativeEntry> turnOrder)
    {
        _turnOrder = turnOrder ?? throw new ArgumentNullException(nameof(turnOrder));
        _currentTurn = _turnOrder.First;
    }

    /// <summary>
    /// Factory method to create InitiativeOrder from sorted InitiativeEntry objects.
    /// Call this after InitiativeCalculator has sorted the entries.
    /// </summary>
    /// <param name="entries">Already-sorted entries from InitiativeCalculator.</param>
    /// <returns>New InitiativeOrder ready for use in CombatEncounter.</returns>
    /// <exception cref="ArgumentException">Thrown if entries is empty.</exception>
    public static InitiativeOrder FromEntries(IEnumerable<InitiativeEntry> entries)
    {
        var entryList = entries?.ToList() ?? new List<InitiativeEntry>();

        if (entryList.Count == 0)
            throw new ArgumentException("Cannot create InitiativeOrder with no entries", nameof(entries));

        var linked = new LinkedList<InitiativeEntry>(entryList);
        return new InitiativeOrder(linked);
    }

    /// <summary>
    /// Get the combatant whose turn it currently is.
    /// Throws if initiative order is empty (all combatants removed).
    /// </summary>
    public ICombatant GetCurrentCombatant()
    {
        if (_currentTurn == null)
            throw new InvalidOperationException("Initiative order is empty - combat has ended");

        return _currentTurn.Value.Combatant;
    }

    /// <summary>
    /// Get the full InitiativeEntry for current combatant (includes d20 roll, scores, etc).
    /// </summary>
    public InitiativeEntry GetCurrentEntry()
    {
        if (_currentTurn == null)
            throw new InvalidOperationException("Initiative order is empty - combat has ended");

        return _currentTurn.Value;
    }

    /// <summary>
    /// Advance to the next combatant in initiative order.
    /// When the last combatant is reached and advanced, cycles back to the first.
    /// </summary>
    /// <returns>
    /// True if a new round has started (last → first combatant).
    /// False if advancing within the current round.
    /// </returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if called when initiative is empty.
    /// </exception>
    public bool AdvanceToNextTurn()
    {
        if (_currentTurn == null)
            throw new InvalidOperationException("Cannot advance on empty initiative order");

        // Check if we're at the last combatant
        if (_currentTurn.Next == null)
        {
            // Cycle back to start (new round)
            _currentTurn = _turnOrder.First;
            return true; // New round started
        }

        // Move to next
        _currentTurn = _currentTurn.Next;
        return false; // Still in current round
    }

    /// <summary>
    /// Remove a combatant from the initiative order.
    /// Safe to call even if the combatant is the current turn - pointer updates automatically.
    /// Typically called when a combatant is defeated or flees.
    /// </summary>
    /// <param name="combatant">The combatant to remove.</param>
    /// <exception cref="ArgumentNullException">Thrown if combatant is null.</exception>
    public void RemoveCombatant(ICombatant combatant)
    {
        if (combatant == null)
            throw new ArgumentNullException(nameof(combatant));

        // Find the node for this combatant
        var node = _turnOrder.FirstOrDefault(entry =>
            entry.Combatant.Id == combatant.Id);

        if (node == null)
            return; // Already removed or was never in initiative order

        // Special handling: if removing current turn, advance pointer first
        if (node == _currentTurn)
        {
            if (_currentTurn.Next != null)
            {
                _currentTurn = _currentTurn.Next; // Move to next
            }
            else if (_currentTurn.Previous != null)
            {
                _currentTurn = _currentTurn.Previous; // Move back if no next
            }
            else
            {
                _currentTurn = null; // Only combatant, now empty
            }
        }

        // Remove the node
        _turnOrder.Remove(node);
    }

    /// <summary>Check if a combatant is still in the initiative order (active in combat).</summary>
    public bool Contains(ICombatant combatant) =>
        _turnOrder.Any(entry => entry.Combatant.Id == combatant.Id);

    /// <summary>
    /// Get the current position (0-based index) of a combatant in turn order.
    /// Returns null if combatant not found.
    /// </summary>
    public int? GetTurnPosition(ICombatant combatant)
    {
        var enumerable = _turnOrder
            .Select((entry, index) => (entry, index))
            .FirstOrDefault(x => x.entry.Combatant.Id == combatant.Id);

        return enumerable.index >= 0 ? enumerable.index : null;
    }

    /// <summary>Get list of remaining active combatants in turn order.</summary>
    public IEnumerable<ICombatant> GetRemainingCombatants() =>
        _turnOrder.Select(entry => entry.Combatant);

    /// <summary>Get all InitiativeEntry objects for display/debugging (e.g., show turn order to player).</summary>
    public IEnumerable<InitiativeEntry> GetAllEntries() =>
        _turnOrder.ToList();

    /// <summary>Count of combatants still in the encounter.</summary>
    public int Count => _turnOrder.Count;

    /// <summary>Check if no combatants remain (combat has ended).</summary>
    public bool IsEmpty => _turnOrder.Count == 0;

    /// <summary>Get detailed string representation for logging/debugging.</summary>
    public override string ToString()
    {
        if (_turnOrder.Count == 0)
            return "[Initiative Order Empty]";

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("[Turn Order]");
        var index = 0;
        foreach (var entry in _turnOrder)
        {
            var current = entry == _currentTurn?.Value ? " ← CURRENT" : "";
            sb.AppendLine($"  {index}: {entry}{current}");
            index++;
        }

        return sb.ToString();
    }
}
```

---

### 4. Application/Services/InitiativeCalculator.cs

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

/// <summary>
/// Calculates and orders initiative for all combatants at the start of combat.
/// Integrates with the DiceRoller to perform d20 rolls using cryptographically
/// secure randomness. Implements D&D 5e RAW tiebreaker rules.
/// </summary>
public class InitiativeCalculator
{
    private readonly IDiceRoller _diceRoller;
    private readonly IDiceExpressionParser _expressionParser;

    public InitiativeCalculator(
        IDiceRoller diceRoller,
        IDiceExpressionParser expressionParser)
    {
        _diceRoller = diceRoller ?? throw new ArgumentNullException(nameof(diceRoller));
        _expressionParser = expressionParser ?? throw new ArgumentNullException(nameof(expressionParser));
    }

    /// <summary>
    /// Calculate and order initiative for all combatants in an encounter.
    ///
    /// Process:
    /// 1. Roll d20 for each combatant using DiceRoller
    /// 2. Add combatant's DEX modifier to each roll
    /// 3. Sort by:
    ///    a. Highest InitiativeScore (d20 + DEX)
    ///    b. Highest DexModifier (tiebreaker 1)
    ///    c. Random Guid (tiebreaker 2 for fully tied combatants)
    /// 4. Assign turn order (0-based index)
    /// 5. Return InitiativeOrder ready for CombatEncounter
    /// </summary>
    /// <param name="combatants">All participants in the combat.</param>
    /// <returns>InitiativeOrder object with turn sequence locked in.</returns>
    /// <exception cref="ArgumentException">Thrown if combatants list is empty.</exception>
    public InitiativeOrder CalculateInitiative(IEnumerable<ICombatant> combatants)
    {
        var combatantList = combatants?.ToList() ?? new List<ICombatant>();

        if (combatantList.Count == 0)
            throw new ArgumentException(
                "Cannot calculate initiative for empty combatant list",
                nameof(combatants));

        // Step 1 & 2: Roll initiative for each combatant
        var initiatives = combatantList
            .Select(combatant => CalculateSingleInitiative(combatant))
            .ToList();

        // Step 3: Sort by D&D 5e rules
        var sorted = initiatives
            .OrderByDescending(entry => entry.InitiativeScore)        // Primary: highest score
            .ThenByDescending(entry => entry.DexModifier)             // Tiebreaker 1: highest DEX
            .ThenBy(entry => entry.TiebreakerKey)                      // Tiebreaker 2: random (GUID)
            .Select((entry, index) =>
            {
                entry.AssignTurnOrder(index);
                return entry;
            })
            .ToList();

        // Step 5: Return InitiativeOrder
        return InitiativeOrder.FromEntries(sorted);
    }

    /// <summary>
    /// Calculate initiative for a single combatant.
    /// Uses DiceRoller to roll "1d20" with cryptographic RNG.
    /// </summary>
    private InitiativeEntry CalculateSingleInitiative(ICombatant combatant)
    {
        // Parse "1d20" using existing expression parser
        var expression = _expressionParser.Parse("1d20")
            ?? throw new InvalidOperationException("Failed to parse '1d20' expression");

        // Roll using DiceRoller (uses system's RandomNumberGenerator)
        var rollResult = _diceRoller.Roll(expression);

        // Extract the d20 result (should be single roll, 1-20)
        var d20Roll = rollResult.FinalTotal;

        if (d20Roll < 1 || d20Roll > 20)
            throw new InvalidOperationException(
                $"D20 roll result out of range: {d20Roll}");

        // Create initiative entry
        return InitiativeEntry.Create(d20Roll, combatant);
    }
}
```

---

### 5. Domain/Entities/CombatEncounter.cs

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Root aggregate for turn-based combat encounters.
/// Manages participating combatants, maintains initiative order,
/// orchestrates turn resolution, and tracks combat progression.
///
/// Lifecycle:
/// 1. Create encounter with Create()
/// 2. Add combatants with AddPlayerCombatant/AddEnemyCombatant
/// 3. Start combat with StartCombat() - rolls initiative
/// 4. Resolve turns with ResolveTurn() until CombatOutcome != ContinuingCombat
/// 5. Combat ends when victor is determined
/// </summary>
public sealed class CombatEncounter
{
    private readonly List<ICombatant> _playerParty = new();
    private readonly List<ICombatant> _enemyParty = new();
    private InitiativeOrder? _initiativeOrder;
    private CombatState _state = CombatState.NotStarted;

    public Guid Id { get; }
    public int CurrentRound { get; private set; }
    public CombatState State => _state;

    public IReadOnlyList<ICombatant> PlayerParty => _playerParty.AsReadOnly();
    public IReadOnlyList<ICombatant> EnemyParty => _enemyParty.AsReadOnly();

    /// <summary>The current InitiativeOrder (null until combat started).</summary>
    public InitiativeOrder? InitiativeOrder => _initiativeOrder;

    private CombatEncounter()
    {
        Id = Guid.NewGuid();
        CurrentRound = 0;
    }

    /// <summary>Factory method to create a new combat encounter in NotStarted state.</summary>
    public static CombatEncounter Create() => new();

    /// <summary>
    /// Add a player character combatant to this encounter.
    /// Can only be called before combat is started.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// Thrown if combat is already active.
    /// </exception>
    /// <exception cref="ArgumentNullException">
    /// Thrown if combatant is null.
    /// </exception>
    public void AddPlayerCombatant(ICombatant combatant)
    {
        if (_state != CombatState.NotStarted)
            throw new InvalidOperationException(
                $"Cannot add combatants while combat is {_state}");

        _playerParty.Add(combatant ?? throw new ArgumentNullException(nameof(combatant)));
    }

    /// <summary>Add an enemy combatant to this encounter.</summary>
    public void AddEnemyCombatant(ICombatant combatant)
    {
        if (_state != CombatState.NotStarted)
            throw new InvalidOperationException(
                $"Cannot add combatants while combat is {_state}");

        _enemyParty.Add(combatant ?? throw new ArgumentNullException(nameof(combatant)));
    }

    /// <summary>
    /// Initialize combat: roll initiative, validate combatant counts, start turn tracking.
    /// Transitions state to Active.
    /// </summary>
    /// <param name="calculator">InitiativeCalculator configured with DiceRoller.</param>
    /// <exception cref="InvalidOperationException">
    /// Thrown if combatant lists invalid (one side has no combatants).
    /// </exception>
    public void StartCombat(InitiativeCalculator calculator)
    {
        // Validation
        if (_playerParty.Count == 0 || _enemyParty.Count == 0)
        {
            throw new InvalidOperationException(
                $"Invalid encounter: need at least 1 player and 1 enemy combatant. " +
                $"Got {_playerParty.Count} players, {_enemyParty.Count} enemies");
        }

        // Calculate initiative
        var allCombatants = _playerParty.Concat(_enemyParty).ToList();
        _initiativeOrder = calculator.CalculateInitiative(allCombatants);

        // Start first round
        CurrentRound = 1;
        _state = CombatState.Active;
    }

    /// <summary>
    /// Resolve one turn of combat: get current combatant, execute action, handle effects.
    /// Makes many decisions: who acts, what happens, when combatants are removed.
    /// Returns result indicating whether combat should continue.
    /// </summary>
    /// <param name="actionExecutor">
    /// Object providing GetAction() to determine combatant's action.
    /// Usually the same CombatEncounter passed as ICombatEncounter interface.
    /// </param>
    /// <returns>Result with outcome and round number.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if combat is not active or initiative not initialized.
    /// </exception>
    public CombatTurnResult ResolveTurn(IActionExecutor actionExecutor)
    {
        if (_state != CombatState.Active || _initiativeOrder == null)
            throw new InvalidOperationException(
                "Combat is not active or not properly initialized");

        // Step 1: Get current combatant
        var currentCombatant = _initiativeOrder.GetCurrentCombatant();

        // Step 2: Verify still active (defensive, should not happen)
        if (currentCombatant.State != CombatantState.Active)
        {
            // Skip, advance, and recheck
            var outcome = AdvanceToNextTurnAndCheckEnd();
            return outcome;
        }

        // Step 3: Request and execute action
        var action = actionExecutor.GetAction(currentCombatant);
        var actionResult = action.Execute();

        // Step 4: Process effects (damage, healing, status, etc)
        ProcessActionEffects(actionResult);

        // Step 5: Check if combatant was defeated/fled by their own action or by consequence
        if (currentCombatant.CurrentHealth <= 0)
        {
            currentCombatant.MarkDefeated();
            _initiativeOrder.RemoveCombatant(currentCombatant);
        }
        // Note: Flee is handled within the action's Execute() method
        else if (action is FleeAction fleeAction && fleeAction.Succeeded)
        {
            currentCombatant.MarkFled();
            _initiativeOrder.RemoveCombatant(currentCombatant);
        }

        // Step 6: Advance to next combatant and check for end conditions
        return AdvanceToNextTurnAndCheckEnd();
    }

    /// <summary>
    /// Helper: Advance to next turn in initiative order.
    /// Check victory conditions and determine outcome.
    /// </summary>
    private CombatTurnResult AdvanceToNextTurnAndCheckEnd()
    {
        if (_initiativeOrder == null)
            throw new InvalidOperationException("Initiative order not initialized");

        // Advance and detect new round
        bool newRoundStarted = _initiativeOrder.AdvanceToNextTurn();

        if (newRoundStarted)
            CurrentRound++;

        // Check victory conditions
        var playerStatus = GetPartyStatus(_playerParty);
        var enemyStatus = GetPartyStatus(_enemyParty);

        // All players defeated = loss
        if (playerStatus == PartyStatus.AllDefeated)
        {
            _state = CombatState.Ended;
            return CombatTurnResult.Victory(CombatOutcome.PlayerDefeat, CurrentRound);
        }

        // All enemies defeated or fled = win
        if (enemyStatus == PartyStatus.AllDefeated || enemyStatus == PartyStatus.AllFled)
        {
            _state = CombatState.Ended;
            return CombatTurnResult.Victory(CombatOutcome.PlayerVictory, CurrentRound);
        }

        // Combat continues
        return CombatTurnResult.Continue(CurrentRound);
    }

    /// <summary>Helper: Determine overall status of a party.</summary>
    private PartyStatus GetPartyStatus(List<ICombatant> party)
    {
        if (party.Count == 0)
            return PartyStatus.Empty;

        var active = party.Count(c => c.State == CombatantState.Active);
        var defeated = party.Count(c => c.State == CombatantState.Defeated);
        var fled = party.Count(c => c.State == CombatantState.Fled);

        if (active > 0)
            return PartyStatus.HasActiveCombatants;

        if (defeated == party.Count)
            return PartyStatus.AllDefeated;

        if (fled == party.Count)
            return PartyStatus.AllFled;

        return PartyStatus.Mixed;
    }

    /// <summary>Helper: Apply action effects (damage, healing, etc) to targets.</summary>
    private void ProcessActionEffects(CombatActionResult result)
    {
        if (result.EffectType == EffectType.Damage)
        {
            foreach (var target in result.Targets)
            {
                target.TakeDamage(result.EffectAmount);
            }
        }
        else if (result.EffectType == EffectType.Healing)
        {
            foreach (var target in result.Targets)
            {
                target.RestoreHealth(result.EffectAmount);
            }
        }
        // Handle other effect types as needed
    }

    /// <summary>Get current combatant (convenience method).</summary>
    public ICombatant? GetCurrentCombatant() => _initiativeOrder?.GetCurrentCombatant();

    /// <summary>Get all initiative entries for display (turn order UI).</summary>
    public IEnumerable<InitiativeEntry> GetInitiativeDetails() =>
        _initiativeOrder?.GetAllEntries() ?? Enumerable.Empty<InitiativeEntry>();
}

/// <summary>Helper interface for action determination.</summary>
public interface IActionExecutor
{
    CombatAction GetAction(ICombatant actor);
}

public enum CombatState
{
    NotStarted = 0,
    Active = 1,
    Ended = 2
}

public enum PartyStatus
{
    Empty = 0,
    HasActiveCombatants = 1,
    AllDefeated = 2,
    AllFled = 3,
    Mixed = 4
}

public enum CombatOutcome
{
    ContinuingCombat = 0,
    PlayerVictory = 1,
    PlayerDefeat = 2
}

public sealed record CombatTurnResult(
    CombatOutcome Outcome,
    int CurrentRound)
{
    public static CombatTurnResult Continue(int round) =>
        new(CombatOutcome.ContinuingCombat, round);

    public static CombatTurnResult Victory(CombatOutcome outcome, int round) =>
        new(outcome, round);
}
```

---

### 6. Application/Services/CombatService.cs

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace DiceEngine.Application.Services;

/// <summary>
/// Application service orchestrating combat operations.
/// Coordinates with InitiativeCalculator, CombatEncounter, and repository.
/// Handles HTTP API requests for combat interactions.
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
        if (diceRoller == null) throw new ArgumentNullException(nameof(diceRoller));
        if (parser == null) throw new ArgumentNullException(nameof(parser));

        _initiativeCalc = new InitiativeCalculator(diceRoller, parser);
        _combatRepository = combatRepository ?? throw new ArgumentNullException(nameof(combatRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Create and start a new combat encounter.
    /// </summary>
    public async Task<Guid> CreateEncounterAsync(
        IEnumerable<Guid> playerCharacterIds,
        IEnumerable<Guid> enemyIds)
    {
        var encounter = CombatEncounter.Create();

        // Load combatants from repository
        var playerIds = playerCharacterIds?.ToList() ?? new List<Guid>();
        var enemyIdsList = enemyIds?.ToList() ?? new List<Guid>();

        var players = await _combatRepository.GetCombatantsAsync(playerIds);
        var enemies = await _combatRepository.GetCombatantsAsync(enemyIdsList);

        // Add to encounter
        foreach (var player in players)
            encounter.AddPlayerCombatant(player);

        foreach (var enemy in enemies)
            encounter.AddEnemyCombatant(enemy);

        // Start combat (rolls initiative)
        try
        {
            encounter.StartCombat(_initiativeCalc);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Failed to start combat: {Message}", ex.Message);
            throw;
        }

        _logger.LogInformation(
            "Combat {EncounterId} started: {PlayerCount} players vs {EnemyCount} enemies",
            encounter.Id,
            players.Count,
            enemies.Count);

        await _combatRepository.SaveEncounterAsync(encounter);

        return encounter.Id;
    }

    /// <summary>
    /// Resolve one turn of the given combat encounter.
    /// </summary>
    public async Task<CombatTurnResult> ResolveTurnAsync(Guid encounterId)
    {
        var encounter = await _combatRepository.GetEncounterAsync(encounterId)
            ?? throw new InvalidOperationException($"Encounter {encounterId} not found");

        var result = encounter.ResolveTurn(new DefaultActionExecutor());

        _logger.LogInformation(
            "Combat {EncounterId} turn resolved: round {Round}, outcome {Outcome}",
            encounter.Id,
            encounter.CurrentRound,
            result.Outcome);

        await _combatRepository.SaveEncounterAsync(encounter);

        return result;
    }

    /// <summary>Get current combat state for display to client.</summary>
    public async Task<CombatStateDto> GetCombatStateAsync(Guid encounterId)
    {
        var encounter = await _combatRepository.GetEncounterAsync(encounterId)
            ?? throw new InvalidOperationException($"Encounter {encounterId} not found");

        return MapToDto(encounter);
    }

    private CombatStateDto MapToDto(CombatEncounter encounter)
    {
        return new CombatStateDto
        {
            EncounterId = encounter.Id,
            State = encounter.State,
            Round = encounter.CurrentRound,
            CurrentCombatant = encounter.GetCurrentCombatant()?.Name,
            InitiativeOrder = encounter.GetInitiativeDetails()
                .Select(entry => new InitiativeEntryDto
                {
                    CombatantName = entry.Combatant.Name,
                    D20Roll = entry.D20Roll,
                    DexModifier = entry.DexModifier,
                    InitiativeScore = entry.InitiativeScore,
                    TurnOrder = entry.TurnOrder
                })
                .ToList(),
            PlayerParty = encounter.PlayerParty
                .Select(c => new CombatantStateDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    CurrentHealth = c.CurrentHealth,
                    MaximumHealth = c.MaximumHealth,
                    ArmorClass = c.ArmorClass,
                    State = c.State.ToString()
                })
                .ToList(),
            EnemyParty = encounter.EnemyParty
                .Select(c => new CombatantStateDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    CurrentHealth = c.CurrentHealth,
                    MaximumHealth = c.MaximumHealth,
                    ArmorClass = c.ArmorClass,
                    State = c.State.ToString()
                })
                .ToList()
        };
    }
}

/// <summary>Service interface for dependency injection.</summary>
public interface ICombatService
{
    Task<Guid> CreateEncounterAsync(
        IEnumerable<Guid> playerCharacterIds,
        IEnumerable<Guid> enemyIds);

    Task<CombatTurnResult> ResolveTurnAsync(Guid encounterId);

    Task<CombatStateDto> GetCombatStateAsync(Guid encounterId);
}

/// <summary>Default action executor - ask combatant what they want to do.</summary>
internal class DefaultActionExecutor : IActionExecutor
{
    public CombatAction GetAction(ICombatant actor)
    {
        // This would be overridden in subclasses for AI, player input, etc.
        throw new NotImplementedException("Override in subclass");
    }
}

/// <summary>Repository interface for combat persistence.</summary>
public interface ICombatRepository
{
    Task<IList<ICombatant>> GetCombatantsAsync(IEnumerable<Guid> ids);
    Task<CombatEncounter?> GetEncounterAsync(Guid id);
    Task SaveEncounterAsync(CombatEncounter encounter);
}
```

---

### 7. Application/Models/CombatStateDto.cs

```csharp
using System;
using System.Collections.Generic;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Models;

public class CombatStateDto
{
    public Guid EncounterId { get; set; }
    public CombatState State { get; set; }
    public int Round { get; set; }
    public string? CurrentCombatant { get; set; }
    public List<InitiativeEntryDto> InitiativeOrder { get; set; } = new();
    public List<CombatantStateDto> PlayerParty { get; set; } = new();
    public List<CombatantStateDto> EnemyParty { get; set; } = new();
}

public class InitiativeEntryDto
{
    public string CombatantName { get; set; } = string.Empty;
    public int D20Roll { get; set; }
    public int DexModifier { get; set; }
    public int InitiativeScore { get; set; }
    public int TurnOrder { get; set; }
}

public class CombatantStateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CurrentHealth { get; set; }
    public int MaximumHealth { get; set; }
    public int ArmorClass { get; set; }
    public string State { get; set; } = string.Empty;
}

public class CombatTurnResult
{
    public Guid EncounterId { get; set; }
    public int CurrentRound { get; set; }
    public string? CurrentCombatant { get; set; }
    public CombatOutcome Outcome { get; set; }
}
```

---

## Integration Checklist

- [ ] Copy all domain entity files to `src/DiceEngine.Domain/Entities/`
- [ ] Copy value object files to `src/DiceEngine.Domain/ValueObjects/`
- [ ] Copy service files to `src/DiceEngine.Application/Services/`
- [ ] Copy DTO files to `src/DiceEngine.Application/Models/`
- [ ] Create `ICombatRepository` interface in `src/DiceEngine.Application/Repositories/`
- [ ] Register `InitiativeCalculator` and `CombatService` in dependency injection (Program.cs)
- [ ] Create controller endpoints for combat operations (API routes)
- [ ] Write unit tests for `InitiativeCalculator`, `InitiativeOrder`, `CombatEncounter`
- [ ] Verify dice engine integration with test encounters
- [ ] Update OpenAPI spec with new combat endpoints
- [ ] Document API endpoints for game client integration

---

## Testing Quick Reference

```csharp
[Fact]
public void InitiativeCalculator_RollsEachCombatant_AndReturnsSorted()
{
    // Arrange
    var diceRoller = new MockDiceRoller(new[] { 15, 8, 20 });
    var parser = new MockParser();
    var calc = new InitiativeCalculator(diceRoller, parser);

    var combatants = new[]
    {
        MockCombatant.WithDexModifier(2),  // 15 + 2 = 17
        MockCombatant.WithDexModifier(1),  // 8 + 1 = 9
        MockCombatant.WithDexModifier(0),  // 20 + 0 = 20 (wins)
    };

    // Act
    var order = calc.CalculateInitiative(combatants);

    // Assert
    var entries = order.GetAllEntries().ToList();
    Assert.Equal(20, entries[0].InitiativeScore);
    Assert.Equal(17, entries[1].InitiativeScore);
    Assert.Equal(9, entries[2].InitiativeScore);
}
```

---

## Next Steps

1. Copy code into appropriate directories
2. Implement `ICombatRepository` using your EF Core DbContext
3. Write API controllers to expose combat endpoints
4. Create comprehensive unit test suite (95%+ coverage goal)
5. Test with full game loop: create encounter → roll initiative → resolve turns → declare victor
