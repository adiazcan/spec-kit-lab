# CombatResolver Quick Reference

**Purpose**: Fast lookup for combat mechanics, code patterns, and design decisions

## Attack Roll Flow

```csharp
// 1. Roll d20
RollResult attackRoll = diceService.Roll("d20");
int rawD20 = attackRoll.IndividualRolls[0];

// 2. Check for critical
bool isCrit = (rawD20 == 20);
bool isMiss = (rawD20 == 1);

// 3. Apply modifiers
int totalAttack = rawD20 + attackBonus;

// 4. Compare to AC
bool isHit = isMiss ? false : (isCrit || totalAttack >= targetAC);

// 5. Calculate damage if hit
int damage = 0;
if (isHit)
{
    string damageExpr = weaponDamageDice;
    if (isCrit) damageExpr = DoubleDice(damageExpr); // e.g., "1d8" → "2d8"
    if (damageModifier > 0) damageExpr += $"+{damageModifier}";

    var damageRoll = diceService.Roll(damageExpr);
    damage = damageRoll.FinalTotal;
}
```

**Key Rules:**

- Natural 20 = Always hit (regardless of AC or modifiers)
- Natural 1 = Always miss (regardless of modifiers)
- Critical hit = Double dice count, NOT damage doubled
- Damage only applies on hit
- Damage cannot reduce HP below 0

---

## Service Classes

### AttackResolver

```csharp
public class AttackResolver
{
    public AttackResult ResolveAttack(
        int attackBonus,
        int targetAC,
        string weaponDamageDice,
        int damageModifier)
    {
        // Returns: AttackResult with roll, hit/miss, damage
    }
}
```

### InitiativeCalculator

```csharp
public class InitiativeCalculator
{
    public CombatantInitiative RollInitiative(string combatantId, int dexModifier)
    {
        // Returns: initiative roll + DEX modifier
    }

    public List<CombatantInitiative> DetermineTurnOrder(
        IEnumerable<CombatantInitiative> rolls)
    {
        // Returns: sorted by (total score DESC, DEX modifier DESC)
    }
}
```

### HealthTracker

```csharp
public class HealthTracker
{
    public int CurrentHP { get; }
    public int MaxHP { get; }
    public bool IsDefeated => CurrentHP <= 0;

    public int TakeDamage(int damage)
    {
        // Applies damage to temp HP first, then current HP
        // Returns amount actually applied
    }

    public int Heal(int healing)
    {
        // Restores HP (max cap at MaxHP)
    }
}
```

### CombatResolver

```csharp
public class CombatResolver
{
    public CombatEncounterState InitiateCombat(List<CombatantState> combatants)
    {
        // Rolls initiative, determines turn order, creates encounter
    }

    public AttackResult ProcessAttack(
        CombatEncounterState encounter,
        string attackerId,
        string targetId)
    {
        // Orchestrates attack: resolves, applies damage, checks end condition
    }

    public void AdvanceTurn(CombatEncounterState encounter)
    {
        // Moves to next combatant, skips defeated, detects combat end
    }
}
```

---

## Dice Expression Patterns

| Use Case        | Expression | Example         | Notes                       |
| --------------- | ---------- | --------------- | --------------------------- |
| Initiative      | `"d20"`    | Single d20 roll | Add DEX modifier separately |
| Attack roll     | `"d20"`    | Single d20 roll | Add attack bonus separately |
| Weapon damage   | `"1d8+3"`  | d8 plus STR mod | Or "2d6", "1d6", etc.       |
| Critical damage | `"2d8+3"`  | Doubled dice    | Modifier only applied once  |
| Healing         | `"2d4+2"`  | Healing potion  | Direct HP restoration       |
| Multi-hit       | `"3d6"`    | Spell damage    | Apply once, not per target  |

**Key:**

- Always use lowercase 'd' in expressions
- Modifiers use `+` or `-` directly (no spaces)
- Each expression parsed/rolled once
- DiceService returns `RollResult` with `FinalTotal`

---

## Critical Hit Mechanics

### Wrong Way (Damage Doubling)

```csharp
// DON'T DO THIS
var normalDamage = diceService.Roll("1d8+3");
damage = normalDamage.FinalTotal * 2;  // WRONG: 9 * 2 = 18
```

### Right Way (Dice Doubling)

```csharp
// DO THIS
var critDamage = diceService.Roll("2d8+3");  // Double the dice
damage = critDamage.FinalTotal;  // Correct: potentially 6-19, not 18
```

**Why it matters:**

- Normal 1d8+3: avg = 7.5
- Wrong (2× damage): avg = 15
- Right (2d8+3): avg = 12

D&D 5e uses dice doubling for correct game balance.

---

## Initiative Tiebreaking

**When two+ combatants have same initiative score:**

1. Compare DEX modifiers (higher wins)
2. If still tied: Use stable sort by ID (consistent but arbitrary)

