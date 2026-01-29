# AI Combat Decision Reference Guide

A quick-lookup guide for implementing AI state machines in DiceEngine.

## 1. State Transition Decision Matrix

| Current State  | Trigger                     | Next State | Rationale                    |
| -------------- | --------------------------- | ---------- | ---------------------------- |
| **Aggressive** | Health ≤ 45% + Threat > 0.5 | Defensive  | Damage becoming critical     |
| **Aggressive** | Health ≤ 20%                | Flee       | Survival mode activated      |
| **Aggressive** | All enemies dead            | Idle       | Combat over                  |
| **Defensive**  | Health > 65% + Threat < 0.4 | Aggressive | Situation stabilized         |
| **Defensive**  | Health ≤ 20%                | Flee       | Despite defense, critical    |
| **Tactical**   | Health > 50% + Threat < 0.3 | Aggressive | Can resume offense           |
| **Tactical**   | Health ≤ 30%                | Defensive  | Must prioritize survival     |
| **Flee**       | Health > 50% + Enemies < 3  | Aggressive | Recovered enough to fight    |
| **Flee**       | 5+ rounds of fleeing        | Dead       | Surrender (tactical retreat) |

## 2. Action Selection by State

### Aggressive State

```
Priority 1: Can finish weakest enemy (HP < 30%) with high-damage ability?
            → UseAbility(HighDamageAbility, WeakestTarget)

Priority 2: Select highest-threat target
            → Attack(HighestThreatTarget)

Priority 3: No valid targets
            → Pass()
```

**Threat Calculation**:

- Damage Output: 40% weight
- Enemy Health: 30% weight
- Enemy Accuracy: 20% weight
- Special Abilities: 10% weight

### Defensive State

```
Priority 1: Self HP < 50%?
            → Heal(Self) if available and affordable

Priority 2: Ally HP < 40%?
            → Heal(WeakestAlly) if available and affordable

Priority 3: Threat level > 60%?
            → Defend()

Priority 4: Otherwise reduced-damage attack
            → Attack(HighestThreatTarget)
```

### Tactical State (Optional mid-tier)

```
Priority 1: Any status effects affecting team?
            → Cleanse() if available

Priority 2: Highest-threat target healthy (>60%) and dangerous?
            → Debuff(HighestThreat) to reduce damage

Priority 3: Any ally critical (HP < 30%)?
            → Heal(CriticalAlly)

Priority 4: Otherwise standard attack
            → Attack(HighestThreatTarget)
```

### Flee State

```
Priority 1: Have defensive ability?
            → UseAbility(DefensiveAbility, Self)

Priority 2: Can heal?
            → Heal(Self)

Priority 3: Threat > 50%?
            → Defend()

Priority 4: Otherwise minimal action
            → Pass()

Transition after 5 rounds → Surrender/Dead state
```

---

## 3. Gotchas & Preventions

### Gotcha #1: State Flickering

**Problem**: AI rapidly switches between Aggressive and Defensive because health lands on threshold.

**Prevention**: Use hysteresis (different entry/exit thresholds)

```csharp
// Entry threshold: 45%
if (health < 0.45f) isDefensive = true;

// Exit threshold: 65% (different!)
if (health > 0.65f) isDefensive = false;
```

**Test**: Log state changes per turn, ensure no rapid oscillation

---

### Gotcha #2: Null Reference on Target Selection

**Problem**: Selecting invalid targets (dead, null, distance-invalid)

**Prevention**: Always filter before selection

```csharp
var target = context.Enemies
    .Where(e => !e.IsDead)
    .Where(e => e.HealthPercent > 0)
    .OrderByDescending(e => threatMap[e])
    .FirstOrDefault();

return target != null ? Attack(target) : Pass();
```

**Test**: Run with all enemies dead, verify action is Pass()

---

### Gotcha #3: Ability Cooldown Not Checked

**Problem**: AI selects an ability that's on cooldown, action fails

**Prevention**: Check cooldown before selection

```csharp
if (abilityId.GetCooldown() > 0)
    return null; // Not available this turn

if (!self.CanAfford(ability))
    return null; // Not enough resources
```

**Test**: Verify cooldown decrements, abilities become available

---

### Gotcha #4: Action Selection During Transition

**Problem**: Modifying state during action selection causes desync

**Prevention**: Separate concerns strictly

```csharp
// WRONG:
SelectAction() {
    currentState = Defensive; // Don't do this!
    return action;
}

// RIGHT:
Update(context) {
    nextState = EvaluateTransition(context);
    if (nextState != currentState) TransitionTo(nextState);
}

SelectAction(context) {
    // Only read current state, don't modify
}
```

**Test**: Verify state changes only happen in Update(), not SelectAction()

---

### Gotcha #5: Threat Map Becomes Stale

**Problem**: Using cached threat calculation from previous turn when enemies died

**Prevention**: Recalculate when enemy count changes

```csharp
if (enemies.Count != cachedEnemyCount) {
    threatMap = CalculateFresh();
    cachedEnemyCount = enemies.Count;
}
```

