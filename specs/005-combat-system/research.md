# Research: D&D 5e Combat Mechanics and CombatResolver Design

**Created**: January 29, 2026  
**Purpose**: Document D&D 5e combat rules, design decisions for CombatResolver service, and C# implementation patterns

## Table of Contents

1. [D&D 5e Combat Rules](#dd5e-combat-rules)
2. [Attack Roll Mechanics](#attack-roll-mechanics)
3. [Damage Calculation](#damage-calculation)
4. [Health & Defeat Mechanics](#health--defeat-mechanics)
5. [Initiative System](#initiative-system)
6. [Design Patterns for CombatResolver](#design-patterns-for-combatresolver)
7. [Integration with DiceService](#integration-with-diceservice)
8. [C# Implementation Examples](#c-implementation-examples)
9. [Design Decisions & Rationale](#design-decisions--rationale)

---

## D&D 5e Combat Rules

### Overview

D&D 5e combat is a structured, turn-based system where:

- Combat begins with **initiative** determination
- Combatants take **turns** in initiative order
- Each turn, a combatant takes an **action**, **bonus action**, and **movement**
- Most common action in combat is the **Attack action**
- Combat ends when one side is defeated, flees, or surrenders

### Combat Resolution Flow

```
1. Roll Initiative (d20 + DEX modifier)
   ↓
2. Establish turn order (highest to lowest)
   ↓
3. Begin Round 1
   ├─ For each combatant in initiative order:
   │  ├─ Resolve actions (attacks, spells, etc.)
   │  ├─ Movement and bonus actions
   │  └─ Skip if defeated or fled
   └─ Round ends
   ↓
4. If combat continues, go to Round 2
   ↓
5. Combat ends when victory/defeat/flee condition is met
```

---

## Attack Roll Mechanics

### Attack Roll Formula

```
Attack Roll = d20 + Ability Modifier + Proficiency Bonus (optional) + Magic Bonuses
```

**Components:**

- **d20**: Standard 20-sided die (core randomness)
- **Ability Modifier**: DEX for ranged, STR for melee (typically -5 to +5)
- **Proficiency Bonus**: +2 to +6 if character is proficient with weapon (optional)
- **Magic Bonuses**: Bonuses from enchanted weapons, spells, etc. (±0 to +X)

### Hit/Miss Determination

**Attack Hits if**: `Attack Roll Total ≥ Target's Armor Class (AC)`

**Outcomes:**

- **Critical Hit (Natural 20)**: Roll = 20 (before modifiers)
  - Attack automatically hits
  - Damage dice are doubled (roll damage twice)
  - Used primarily in D&D 5e; some variations roll max + roll additional dice

- **Hit**: Roll result ≥ AC
  - Deal full weapon damage

- **Miss**: Roll result < AC
  - Deal 0 damage
  - No effect beyond table narrative

- **Critical Miss (Natural 1)**: Roll = 1 (before modifiers)
  - Optional rule; not official in D&D 5e
  - Often results in humorous consequences or automatic miss
  - We'll treat as automatic miss but not require special outcome

### Key Rule: Natural 20 and Natural 1

- **Natural 20 always hits** (rolls before modifiers reach AC)
- **Natural 1 always misses** (even with high modifiers)
- These should be determined from the raw d20 roll, not the finished result

### Example Attack Rolls

**Scenario 1: Fighter vs Goblin**

```
Fighter stats: STR +3, Proficiency Bonus +2, Base weapon (1d8)
Goblin AC: 15

Fighter's Attack Roll: d20 + 3 (STR) + 2 (Proficiency) = d20 + 5
Result: 12 (on d20) + 5 = 17

17 ≥ 15? YES → HIT
Damage: 1d8 + 3 (STR modifier)
```

**Scenario 2: Rogue sneak attack**

```
Rogue stats: DEX +4, Proficiency Bonus +3, Finesse weapon
Dragon AC: 18

Rogue's Attack Roll: d20 + 4 (DEX) + 3 (Proficiency) = d20 + 7
Result: 15 (on d20) + 7 = 22

22 ≥ 18? YES → HIT
Damage (Finesse weapon): 1d6 + 4 (DEX modifier) + 3d6 (sneak attack) = 4d6 + 4

**Scenario 3: Disadvantaged attack**
```

Paladin under darkness: DEX -1, Proficiency Bonus +3
Invisible enemy AC: 16

Paladin rolls 2d20 (disadvantage), keeps lower: 11
Paladin's Attack Roll: 11 + (-1) + 3 = 13

13 ≥ 16? NO → MISS

```

---

## Damage Calculation

### Damage Formula

```

Total Damage = Weapon Damage Dice + Ability Modifier + Magic Bonuses

```

**Components:**
- **Weapon Damage Dice**: Varies by weapon (1d4 to 2d6, etc.)
- **Ability Modifier**: Usually STR (melee) or DEX (ranged/finesse)
  - Typically applied **once** per attack
  - Only applied on **hit** (not on miss)
- **Magic Bonuses**: From enchanted weapons, spells, feats
- **Critical Hit**: Double the number of damage dice rolled (not the result)
  - Example: `1d8 + 5` becomes `2d8 + 5` (not the same as `2 × (1d8 + 5)`)

### Common Weapon Damage Dice

| Weapon | Dice | Modifier | Notes |
|--------|------|----------|-------|
| Dagger | 1d4 | STR or DEX | Light, finesse |
| Shortsword | 1d6 | DEX | Light, finesse |
| Longsword | 1d8 | STR | Versatile (1d10 two-handed) |
| Greatsword | 2d6 | STR | Two-handed |
| Greataxe | 1d12 | STR | Two-handed |
| Shortbow | 1d6 | DEX | Ranged |
| Longbow | 1d8 | DEX | Ranged |

### Damage Type Resistance/Vulnerability

- **Normal damage**: Apply full amount
- **Resistance**: Reduce by half (rounded down)
- **Vulnerability**: Double the damage
- **Immunity**: No damage taken

For this MVP, we'll support basic resistance/immunity tracking but not complex interactions.

### Example Damage Calculations

**Scenario 1: Longsword attack hits**
```

Base damage: 1d8
Ability modifier: STR +3
Roll result: 6

Damage = 6 + 3 = 9 HP

```

**Scenario 2: Greatsword with magic bonus**
```

Base damage: 2d6
Ability modifier: STR +2
Magic bonus: +1 (from +1 weapon)
Roll result: 5, 4

Damage = (5 + 4) + 2 + 1 = 12 HP

```

**Scenario 3: Critical hit (weapon damage doubled)**
```

Base damage: 1d8+2 → Becomes 2d8+2 on crit
Roll result: 7, 5

Damage = (7 + 5) + 2 = 14 HP (vs 9 HP on normal hit)

```

---

## Health & Defeat Mechanics

### Hit Points (HP) Tracking

- **Maximum HP**: Each creature has a maximum HP value
  - Determined by: `HD (Hit Dice) + CON modifier per level`
  - Example: 5 levels of fighter with d10 HD and CON +2: `5d10 + 10`
  - Minimum: 1 HP per level

- **Current HP**: Changes when damage is taken or healing applied
  - Range: 0 to Maximum HP

- **Temporary HP**: Extra layer of protection (magical shields, temporary effects)
  - Absorbed before regular HP
  - Not cumulative (take the highest temporary HP value)

### Defeat Condition

**A creature is defeated when Current HP ≤ 0**

In D&D 5e detail:
- Creature falls **unconscious**
- Creature makes death saving throws (official 5e rule, optional for MVP)
- Creature can be **stabilized** (medical intervention stops death process)
- Creature dies after 3 failed death saves (official 5e)

For MVP implementation:
- **Current HP = 0 → Defeated/Dead** (simplified version)
- No intermediate death saves
- Once defeated, combatant cannot take actions

### Healing

- **Healing spells/potions**: Restore HP (cannot exceed maximum)
- **Range**: 1 to Maximum HP
- Example: Healing potion restores 2d4 + 2 HP

### Example Health Tracking

**Scenario: Fighter in combat**
```

Max HP: 65
Current HP: 65 (start of combat)

Turn 1: Takes 12 damage → 53 HP
Turn 2: Takes 18 damage → 35 HP
Turn 3: Casts healing spell (2d4 + 3) → rolls 3, 2 → +11 HP → 46 HP
Turn 4: Takes 46 damage → 0 HP (DEFEATED)

```

---

## Initiative System

### Initiative Roll Formula

```

Initiative = d20 + DEX Modifier

```

**Process:**
1. Each combatant rolls 1d20
2. Add their DEX modifier
3. Order combatants highest to lowest
4. On ties, use DEX modifier as tiebreaker (higher wins)
5. If still tied, initiative is determined randomly or by established house rules

### Initiative Edge Cases

- **Surprise**: Combatants might not be aware of hostile action
  - Surprised combatants can't move or act on their first turn
  - Not required for MVP but good to document

- **Tied Initiatives**: Multiple combatants with same total
  - Tiebreaker: Higher DEX modifier wins
  - If still tied: Random determination or player preference (DM's choice)

### Example Initiative Calculation

**Scenario: Three combatants**
```

Combatant A: Rolls 14 + DEX +2 = 16
Combatant B: Rolls 16 + DEX -1 = 15
Combatant C: Rolls 12 + DEX +3 = 15

Turn Order:

1. Combatant A (16)
2. Combatant B (15, DEX -1) - higher DEX modifier than C
3. Combatant C (15, DEX +3) - Actually C has higher DEX! Recheck...
   Wait, let me recalculate properly:
   - B vs C: B has -1, C has +3, C's modifier is higher
   - So C should go before B

Correct Turn Order:

1. Combatant A (16)
2. Combatant C (15, DEX +3)
3. Combatant B (15, DEX -1)

```

---

## Design Patterns for CombatResolver

### Pattern Overview

The CombatResolver service will follow these design principles:

1. **Separation of Concerns**
   - CombatResolver: Orchestrates combat resolution
   - InitiativeCalculator: Handles initiative logic only
   - AttackResolver: Handles attack roll logic only
   - DamageCalculator: Handles damage calculation logic only
   - HealthTracker: Manages HP tracking

2. **Single Responsibility Principle**
   - Each class has one reason to change
   - Easy to test individual components
   - Easy to extend with new rules

3. **Dependency Injection**
   - Inject IDiceService for all rolls
   - Inject repositories for data persistence
   - Allow mocking for testing

4. **Value Objects**
   - AttackResult (immutable: roll, hit/miss, damage)
   - InitiativeEntry (immutable: initiative score, position)
   - HealthSnapshot (immutable: current, max HP)

5. **Domain-Driven Design**
   - Combat logic in Domain layer
   - Data models in Domain layer
   - Services orchestrate in Application layer
   - Controllers handle HTTP in API layer

### Service Architecture

```

API Layer
└─ CombatController
├─ POST /combats → Start combat
├─ POST /combats/{id}/turns → Take turn
└─ GET /combats/{id} → Get status

Application Layer
├─ CombatService
│ ├─ StartCombat() → Initializes combat
│ ├─ TakeTurn() → Processes combatant action
│ └─ GetCombatStatus() → Returns current state
├─ InitiativeCalculator
│ ├─ CalculateInitiative() → Single initiative roll
│ ├─ DetermineTurnOrder() → Orders all combatants
│ └─ ResolveTiebreaker() → Handles tied initiatives
├─ CombatResolver
│ ├─ ResolveAttack() → Processes attack action
│ ├─ CalculateDamage() → Computes damage amount
│ └─ ApplyDamage() → Updates target HP
├─ HealthTracker
│ ├─ TakeDamage() → Damages a combatant
│ ├─ Heal() → Restores HP
│ └─ IsDefeated() → Checks if HP ≤ 0
└─ AIStateMachine
├─ DetermineAction() → AI selects action
└─ UpdateState() → Transitions AI state

Domain Layer
├─ Entities/
│ ├─ CombatEncounter
│ ├─ Combatant
│ └─ Enemy
└─ ValueObjects/
├─ AttackResult
├─ InitiativeEntry
├─ HealthSnapshot
└─ DamageResult

````

---

## Integration with DiceService

### Current DiceService Capabilities

From analysis of existing codebase:

**IDiceService methods:**
```csharp
public interface IDiceService
{
    // Roll a dice expression and get detailed results
    RollResult Roll(string expression);

    // Validate expression without rolling
    DiceExpression ValidateExpression(string expression);

    // Get statistical analysis
    StatsResult GetStatistics(string expression);
}
````

**RollResult structure:**

```csharp
public class RollResult
{
    public string Expression { get; init; }
    public IReadOnlyList<int> IndividualRolls { get; init; }
    public IReadOnlyDictionary<string, int[]> RollsByGroup { get; init; }
    public IReadOnlyDictionary<string, int> SubtotalsByGroup { get; init; }
    public int TotalModifier { get; init; }
    public int FinalTotal { get; init; }
    public bool IsAdvantage { get; init; }
    public bool IsDisadvantage { get; init; }
    public IReadOnlyList<RollResult>? AdvantageRollResults { get; init; }
}
```

### Combat Usage Patterns

**1. Initiative Roll**

```csharp
// Roll for one combatant
var initiativeRoll = diceService.Roll("d20");
var initiativeScore = initiativeRoll.FinalTotal + dexModifier;
```

**2. Attack Roll**

```csharp
// Standard attack
var attackRoll = diceService.Roll("d20");
bool isHit = (attackRoll.FinalTotal + attackBonus) >= targetAC;
bool isCriticalHit = attackRoll.IndividualRolls[0] == 20;

// Advantage roll (roll twice, take higher)
var advantageAttack = diceService.Roll("2d20a"); // 'a' for advantage
bool isHit = (advantageAttack.FinalTotal + attackBonus) >= targetAC;
```

**3. Damage Roll**

```csharp
// Standard weapon damage
var damageRoll = diceService.Roll("1d8+3"); // Weapon damage + modifier
if (isCriticalHit)
{
    // Double the dice for critical hit
    damageRoll = diceService.Roll("2d8+3"); // Doubled dice count
}
```

**4. Healing**

```csharp
var healingRoll = diceService.Roll("2d4+2");
var hpRestored = healingRoll.FinalTotal;
```

### Integration Points

**CombatResolver will:**

1. Use IDiceService for all random number generation
2. Request rolls in standard D&D notation (e.g., "1d20", "2d6+3")
3. Parse RollResult to determine critical hits/misses
4. Never implement its own RNG logic
5. Handle rolls synchronously (no async I/O needed for local dice service)

---

## C# Implementation Examples

### 1. Attack Result Value Object

```csharp
namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Immutable result of an attack action containing roll information and outcome.
/// </summary>
public sealed record AttackResult
{
    public int AttackRoll { get; init; }
    public int AttackBonus { get; init; }
    public int TargetAC { get; init; }
    public bool IsHit { get; init; }
    public bool IsCriticalHit { get; init; }
    public bool IsCriticalMiss { get; init; }
    public int Damage { get; init; }
    public string WeaponDamageDice { get; init; } = string.Empty;

    public int TotalAttackRoll => AttackRoll + AttackBonus;
    public bool MeetsAC => TotalAttackRoll >= TargetAC;
}
```

### 2. HealthTracker Service

```csharp
namespace DiceEngine.Application.Services;

/// <summary>
/// Service for managing combatant health and defeat tracking.
/// </summary>
public class HealthTracker
{
    private int _currentHP;
    private readonly int _maxHP;
    private int _tempHP = 0;

    public HealthTracker(int maxHP)
    {
        if (maxHP < 1)
            throw new ArgumentException("Max HP must be at least 1", nameof(maxHP));

        _maxHP = maxHP;
        _currentHP = maxHP;
    }

    /// <summary>
    /// Current health points (0 to MaxHP).
    /// </summary>
    public int CurrentHP => _currentHP;

    /// <summary>
    /// Maximum health points.
    /// </summary>
    public int MaxHP => _maxHP;

    /// <summary>
    /// Temporary health points (shield, temporary effects).
    /// </summary>
    public int TemporaryHP => _tempHP;

    /// <summary>
    /// Total effective HP (temp + current).
    /// </summary>
    public int EffectiveHP => _tempHP + _currentHP;

    /// <summary>
    /// Determines if combatant is defeated (current HP ≤ 0).
    /// </summary>
    public bool IsDefeated => _currentHP <= 0;

    /// <summary>
    /// Apply damage to the combatant (temporary HP first, then current HP).
    /// </summary>
    /// <param name="damage">Amount of damage to apply (must be >= 0)</param>
    /// <returns>Actual damage applied after reductions</returns>
    public int TakeDamage(int damage)
    {
        if (damage < 0)
            throw new ArgumentException("Damage cannot be negative", nameof(damage));

        int actualDamage = damage;

        // Apply to temporary HP first
        if (_tempHP > 0)
        {
            int tempDamage = Math.Min(damage, _tempHP);
            _tempHP -= tempDamage;
            actualDamage -= tempDamage;
        }

        // Apply remaining damage to current HP
        if (actualDamage > 0)
        {
            _currentHP -= actualDamage;
            if (_currentHP < 0)
                _currentHP = 0; // Prevent negative HP
        }

        return damage;
    }

    /// <summary>
    /// Restore health (cannot exceed max HP).
    /// </summary>
    /// <param name="healing">Amount to heal (must be >= 0)</param>
    /// <returns>Actual HP restored</returns>
    public int Heal(int healing)
    {
        if (healing < 0)
            throw new ArgumentException("Healing cannot be negative", nameof(healing));

        int oldHP = _currentHP;
        _currentHP = Math.Min(_currentHP + healing, _maxHP);
        return _currentHP - oldHP;
    }

    /// <summary>
    /// Add temporary hit points (takes highest value, not cumulative).
    /// </summary>
    public void ApplyTemporaryHP(int tempHP)
    {
        if (tempHP < 0)
            throw new ArgumentException("Temporary HP cannot be negative", nameof(tempHP));

        _tempHP = Math.Max(_tempHP, tempHP);
    }

    /// <summary>
    /// Reset to maximum health (after combat or for testing).
    /// </summary>
    public void ResetHealth()
    {
        _currentHP = _maxHP;
        _tempHP = 0;
    }
}
```

### 3. AttackResolver Service

```csharp
namespace DiceEngine.Application.Services;

/// <summary>
/// Resolves attack actions using D&D 5e rules.
/// </summary>
public class AttackResolver
{
    private readonly IDiceService _diceService;

    public AttackResolver(IDiceService diceService)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
    }

    /// <summary>
    /// Resolve an attack action (roll to hit, determine hit/miss, calculate damage).
    /// </summary>
    public AttackResult ResolveAttack(
        int attackBonus,
        int targetAC,
        string weaponDamageDice,
        int damageModifier,
        bool isCriticalHit = false)
    {
        // Step 1: Roll for attack
        var attackRoll = _diceService.Roll("d20");
        int rawD20 = attackRoll.IndividualRolls[0];
        int totalAttackRoll = attackRoll.FinalTotal + attackBonus;

        // Step 2: Determine critical hit/miss (before adding modifiers)
        bool isCrit = rawD20 == 20;
        bool isMiss = rawD20 == 1;

        // Step 3: Determine if attack hits
        bool isHit = isMiss ? false : (isCrit || totalAttackRoll >= targetAC);

        // Step 4: Calculate damage if hit
        int damage = 0;
        if (isHit)
        {
            string damageExpression = weaponDamageDice;

            // On critical hit, double the dice
            if (isCrit)
            {
                damageExpression = DoubleDiceDicesInExpression(weaponDamageDice);
            }

            // Add damage modifier
            if (damageModifier > 0)
                damageExpression += $"+{damageModifier}";
            else if (damageModifier < 0)
                damageExpression += damageModifier.ToString(); // Includes minus sign

            var damageRoll = _diceService.Roll(damageExpression);
            damage = damageRoll.FinalTotal;
        }

        return new AttackResult
        {
            AttackRoll = rawD20,
            AttackBonus = attackBonus,
            TargetAC = targetAC,
            IsHit = isHit,
            IsCriticalHit = isCrit,
            IsCriticalMiss = isMiss,
            Damage = damage,
            WeaponDamageDice = weaponDamageDice
        };
    }

    /// <summary>
    /// Double the dice count in a damage expression (e.g., "1d8+2" → "2d8+2").
    /// </summary>
    private string DoubleDiceDicesInExpression(string expression)
    {
        // Simple approach: find the last "d" and the number before it, double it
        // Expression format: "{count}d{sides}[+/-modifier]"

        var parts = expression.Split(new[] { '+', '-' }, 2);
        var diceGroup = parts[0].Trim();

        if (diceGroup.Contains('d', StringComparison.OrdinalIgnoreCase))
        {
            var diceParts = diceGroup.Split('d', StringSplitOptions.IgnoreCase);
            if (int.TryParse(diceParts[0], out int count))
            {
                int newCount = count * 2;
                string newDiceGroup = $"{newCount}d{diceParts[1]}";

                // Reconstruct with modifiers if present
                if (parts.Length > 1)
                {
                    return newDiceGroup + (expression[newDiceGroup.Length] == '+' ? "+" : "-") + parts[1].Trim();
                }

                return newDiceGroup;
            }
        }

        // Fallback: return original if parsing fails
        return expression;
    }
}
```

### 4. InitiativeCalculator Service

```csharp
namespace DiceEngine.Application.Services;

/// <summary>
/// Calculates initiative order for combat encounters.
/// </summary>
public class InitiativeCalculator
{
    private readonly IDiceService _diceService;

    public InitiativeCalculator(IDiceService diceService)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
    }

    /// <summary>
    /// Represents a combatant with their initiative score.
    /// </summary>
    public record CombatantInitiative(
        string CombatantId,
        int InitiativeRoll,
        int DexModifier,
        int FinalScore)
    {
        public int TotalScore => InitiativeRoll + DexModifier;
    }

    /// <summary>
    /// Roll initiative for a single combatant.
    /// </summary>
    public CombatantInitiative RollInitiative(string combatantId, int dexModifier)
    {
        var roll = _diceService.Roll("d20");
        int rawRoll = roll.IndividualRolls[0];
        int finalScore = rawRoll + dexModifier;

        return new CombatantInitiative(combatantId, rawRoll, dexModifier, finalScore);
    }

    /// <summary>
    /// Determine turn order from a collection of combatants with initiative rolls.
    /// </summary>
    public List<CombatantInitiative> DetermineTurnOrder(
        IEnumerable<CombatantInitiative> initiativeRolls)
    {
        return initiativeRolls
            .OrderByDescending(i => i.TotalScore)           // Sort by total score
            .ThenByDescending(i => i.DexModifier)           // Tiebreaker: higher DEX
            .ThenBy(i => i.CombatantId)                     // Further tiebreaker: consistent ordering
            .ToList();
    }
}
```

### 5. CombatResolver Service (Main Orchestrator)

```csharp
namespace DiceEngine.Application.Services;

/// <summary>
/// Main service orchestrating turn-based combat resolution.
/// </summary>
public class CombatResolver
{
    private readonly IDiceService _diceService;
    private readonly AttackResolver _attackResolver;
    private readonly InitiativeCalculator _initiativeCalculator;
    private readonly HealthTracker _healthTracker;

    public CombatResolver(
        IDiceService diceService,
        AttackResolver attackResolver,
        InitiativeCalculator initiativeCalculator,
        HealthTracker healthTracker)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
        _attackResolver = attackResolver ?? throw new ArgumentNullException(nameof(attackResolver));
        _initiativeCalculator = initiativeCalculator ?? throw new ArgumentNullException(nameof(initiativeCalculator));
        _healthTracker = healthTracker ?? throw new ArgumentNullException(nameof(healthTracker));
    }

    /// <summary>
    /// Represents the state of a combatant in combat.
    /// </summary>
    public class CombatantState
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int MaxHP { get; set; }
        public int CurrentHP { get; set; }
        public int ArmorClass { get; set; }
        public int DexModifier { get; set; }
        public int StrModifier { get; set; }
        public string EquippedWeapon { get; set; } = string.Empty;
        public string WeaponDamageDice { get; set; } = string.Empty;
        public int InitiativeScore { get; set; }
        public bool IsDefeated => CurrentHP <= 0;
    }

    /// <summary>
    /// Represents the overall combat encounter state.
    /// </summary>
    public class CombatEncounterState
    {
        public string Id { get; set; } = string.Empty;
        public int CurrentRound { get; set; } = 1;
        public int CurrentTurnIndex { get; set; } = 0;
        public List<CombatantState> Combatants { get; set; } = new();
        public List<CombatantState> TurnOrder { get; set; } = new();
        public bool IsActive { get; set; }
        public string? VictorId { get; set; }

        public CombatantState? CurrentCombatant =>
            TurnOrder.Count > 0 && CurrentTurnIndex < TurnOrder.Count
                ? TurnOrder[CurrentTurnIndex]
                : null;
    }

    /// <summary>
    /// Initialize a new combat encounter with combatants.
    /// </summary>
    public CombatEncounterState InitiateCombat(List<CombatantState> combatants)
    {
        if (combatants == null || combatants.Count == 0)
            throw new ArgumentException("At least one combatant required", nameof(combatants));

        // Roll initiative for all combatants
        var initiativeRolls = combatants
            .Select(c => _initiativeCalculator.RollInitiative(c.Id, c.DexModifier))
            .ToList();

        // Determine turn order
        var turnOrder = _initiativeCalculator.DetermineTurnOrder(initiativeRolls);

        // Update combatant states with initiative scores
        foreach (var combatant in combatants)
        {
            var initiative = turnOrder.First(i => i.CombatantId == combatant.Id);
            combatant.InitiativeScore = initiative.TotalScore;
        }

        return new CombatEncounterState
        {
            Id = Guid.NewGuid().ToString(),
            Combatants = combatants,
            TurnOrder = combatants
                .OrderByDescending(c => c.InitiativeScore)
                .ThenByDescending(c => c.DexModifier)
                .ToList(),
            IsActive = true
        };
    }

    /// <summary>
    /// Process an attack action during a combatant's turn.
    /// </summary>
    public AttackResult ProcessAttack(
        CombatEncounterState encounter,
        string attackerId,
        string targetId,
        bool isAdvantage = false,
        bool isDisadvantage = false)
    {
        var attacker = encounter.Combatants.FirstOrDefault(c => c.Id == attackerId)
            ?? throw new InvalidOperationException($"Attacker {attackerId} not found");

        var target = encounter.Combatants.FirstOrDefault(c => c.Id == targetId)
            ?? throw new InvalidOperationException($"Target {targetId} not found");

        if (target.IsDefeated)
            throw new InvalidOperationException($"Target {targetId} is already defeated");

        // Calculate attack bonus (ability modifier + proficiency bonus)
        // Using STR for melee in this example; could be made flexible
        int attackBonus = attacker.StrModifier + 2; // +2 proficiency bonus (can vary by level)

        // Resolve the attack
        var result = _attackResolver.ResolveAttack(
            attackBonus,
            target.ArmorClass,
            attacker.WeaponDamageDice,
            attacker.StrModifier,
            isCriticalHit: false
        );

        // Apply damage to target
        if (result.IsHit)
        {
            target.CurrentHP -= result.Damage;
            if (target.CurrentHP < 0)
                target.CurrentHP = 0;
        }

        return result;
    }

    /// <summary>
    /// Advance to next combatant's turn, handling round progression.
    /// </summary>
    public void AdvanceTurn(CombatEncounterState encounter)
    {
        if (!encounter.IsActive)
            return;

        // Move to next combatant
        encounter.CurrentTurnIndex++;

        // Check if round is complete
        if (encounter.CurrentTurnIndex >= encounter.TurnOrder.Count)
        {
            encounter.CurrentRound++;
            encounter.CurrentTurnIndex = 0;
        }

        // Skip defeated combatants
        while (encounter.CurrentTurnIndex < encounter.TurnOrder.Count &&
               encounter.TurnOrder[encounter.CurrentTurnIndex].IsDefeated)
        {
            encounter.CurrentTurnIndex++;
        }

        // Check for combat end condition
        CheckCombatEnd(encounter);
    }

    /// <summary>
    /// Check if combat should end (all on one side defeated).
    /// </summary>
    private void CheckCombatEnd(CombatEncounterState encounter)
    {
        // Simple check for MVP: in real implementation would track player vs enemy sides
        var activeCombatants = encounter.Combatants.Where(c => !c.IsDefeated).ToList();

        if (activeCombatants.Count == 0)
        {
            encounter.IsActive = false;
            encounter.VictorId = "none"; // Draw/all defeated
        }
        else if (activeCombatants.Count == 1)
        {
            encounter.IsActive = false;
            encounter.VictorId = activeCombatants[0].Id;
        }
    }
}
```

### 6. Dependency Injection Setup

```csharp
// In Program.cs
using DiceEngine.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace DiceEngine.API;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        // Register core dice services
        services.AddScoped<IDiceService, DiceService>();
        services.AddScoped<IDiceExpressionParser, DiceExpressionParser>();
        services.AddScoped<IDiceRoller, DiceRoller>();

        // Register combat services
        services.AddScoped<AttackResolver>();
        services.AddScoped<InitiativeCalculator>();
        services.AddScoped<CombatResolver>();

        // Note: HealthTracker is stateful and created per combatant,
        // so don't register in DI. Instead, instantiate in services as needed.

        services.AddControllers();
    }
}
```

### 7. Example Unit Test

```csharp
using Xunit;
using DiceEngine.Application.Services;
using Moq;
using DiceEngine.Application.Models;

namespace DiceEngine.Application.Tests;

public class AttackResolverTests
{
    private readonly Mock<IDiceService> _diceServiceMock;
    private readonly AttackResolver _resolver;

    public AttackResolverTests()
    {
        _diceServiceMock = new Mock<IDiceService>();
        _resolver = new AttackResolver(_diceServiceMock.Object);
    }

    [Fact]
    public void ResolveAttack_WhenAttackMeetsAC_ReturnsHit()
    {
        // Arrange
        var rollResult = new RollResult
        {
            Expression = "d20",
            IndividualRolls = new List<int> { 12 },
            FinalTotal = 12
        };
        _diceServiceMock.Setup(s => s.Roll("d20"))
            .Returns(rollResult);

        var damageResult = new RollResult
        {
            Expression = "1d8+3",
            IndividualRolls = new List<int> { 6 },
            FinalTotal = 9
        };
        _diceServiceMock.Setup(s => s.Roll("1d8+3"))
            .Returns(damageResult);

        // Act
        var result = _resolver.ResolveAttack(
            attackBonus: 5,
            targetAC: 15,
            weaponDamageDice: "1d8",
            damageModifier: 3
        );

        // Assert
        Assert.True(result.IsHit);           // 12 + 5 = 17 >= 15
        Assert.Equal(9, result.Damage);
        Assert.False(result.IsCriticalHit);
    }

    [Fact]
    public void ResolveAttack_OnNaturalTwenty_IsCritical()
    {
        // Arrange
        var rollResult = new RollResult
        {
            Expression = "d20",
            IndividualRolls = new List<int> { 20 },
            FinalTotal = 20
        };
        _diceServiceMock.Setup(s => s.Roll("d20"))
            .Returns(rollResult);

        var damageResult = new RollResult
        {
            Expression = "2d8+3",
            IndividualRolls = new List<int> { 7, 5 },
            FinalTotal = 15
        };
        _diceServiceMock.Setup(s => s.Roll("2d8+3"))
            .Returns(damageResult);

        // Act
        var result = _resolver.ResolveAttack(
            attackBonus: -5,  // Low bonus to test natural 20 always hits
            targetAC: 30,     // High AC to show natural 20 overrides
            weaponDamageDice: "1d8",
            damageModifier: 3
        );

        // Assert
        Assert.True(result.IsCriticalHit);
        Assert.True(result.IsHit);          // Natural 20 always hits
        Assert.Equal(15, result.Damage);
    }

    [Fact]
    public void ResolveAttack_OnNaturalOne_IsMiss()
    {
        // Arrange
        var rollResult = new RollResult
        {
            Expression = "d20",
            IndividualRolls = new List<int> { 1 },
            FinalTotal = 1
        };
        _diceServiceMock.Setup(s => s.Roll("d20"))
            .Returns(rollResult);

        // Act
        var result = _resolver.ResolveAttack(
            attackBonus: 20,  // High bonus to test natural 1 always misses
            targetAC: 5,      // Low AC to show natural 1 overrides
            weaponDamageDice: "1d8",
            damageModifier: 3
        );

        // Assert
        Assert.True(result.IsCriticalMiss);
        Assert.False(result.IsHit);        // Natural 1 always misses
        Assert.Equal(0, result.Damage);
    }
}
```

---

## Design Decisions & Rationale

### Decision 1: Natural 20/1 Detection Before Modifiers Applied

**Issue**: Should critical hit/miss be determined from raw d20 roll or final modified roll?

**Options**:

1. Raw d20 roll only (Natural 20/1 regardless of modifiers)
2. Final modified attack roll (very high/low rolls become crits)

**Decision**: Option 1 - Use raw d20 roll

**Rationale**:

- **D&D 5e compliant**: Official D&D 5e defines crits based on rolling 20/1 on the d20
- **Narrative clarity**: Players understand "I rolled a natural 20" as automatic hit
- **Consistent with source material**: Matches established player expectations
- **Easy to test**: Can extract `IndividualRolls[0]` from `RollResult`
- **No modifier paradoxes**: Prevents situations where negative modifiers cause automatic misses with high rolls

**Trade-off**: Means a character with +20 modifier can still miss on a 1, even though their total might be 21. This is intentional and matches D&D 5e rules.

---

### Decision 2: Separate Service Classes vs. Single Monolithic CombatService

**Issue**: Where should attack resolution, damage, initiative logic live?

**Options**:

1. Single `CombatService` with all methods
2. Separate services: `AttackResolver`, `InitiativeCalculator`, `DamageCalculator`, etc.
3. Hybrid: Separate classes in Application layer, facade in Domain

**Decision**: Option 2 - Separate service classes

**Rationale**:

- **Single Responsibility**: Each class has one reason to change
- **Testability**: Can mock/test attack logic independently from health tracking
- **Reusability**: InitiativeCalculator can be used in other contexts (e.g., NPC encounters)
- **Maintainability**: Clear boundaries make code easier to understand
- **Extensibility**: Adding new combat mechanics (advantage/disadvantage) doesn't bloat main service
- **Dependency Injection**: Each service declares its specific dependencies

**Trade-off**: More classes to understand initially, but pays off in long-term maintainability

---

### Decision 3: Immutable Value Objects for Attack/Initiative Results

**Issue**: How to represent roll results and calculations?

**Options**:

1. Mutable classes (easier to modify, but less safe)
2. Records (immutable by default, matches modern C#)
3. ValueObjects with defensive copying

**Decision**: Option 2 - Records for value objects

**Rationale**:

- **Type Safety**: Once created, results cannot be accidentally modified
- **Thread Safety**: Immutable objects are safe to share across threads
- **Debugging**: Easier to track state when it can't be unexpectedly changed
- **Testability**: Results can be compared directly with equality checks
- **Modern C#**: Records are built-in language feature (C# 9+), well-supported

**Trade-off**: Cannot modify results after creation; must create new instances if updates needed. This is intentional for combat rolls which shouldn't be "retconned".

---

### Decision 4: Double Dice Count (Not Damage Amount) on Critical Hit

**Issue**: How to handle critical hit damage?

**Options**:

1. Double the final damage (e.g., 9 damage → 18 damage)
2. Double the dice rolled (e.g., 1d8 → 2d8 for that roll)
3. Add additional dice (e.g., 1d8 + 1d8 bonus dice)

**Decision**: Option 2 - Double the dice count

**Rationale**:

- **D&D 5e Official**: This is the exact rule in D&D 5e PHB
- **Variance Matters**: Doubling dice (1d8 vs 2d8) gives range 2-16 instead of 2-18, different distribution
- **Expected Damage**: Doubling dice produces roughly 1.5x damage on average, not 2x (matches game balance)
- **Narrative**: Different from doubling modifier (modifier still applies once)
- **Example**:
  - Normal: 1d8 + 3 = avg 7.5
  - Critical: 2d8 + 3 = avg 12 (not 1d8 + 6 which would be 10.5)

**Trade-off**: More complex damage expression logic, but maintains D&D 5e balance expectations

---

### Decision 5: HealthTracker as Separate, Mutable Stateful Class

**Issue**: How to manage HP changes—immutable value objects or mutable state?

**Options**:

1. Immutable snapshots: Return new HealthTracker on each damage
2. Mutable object: Modify HP in place
3. Event sourcing: Track all damage events

**Decision**: Option 2 - Mutable object

**Rationale**:

- **Combat Reality**: HP changes rapidly during turns, immutable copies would be inefficient
- **Simplicity**: Straightforward to understand "take damage" as modifying current value
- **Performance**: No garbage collection from creating new snapshots on each hit
- **Game Loop**: Combat isn't functional code; imperative state updates are natural
- **Testing**: Can directly check `tracker.CurrentHP` after operations

**Trade-off**: Must manage mutations carefully, can't rely on immutability for safety. Mitigated by encapsulation and boundary definitions.

---

### Decision 6: Integration Pattern: Dice Expressions as Strings

**Issue**: How to pass weapon damage to damage calculator?

**Options**:

1. String expressions: "2d6+3" (loose coupling, simple)
2. Damage objects with parsed structure (tight coupling to parser)
3. Separate dice count and modifier fields
4. Pre-rolled dice (forces all rolls up front)

**Decision**: Option 1 - String expressions

**Rationale**:

- **Consistency**: Matches DiceService interface already used
- **Flexibility**: Supports any weapon damage expression without code changes
- **Loose Coupling**: CombatResolver doesn't need to know about expression parsing
- **Data Flexibility**: Can store weapons as simple strings in database
- **Extensibility**: New damage types (e.g., "3d6+2+1d4 necrotic") don't require schema changes

**Trade-off**: String parsing overhead, but negligible since done once per attack not per roll

---

### Decision 7: Combatant Sides Tracking (Player vs Enemy)

**Issue**: How to determine combat end condition?

**Options**:

1. Track sides (list of players, list of enemies)
2. Track faction IDs
3. Simple: Combat ends when only 1 combatant remains
4. Victory types: Player victory, enemy victory, draw

**Decision**: Option 1 (to be implemented in Phase 1)

**Rationale**:

- **D&D Realistic**: Combat between two opposing forces
- **Multiple PCs/PCs**: Supports group combat on both sides
- **Natural End Condition**: When all members of one side are defeated, combat ends
- **NPC Coordination**: Enemies can act together, PCs act together
- **Extended Scenarios**: Allows fleeing, reinforcements, phase transitions

**Trade-off**: Requires tracking side assignment when creating combatants. Worth it for game realism.

---

### Decision 8: Synchronous Combat Resolution (No Async/Await)

**Issue**: Should combat resolution be async?

**Options**:

1. Async with Task-based API
2. Synchronous with blocking calls
3. Event-based messaging

**Decision**: Option 2 - Synchronous

**Rationale**:

- **DiceService is Fast**: Local RNG, no I/O, <10ms per roll
- **Combat is Sequential**: One attack at a time, no parallelism
- **Code Simplicity**: No need for complex async patterns
- **Performance Target**: <100ms total turn resolution well within budget
- **Testing**: Easier to test without mocking Task behavior

**Trade-off**: Cannot scale to massive numbers of simultaneous combats. Acceptable for single encounter at a time.

---

## Summary: Key Design Decisions

| Decision             | Choice             | Key Benefit                                |
| -------------------- | ------------------ | ------------------------------------------ |
| Critical Detection   | Raw d20 roll       | D&D 5e compliant, no modifier paradoxes    |
| Service Organization | Separate classes   | Single responsibility, testable, reusable  |
| Result Immutability  | Records            | Type-safe, thread-safe, debuggable         |
| Crit Damage          | Double dice count  | Correct game balance, D&D 5e official      |
| HP Tracking          | Mutable object     | Performance, simplicity, combat reality    |
| Weapon Damage        | String expressions | Loose coupling, flexibility, extensibility |
| Combat Sides         | Tracked separately | Realistic multi-combatant scenarios        |
| Execution Model      | Synchronous        | Fast local operations, code simplicity     |