```csharp
var sorted = combatants
    .OrderByDescending(c => c.InitiativeScore)      // Sort by score
    .ThenByDescending(c => c.DexModifier)            // Tiebreak by DEX
    .ThenBy(c => c.Id)                               // Stable sort
    .ToList();
```

---

## Health Tracking Edge Cases

| Scenario              | Behavior                 | Code                                 |
| --------------------- | ------------------------ | ------------------------------------ |
| Damage to defeated    | No change (already at 0) | `if (!target.IsDefeated)`            |
| Heal past max         | Caps at MaxHP            | `Math.Min(current + healing, maxHP)` |
| Temporary HP stacking | Takes highest value      | `_tempHP = Math.Max(_tempHP, new)`   |
| Negative damage       | Invalid (throw error)    | Validate input                       |
| Zero max HP           | Invalid (throw error)    | Validate in constructor              |

---

## Dependency Injection Pattern

```csharp
// Program.cs
services.AddScoped<IDiceService, DiceService>();
services.AddScoped<AttackResolver>();
services.AddScoped<InitiativeCalculator>();
services.AddScoped<CombatResolver>();

// HealthTracker is stateful, created per combatant:
var healthTracker = new HealthTracker(maxHP: 65);
```

---

## Testing Patterns

### Mock DiceService

```csharp
var mockDice = new Mock<IDiceService>();
mockDice.Setup(s => s.Roll("d20"))
    .Returns(new RollResult { FinalTotal = 15, IndividualRolls = new[] { 15 } });
```

### Create Test Combatant

```csharp
var combatant = new CombatantState
{
    Id = "p1",
    Name = "Fighter",
    MaxHP = 50,
    CurrentHP = 50,
    ArmorClass = 16,
    DexModifier = 2,
    StrModifier = 3,
    WeaponDamageDice = "1d8"
};
```

### Assert Combat Results

```csharp
Assert.True(result.IsHit);
Assert.Equal(9, result.Damage);
Assert.False(result.IsCriticalHit);
Assert.Equal(41, target.CurrentHP);  // 50 - 9
```

---

## Common Modifiers by Ability

| Ability | Modifier Range | Typical Classes             | Notes                      |
| ------- | -------------- | --------------------------- | -------------------------- |
| STR     | -5 to +5       | Fighter, Barbarian, Paladin | Melee attacks & damage     |
| DEX     | -5 to +5       | Rogue, Ranger, Monk         | Ranged attacks, initiative |
| CON     | -5 to +5       | All classes                 | HP calculation (per level) |
| INT     | -5 to +5       | Wizard                      | Spell attack rolls         |
| WIS     | -5 to +5       | Cleric, Druid               | Spell attacks, perception  |
| CHA     | -5 to +5       | Bard, Sorcerer, Warlock     | Spell attacks, persuasion  |

---

## Weapon Damage Dice Reference

| Weapon Category   | Damage Dice | Example              |
| ----------------- | ----------- | -------------------- |
| Light (1-handed)  | 1d4 to 1d6  | Dagger, Shortsword   |
| Medium (1-handed) | 1d8         | Longsword, Mace      |
| Heavy (2-handed)  | 2d6 to 1d12 | Greatsword, Greataxe |
| Ranged            | 1d6 to 1d8  | Bow, Crossbow        |

---

## Combat End Conditions

```csharp
// Check each turn
var activeCombatants = encounter.Combatants.Where(c => !c.IsDefeated).ToList();

if (activeCombatants.Count == 0)
{
    encounter.IsActive = false;
    encounter.VictorId = "none";  // All defeated (draw)
}
else if (activeCombatants.Count == 1)
{
    encounter.IsActive = false;
    encounter.VictorId = activeCombatants[0].Id;  // Last one standing
}
```

---

## Design Decision Reference

| Decision       | Choice                         | Why                         |
| -------------- | ------------------------------ | --------------------------- |
| Crit Detection | Raw d20 before modifiers       | D&D 5e official rule        |
| Service Split  | Separate classes               | Single responsibility       |
| Result Type    | Records (immutable)            | Type-safe, testable         |
| Damage on Crit | Double dice, not double amount | Correct game balance        |
| HP Updates     | Mutable object                 | Combat reality, performance |
| Weapon Data    | String expressions             | Loose coupling, flexible    |
| Execution      | Synchronous                    | No I/O, operations <100ms   |

---

## Resources

- **Full Research**: [specs/005-combat-system/research.md](../specs/005-combat-system/research.md)
- **Combat Spec**: [specs/005-combat-system/spec.md](../specs/005-combat-system/spec.md)
- **Implementation Plan**: [specs/005-combat-system/plan.md](../specs/005-combat-system/plan.md)
- **D&D 5e PHB**: Player's Handbook (Wizards of the Coast)
  - Attack rolls: Chapter 9
  - Damage: Chapter 9
  - Initiative: Chapter 9