**Test**: Kill an enemy, verify threat map recalculates

---

## 4. Performance Optimization Checklist

| Issue                                    | Solution                                     | Saves            |
| ---------------------------------------- | -------------------------------------------- | ---------------- |
| Recalculating threats every action       | Cache, invalidate only on enemy count change | ~60% CPU         |
| LINQ allocations in hot path             | Use `foreach` with manual filtering          | ~40% GC pressure |
| Creating new decision context per action | Reuse/pool context objects                   | ~30% allocations |
| Evaluating all abilities for match       | Use indexed ability registry                 | ~50% lookup time |
| String comparisons for ability IDs       | Use enums or integer IDs                     | ~25% lookup time |

**Production Profile Targets**:

- Threat calculation: < 1ms for 8 combatants
- Action selection: < 2ms per decision
- State evaluation: < 0.5ms per state
- Total per turn: < 5ms impact

---

## 5. Difficulty Scaling

Wrap main controller with difficulty layer:

```csharp
public enum Difficulty { Easy, Normal, Hard, Brutal }

Easy:
  - Random target selection (30% of time)
  - Skip higher-tier abilities
  - Don't use debuffs
  - Conservative threat assessment

Normal:
  - Use base logic from patterns
  - Balanced threat evaluation
  - Mix of standard abilities

Hard:
  - Optimize target selection for damage
  - Use high-damage combos when available
  - Aggressive threat revaluation
  - Coordinate ability chains

Brutal:
  - AI plans 2 turns ahead
  - Reads player patterns
  - Pre-positions for combos
  - Coordinates with allies
```

**Implementation**:

```csharp
public class DifficultyAdjustedAI : ICombatAIController
{
    private readonly ICombatAIController _baseAI;
    private readonly Difficulty _difficulty;

    public CombatAction DecideAction(CombatContext context)
    {
        var action = _baseAI.DecideAction(context);

        return _difficulty switch
        {
            Difficulty.Easy => RandomizeAction(action),
            Difficulty.Normal => action,
            Difficulty.Hard => OptimizeAction(action, context),
            Difficulty.Brutal => PlanAhead(action, context),
            _ => action
        };
    }
}
```

---

## 6. Testing Strategy

### Unit Tests (Per-State Behavior)

```csharp
[TestMethod]
public void AggressiveState_TargetsHighestThreat()
{
    // Set up: self, 2 enemies with different threats
    // Action: Select action
    // Assert: Target is highest threat
}

[TestMethod]
public void DefensiveState_WithLowHealth_Heals()
{
    // Set up: self at 35% HP, ability available
    // Action: Select action
    // Assert: Action is Heal
}

[TestMethod]
public void FleeState_WithLongDuration_Surrenders()
{
    // Set up: 5+ rounds in flee
    // Action: Evaluate transition
    // Assert: Next state is Dead
}
```

### Integration Tests (State Transitions)

```csharp
[TestMethod]
public void HealthDropTriggers_AggressiveToDefensive()
{
    // Start: Aggressive, full health
    // Simulate: Health drops to 40%
    // Assert: Transition to Defensive occurs
}

[TestMethod]
public void HysteresisWorks_NoFlickering()
{
    // Health oscillates at threshold
    // Assert: No state changes while in hysteresis band
}
```

### Combat Logs to Verify

```
Turn 1: [Aggressive] Health: 100% | AvgThreat: 0.6 | Action: Attack(Goblin)
Turn 2: [Aggressive] Health: 75% | AvgThreat: 0.65 | Action: Attack(Goblin)
Turn 3: [Aggressive] Health: 45% | AvgThreat: 0.7 | Action: Defend() [TransitionedToDefensive]
Turn 4: [Defensive] Health: 35% | AvgThreat: 0.75 | Action: Heal()
...
```

---

## 7. DiceEngine Integration Points

### In your Combat System:

1. **Combat Orchestrator** → Calls `GetAIActionAsync()` for each enemy turn
2. **Ability System** → Ability registry passed to AI states
3. **Character Entity** → Must implement `IAICombatant` interface
4. **Turn Manager** → Manages action queue from AI decisions
5. **UI/Logging** → Display AI state changes for debugging

### Required Interfaces to Define:

```csharp
// In DiceEngine.Domain
interface IAICombatant { ... }          // Combatant with AI properties
interface IAbilityRegistry { ... }      // Get ability definitions
interface IThreatAssessmentService { }  // Calculate threat levels

// In DiceEngine.Application
interface ICombatAIController { }        // Main AI orchestrator
interface ICombatTurnService { }        // Combat turn integration
```

---

## 8. Recommended Implementation Order

### Week 1: Foundation

- [ ] Define `IAICombatant` and core types (`CombatState`, `CombatAction`)
- [ ] Implement base `CombatAIState` abstract class
- [ ] Create `AggressiveAIState` and `DefensiveAIState`
- [ ] Build `HierarchicalCombatAIController`
- **Deliverable**: Simple Aggressive ↔ Defensive switching

### Week 2: Threat & Decisions

- [ ] Implement `ThreatAssessmentService`
- [ ] Add hysteresis to prevent state flickering
- [ ] Implement intelligent target selection (highest threat ranking)
- [ ] Add ability cost/cooldown checking
- **Deliverable**: Combatants pick smart targets

### Week 3: Action Variety

- [ ] Add `FleeAIState` for low health
- [ ] Implement healing logic in Defensive state
- [ ] Add finishing-blow detection in Aggressive
- [ ] Weapon/ability selection per state
- **Deliverable**: Full combat behavior variety

### Week 4: Polish & Tune

- [ ] Add `DebugCombatAILogger` for AI decisions
- [ ] Implement difficulty scaling wrapper
- [ ] Profile and optimize hot paths
- [ ] Unit tests and balance tuning
- **Deliverable**: Production-ready AI

---

## 9. Quick Decision Reference Card

Print this for development:

```
AGGRESSIVE: Attack highest threat. Finish < 30% HP targets.
DEFENSIVE: Heal self < 50% and allies < 40%. Defend if threat > 0.6.
TACTICAL: Cleanse, debuff threats, assist allies.
FLEE: Use protective abilities, heal, defend. Surrender after 5 turns.

TRANSITION RULES (Hysteresis):
  → Aggressive  (Health > 65%)
  → Defensive   (45% < Health ≤ 65%, Threat > 0.5)
  → Flee        (Health ≤ 20% OR (Health < 45% AND Threat > 0.8))
  → Dead        (Health = 0%)

THREAT SCORE: 40% dmg + 30% durability + 20% accuracy + 10% specials

GOTCHAS:
  1. No hysteresis = state flicker (fix: entry ≠ exit threshold)
  2. Dead target selected = null ref (fix: filter IsDead)
  3. Ability on cooldown = action fails (fix: check first)
  4. State change in SelectAction = desync (fix: only in Update)
  5. Stale threat map = wrong target (fix: recalc on count change)
```

---

## 10. Debugging Commands

For in-game debugging (if you add a console):

```bash
# Show current AI state of enemy
/ai_state [enemy_id]

# Toggle verbose AI logging
/ai_debug [on|off]

# Dump threat assessment
/ai_threats [enemy_id]

# Force state transition (for testing)
/ai_force_state [id] [state]

# Profile AI performance
/ai_profile [duration_seconds]
```

---

## 11. Real Combat Scenario Examples

### Scenario 1: 1v1 Duel

```
Enemy: 100 HP, 15 Dmg, Full health
Player: 100 HP, 12 Dmg, Full health

Turn 1: Enemy[Aggressive] → Attack(Player) [Threat calc: 0.75]
Turn 2: Player counters with ability
Turn 3: Enemy[Aggressive] → Attack(Player)
Turn 4: Enemy[Aggressive] → Attack(Player) [NOW 40 HP]
Turn 5: Enemy[Defensive] → Defend() [Health dropped below threshold]
Turn 6: Enemy[Defensive] → Heal()
```

### Scenario 2: Outnumbered 1v3

```
Enemy1: 80 HP, 10 Dmg | Enemy2: 60 HP, 12 Dmg | Enemy3: 70 HP, 8 Dmg
Player: 100 HP full health

Turn 1: All[Aggressive] → Target highest threat collectively
Turn 2: Player takes 30 Dmg (10+12+8)
Turn 3: Enemy closest to death[Aggressive] → Attack (finish?)
        Others → Attack highest threat
Turn 4: Player at 70 HP → Enemies[Defensive] if threat > 0.8
        OR Player near-death → All[Aggressive] for kill
```

### Scenario 3: Healer Present

```
Healer: Tank with heal ability | Fighter: Pure damage
vs. Player: Solo character

Turn 1: Fighter[Aggressive] → Attack(Player)
Turn 2: Player counters Healer
Turn 3: Healer[Defensive] → Heal(Fighter) [Fighter HP < 40%]
        Fighter[Aggressive] → Attack(Player)
Turn 4: Player targets Healer to stop healing
        Fighter[Tactical] → Debuff(Player) if available
```

---

## 12. Metrics to Track

Add telemetry to monitor AI behavior:

```csharp
// Track per-combat
- Average state transitions per turn
- % of turns in each state
- Average decision time per AI
- Target prioritization (who gets attacked most)
- Ability usage rates per state
- Win/loss ratio vs difficulty

// Red flags
- > 2 state changes per turn (flickering)
- Decision time > 5ms (performance)
- Unused abilities in deck
- 100% attacks on same target (no variation)
```

---

## Questions to Ask During Implementation

- [ ] What's your maximum combatant count? (Affects threat calculation frequency)
- [ ] Do you have crowd-control abilities? (Add to threat scoring)
- [ ] Can enemies run at range? (Add distance to threat)
- [ ] Do abilities have positional effects? (Add positioning logic)
- [ ] Can you summon allies? (Add ally-aware AI)
- [ ] What's your target frame time? (How much AI compute budget do we have?)
