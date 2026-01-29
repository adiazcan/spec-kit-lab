# AI State Machine Patterns for Turn-Based RPG Combat Systems

## Executive Summary

This document provides a comprehensive guide to implementing AI state machines for turn-based RPG combat. It covers foundational patterns, state transition mechanics, action selection strategies, C#/.NET implementation approaches, and production best practices.

---

## Part 1: State Machine Fundamentals

### 1.1 Core Architecture Decision

**Decision: Classic State Machine vs Hierarchical State Machine vs Behavior Tree**

| Pattern              | Best For                                    | Trade-offs                                          |
| -------------------- | ------------------------------------------- | --------------------------------------------------- |
| **Classic FSM**      | Simple combat with 3-5 states               | Limited complexity; hard to manage many transitions |
| **Hierarchical FSM** | Nested behaviors (Aggressive → Attack Type) | More flexible; higher complexity                    |
| **Behavior Tree**    | Complex decision trees; easy debugging      | Overkill for simple systems                         |

**Recommendation for Turn-Based RPG**: **Hierarchical State Machine (HFSM)**

- Allows grouping related states (e.g., all Offensive states under Aggressive parent)
- Better handles state transition conditions
- More scalable than flat FSM

**Rationale**:

- Turn-based systems have predictable, discrete action phases
- Combat has clear macro-states (Aggressive, Defensive, Flee) with sub-strategies
- Conditions are evaluable synchronously (no need for behavior tree overhead)

**Alternative**: Behavior Trees if you need:

- Real-time decision updates
- Complex priority-based action selection
- Visual editing in game engine

### 1.2 State Definition Pattern

**Primary Pattern: Enum-based State Machine**

```csharp
public enum CombatState
{
    Idle,
    Aggressive,
    Defensive,
    Tactical,
    Flee,
    Dead
}

public interface ICombatAI
{
    CombatState CurrentState { get; }
    void EvaluateState(CombatContext context);
    CombatAction SelectAction(CombatContext context);
}
```

**Decision: Enum vs Class-based States**

| Approach        | Enum                       | Class-based               |
| --------------- | -------------------------- | ------------------------- |
| Memory          | ✓ Very low                 | ✗ Higher per instance     |
| Logic placement | Separate switch statements | ✓ Encapsulated in states  |
| Type safety     | ✓ Compile-time             | Depends on implementation |
| Extensibility   | Poor (closed to extension) | ✓ Open/Closed Principle   |

**Recommendation**: **Class-based States for production systems**

```csharp
public abstract class CombatAIState
{
    public abstract void OnEnterState(IAICombatant combatant);
    public abstract void OnExitState(IAICombatant combatant);
    public abstract CombatState Evaluate(CombatContext context);
    public abstract CombatAction SelectAction(CombatContext context);
}
```

---

## Part 2: State Transition Conditions

### 2.1 Health Threshold System

**Decision: Hard Thresholds vs Soft Thresholds vs Weighted Scoring**

```csharp
// PATTERN 1: Hard Thresholds (Simple)
public class HealthThresholdTransitionRule
{
    public bool ShouldTransitionToFlee(IAICombatant combatant)
        => combatant.HealthPercent <= 0.25f;

    public bool ShouldTransitionToDefensive(IAICombatant combatant)
        => combatant.HealthPercent <= 0.50f;
}

// PATTERN 2: Soft Thresholds with Hysteresis (Prevents Flickering)
public class HysteresisTransitionRule
{
    private readonly float _transitionThreshold = 0.40f;
    private readonly float _exitThreshold = 0.50f;
    private bool _inDefensiveMode = false;

    public bool ShouldBeInDefensive(IAICombatant combatant)
    {
        if (!_inDefensiveMode && combatant.HealthPercent <= _transitionThreshold)
            _inDefensiveMode = true;

        if (_inDefensiveMode && combatant.HealthPercent > _exitThreshold)
            _inDefensiveMode = false;

        return _inDefensiveMode;
    }
}

// PATTERN 3: Weighted Scoring (Most Flexible)
public class TransitionScoreEvaluator
{
    public float EvaluateStateScore(EvaluationContext context, CombatState candidate)
    {
        float score = 0f;

        // Health weight: 40%
        score += (1f - context.HealthPercent) * 40f;

        // Threat weight: 35%
        score += context.ThreatLevel * 35f;

        // Resource weight: 25%
        score += context.ResourceLack * 25f;

        return score;
    }
}
```

**Recommendation**: **Hysteresis-based Thresholds** for two-state transitions (e.g., Aggressive ↔ Defensive)

**Rationale**:

- Prevents state flickering (oscillation between states)
- Simple to implement and understand
- Matches human decision-making patterns
- Good performance

**Gotcha**: Without hysteresis, if health lands exactly on threshold and swings slightly, AI rapidly switches states → looks broken to players.

---

### 2.2 Threat Assessment System

**Multi-factor Threat Evaluation**

```csharp
public struct ThreatAssessment
{
    public float ThreatLevel { get; set; }           // 0.0f - 1.0f
    public IAICombatant HighestThreat { get; set; }
    public int ActiveThreats { get; set; }
    public float AverageThreatDamage { get; set; }
}

public class ThreatEvaluator
{
    public ThreatAssessment CalculateThreat(
        IAICombatant self,
        IReadOnlyList<IAICombatant> enemies)
    {
        var threats = new List<float>();
        IAICombatant highest = null;
        float maxThreat = 0f;

        foreach (var enemy in enemies)
        {
            float threat = CalculateSingleThreat(self, enemy);
            threats.Add(threat);

            if (threat > maxThreat)
            {
                maxThreat = threat;
                highest = enemy;
            }
        }

        return new ThreatAssessment
        {
            ThreatLevel = threats.Count > 0 ? threats.Average() : 0f,
            HighestThreat = highest,
            ActiveThreats = threats.Count(t => t > 0.3f),
            AverageThreatDamage = threats.Average()
        };
    }

    private float CalculateSingleThreat(IAICombatant self, IAICombatant enemy)
    {
        if (enemy.IsDead) return 0f;

        float threat = 0f;

        // Factor 1: Enemy damage output (40%)
        float damageRating = enemy.EstimatedDamagePerTurn / self.MaxHealth;
        threat += Math.Min(damageRating, 1f) * 0.40f;

        // Factor 2: Enemy health/durability (30%)
        float durability = 1f - (enemy.HealthPercent * 0.5f); // Inverse: healthier = more threat
        threat += durability * 0.30f;

        // Factor 3: Enemy accuracy/crit (20%)
        threat += enemy.AccuracyRating * 0.20f;

        // Factor 4: Enemy special abilities (10%)
        threat += (enemy.HasDangerousAbility ? 1f : 0f) * 0.10f;

        return Math.Min(threat, 1f);
    }
}
```

**Decision: Single Threat vs Distributed Threat Assessment**

| Approach       | Single-Threat               | Multi-Threat              |
| -------------- | --------------------------- | ------------------------- |
| Implementation | Target highest threat first | Evaluate all threats      |
| Behavior       | Focused, predictable        | Realistic, spreads damage |
| Challenge      | Easy to out-play            | More tactical             |

**Recommendation**: **Distributed with prioritization** (threats > 0.3f are "active")

**Rationale**:

- More challenging gameplay
- Better reflects tactical reality
- Encourages varied party strategies

---

### 2.3 Resource Availability Tracking

**Decision: Hard Resource Checks vs Dynamic Resource Management**

```csharp
public interface IResourceTracker
{
    int Mana { get; }
    int Stamina { get; }
    int ActionPoints { get; }
    int Cooldown(string ability) { get; }
}

// PATTERN: Resources with Cooldown Tracking
public class CombatAIResourceEvaluator
{
    public bool CanUseAbility(string abilityId, IResourceTracker resources)
    {
        var ability = _abilityRegistry.Get(abilityId);

        if (!CanAfford(ability, resources))
            return false;

        if (resources.Cooldown(abilityId) > 0)
            return false;

        return true;
    }

    private bool CanAfford(Ability ability, IResourceTracker resources)
    {
        if (ability.ResourceCost.Mana > resources.Mana)
            return false;

        if (ability.ResourceCost.Stamina > resources.Stamina)
            return false;

        return true;
    }

    public float GetResourceAvailabilityScore(IResourceTracker resources)
    {
        float score = 0f;

        // Normalize resources to 0-1
        float manaScore = Math.Min(resources.Mana / 100f, 1f);
        float staminaScore = Math.Min(resources.Stamina / 100f, 1f);

        score = (manaScore + staminaScore) / 2f;

        return score;
    }
}
```

---

## Part 3: Action Selection Per State

### 3.1 Aggressive State Actions

**Decision: Attack Patterns**

```csharp
public class AggressiveAIState : CombatAIState
{
    public override CombatAction SelectAction(CombatContext context)
    {
        var targets = context.AvailableTargets.Where(t => !t.IsDead).ToList();
        if (targets.Count == 0) return CombatAction.Pass();

        // PATTERN 1: Attack Highest Threat (Default)
        var highestThreat = SelectByHighestThreat(targets, context);

        // Check for opportunity for burst damage
        if (ShouldBurstDamage(context))
            return SelectBurstAttack(highestThreat, context);

        return SelectStandardAttack(highestThreat);
    }

    private bool ShouldBurstDamage(CombatContext context)
    {
        // Use high-damage abilities when:
        // - Enemy is low health
        // - Self has high resources
        // - Critical ability is off cooldown
        return context.TargetHealthPercent < 0.30f
            && context.ResourceAvailability > 0.75f
            && !context.HasCriticalAbilityCooldown;
    }

    private IAICombatant SelectByHighestThreat(
        List<IAICombatant> targets,
        CombatContext context)
    {
        // PATTERN: Weighted target selection
        var scores = new Dictionary<IAICombatant, float>();

        foreach (var target in targets)
        {
            float score = 0f;

            // Immediate threat (their damage)
            score += context.Threats[target] * 0.50f;

            // Distance (prefer closer = harder to escape)
            score += (1f - target.DistanceNormalized) * 0.30f;

            // Low health (finish weak targets)
            score += (1f - target.HealthPercent) * 0.20f;

            scores[target] = score;
        }

        return scores.OrderByDescending(x => x.Value).First().Key;
    }
}

// PATTERN: Alternative - Attack Lowest Health (Finish Strategy)
public class FinishingAggressiveAIState : CombatAIState
{
    public override CombatAction SelectAction(CombatContext context)
    {
        var weakest = context.AvailableTargets
            .Where(t => !t.IsDead)
            .OrderBy(t => t.Health)
            .FirstOrDefault();

        return SelectAttack(weakest);
    }
}
```

**Recommendation Decision Matrix**:

| Threat Level            | AI Behavior         | Rationale                   |
| ----------------------- | ------------------- | --------------------------- |
| High threat, 1 enemy    | Focus attacker      | Eliminate immediate danger  |
| High threat, 2+ enemies | Divide focus        | Prevent overwhelm           |
| Low threat              | Finish weak targets | Reduce enemy numbers safely |
| Mixed threat            | Weighted scoring    | Balanced, realistic         |

---

### 3.2 Defensive State Actions

**Decision: Passive Defense vs Active Damage Mitigation**

```csharp
public class DefensiveAIState : CombatAIState
{
    public override CombatAction SelectAction(CombatContext context)
    {
        // PATTERN 1: Straight Defense Stance
        if (context.Threats.Average() > 0.7f)
            return CombatAction.Defend();

        // PATTERN 2: Heal if below threshold
        if (context.SelfHealthPercent < 0.50f && CanHeal(context))
            return CombatAction.Heal();

        // PATTERN 3: Buff/Shield allies
        if (HasWeakAlly(context) && CanBuff(context))
            return CombatAction.Buff(GetWeakestAlly(context));

        // PATTERN 4: Counter-attack with medium threat
        if (context.Threats.Average() < 0.50f)
            return SelectCounterAttack(context);

        // Fallback: reduced damage attack
        return SelectScaled Attack(context, 0.5f); // 50% of normal damage
    }

    private CombatAction SelectCounterAttack(CombatContext context)
    {
        // Use abilities that damage when defending
        var counterAbilities = context.AvailableAbilities
            .Where(a => a.HasCounter && CanAfford(a, context))
            .ToList();

        if (counterAbilities.Count > 0)
        {
            // Pick highest damage counter
            return CombatAction.UseAbility(
                counterAbilities.OrderByDescending(a => a.Damage).First()
            );
        }

        return SelectAttackWithLowestDamage(context);
    }

    private bool HasWeakAlly(CombatContext context)
    {
        return context.Allies.Any(a => !a.IsDead && a.HealthPercent < 0.40f);
    }
}
```

**Rationale**: Defensive state should **preserve resources while maintaining team viability**

**Gotcha**: If Defensive state always just defends, it becomes a useless state. Mix in healing/buffing for tactical value.

---

### 3.3 Tactical State (Mid-tier Positioning)

**Decision: When to introduce Tactical State vs just Aggressive/Defensive split**

```csharp
public class TacticalAIState : CombatAIState
{
    public override CombatAction SelectAction(CombatContext context)
    {
        // Use when health is moderate (50-75%) and threats are mixed

        // Priority 1: Prevent status effects
        if (ShouldCleanse(context))
            return CombatAction.CleansStatus();

        // Priority 2: Apply debuffs to strongest enemies
        var highestThreat = GetHighestThreat(context);
        if (ShouldDebuff(highestThreat, context))
            return CombatAction.Debuff(highestThreat);

        // Priority 3: Heal teammates if critical
        if (HasCriticalAlly(context))
            return CombatAction.HealAlly(GetCriticalAlly(context));

        // Priority 4: Standard attack
        return SelectStandardAttack(highestThreat);
    }

    private bool ShouldCleanse(CombatContext context)
    {
        // Check if self or allies have dangerous status effects
        return context.Self.HasStatus("Poison", "Burn", "Curse")
            || context.Allies.Any(a => a.HasStatus("Paralysis"));
    }

    private bool ShouldDebuff(IAICombatant target, CombatContext context)
    {
        // Apply debuff if target is healthy but dangerous
        return target.HealthPercent > 0.60f
            && target.Threat > 0.70f
            && CanAfford(context.GetAbility("Debuff"), context);
    }
}
```

**Recommendation**: Include Tactical state for mid-range combat scenarios

---

### 3.4 Flee State (Survival Priority)

**Decision: Flee vs Retreat vs Surrender**

```csharp
public class FleeAIState : CombatAIState
{
    private readonly float _fleeHealthThreshold = 0.20f;
    private readonly int _turnsBeforeSurrender = 10;
    private int _fleeCounter = 0;

    public override CombatState Evaluate(CombatContext context)
    {
        // Exit flee if health recovers or threats eliminated
        if (context.SelfHealthPercent > 0.50f)
            return CombatState.Aggressive;

        if (context.ActiveEnemies < 1)
            return CombatState.Idle;

        _fleeCounter++;
        return CombatState.Flee;
    }

    public override CombatAction SelectAction(CombatContext context)
    {
        // Don't flee instantly - try healing first
        if (CanHeal(context) && !HasHealed)
            return CombatAction.Heal();

        // PATTERN 1: Move away (if spatial combat)
        if (context.CanMove)
            return CombatAction.Move(DirectionAwayFromThreats(context));

        // PATTERN 2: Summon distraction
        if (context.CanSummon && !HasSummoned)
            return CombatAction.Summon();

        // PATTERN 3: Use defensive ability to buy time
        if (CanUseDefensiveAbility(context))
            return CombatAction.UseAbility(GetBestDefensiveAbility(context));

        // PATTERN 4: Surrender after N turns
        if (_fleeCounter >= _turnsBeforeSurrender)
            return CombatAction.Surrender();

        // Fallback: minimal attack to avoid doing nothing
        return SelectMinimalAttack(context);
    }

    private Vector3 DirectionAwayFromThreats(CombatContext context)
    {
        var threats = context.AvailableTargets.Where(t => !t.IsDead);
        var threatCenter = threats.Aggregate(Vector3.zero, (a, b) => a + b.Position)
                          / threats.Count();

        return (context.Self.Position - threatCenter).normalized;
    }
}
```

**Recommendation**: **Fleeing should not abandon allies** unless it's a cowardly AI archetype

**Alternatives**:

- **Strategic Retreat**: Fight while moving away
- **Berserk Last Stand**: Stop fleeing, commit to final attack
- **Surrender**: Exit combat gracefully

---

## Part 4: C#/.NET Implementation Patterns

### 4.1 Event-Driven State Machine Architecture

**Recommended Implementation Pattern**

```csharp
// Core interfaces
public interface ICombatAI
{
    event EventHandler<StateChangeEvent> StateChanged;
    event EventHandler<ActionSelectedEvent> ActionSelected;

    CombatState CurrentState { get; }
    void Update(CombatContext context);
    CombatAction GetNextAction(CombatContext context);
}

public class HierarchicalCombatAI : ICombatAI
{
    private readonly Dictionary<CombatState, CombatAIState> _states;
    private CombatState _currentState;
    private CombatAIState _parentState;

    public event EventHandler<StateChangeEvent> StateChanged;
    public event EventHandler<ActionSelectedEvent> ActionSelected;

    public CombatState CurrentState => _currentState;

    public HierarchicalCombatAI(IStateFactory stateFactory)
    {
        _states = new Dictionary<CombatState, CombatAIState>
        {
            { CombatState.Aggressive, stateFactory.Create<AggressiveAIState>() },
            { CombatState.Defensive, stateFactory.Create<DefensiveAIState>() },
            { CombatState.Tactical, stateFactory.Create<TacticalAIState>() },
            { CombatState.Flee, stateFactory.Create<FleeAIState>() },
        };

        TransitionTo(CombatState.Aggressive);
    }

    public void Update(CombatContext context)
    {
        // Evaluate state transitions first
        var nextState = _currentState == CombatState.Dead
            ? CombatState.Dead
            : _states[_currentState].Evaluate(context);

        if (nextState != _currentState)
        {
            TransitionTo(nextState);
        }
    }

    public CombatAction GetNextAction(CombatContext context)
    {
        var action = _states[_currentState].SelectAction(context);

        ActionSelected?.Invoke(this, new ActionSelectedEvent
        {
            Action = action,
            State = _currentState,
            Context = context
        });

        return action;
    }

    private void TransitionTo(CombatState newState)
    {
        _states[_currentState]?.OnExitState(_self);
        _currentState = newState;
        _states[_currentState]?.OnEnterState(_self);

        StateChanged?.Invoke(this, new StateChangeEvent
        {
            PreviousState = _currentState,
            NewState = newState,
            Timestamp = DateTime.UtcNow
        });
    }
}
```

### 4.2 Decision Tree Evaluation Pattern (Alternative)

**For more complex decision-making**

```csharp
public interface IDecisionNode
{
    bool Evaluate(CombatContext context);
    IDecisionNode TrueNode { get; set; }
    IDecisionNode FalseNode { get; set; }
}

public class HealthThresholdDecision : IDecisionNode
{
    private readonly float _threshold;

    public HealthThresholdDecision(float threshold)
    {
        _threshold = threshold;
    }

    public bool Evaluate(CombatContext context)
        => context.SelfHealthPercent <= _threshold;

    public IDecisionNode TrueNode { get; set; }
    public IDecisionNode FalseNode { get; set; }
}

public class ActionLeaf : IDecisionNode
{
    public CombatAction Action { get; }

    public ActionLeaf(CombatAction action)
    {
        Action = action;
    }

    public bool Evaluate(CombatContext context) => true;
    public IDecisionNode TrueNode { get; set; }
    public IDecisionNode FalseNode { get; set; }
}

// Usage
public class DecisionTreeAI : ICombatAI
{
    private readonly IDecisionNode _rootDecision;

    public DecisionTreeAI()
    {
        // Build tree structure
        var fleeLeaf = new ActionLeaf(CombatAction.Flee());
        var defendLeaf = new ActionLeaf(CombatAction.Defend());
        var attackLeaf = new ActionLeaf(CombatAction.Attack());

        var healthCheck = new HealthThresholdDecision(0.25f)
        {
            TrueNode = fleeLeaf,
            FalseNode = new HealthThresholdDecision(0.50f)
            {
                TrueNode = defendLeaf,
                FalseNode = attackLeaf
            }
        };

        _rootDecision = healthCheck;
    }

    public CombatAction GetNextAction(CombatContext context)
    {
        var node = _rootDecision;
        while (node is not ActionLeaf leaf)
        {
            node = node.Evaluate(context) ? node.TrueNode : node.FalseNode;
        }

        return leaf.Action;
    }
}
```

### 4.3 Action Priority Queue Pattern

**Useful for multiple viable actions**

```csharp
public interface IActionRanker
{
    float RankAction(CombatAction action, CombatContext context);
}

public class PriorityBasedActionSelector
{
    private readonly List<IActionRanker> _rankers;

    public CombatAction SelectBestAction(
        IEnumerable<CombatAction> availableActions,
        CombatContext context)
    {
        var scores = new Dictionary<CombatAction, float>();

        foreach (var action in availableActions)
        {
            float score = 0f;

            foreach (var ranker in _rankers)
            {
                score += ranker.RankAction(action, context);
            }

            scores[action] = score;
        }

        return scores.OrderByDescending(x => x.Value).First().Key;
    }
}

// Ranker implementations
public class SurvivalRanker : IActionRanker
{
    public float RankAction(CombatAction action, CombatContext context)
    {
        if (action.Type == ActionType.Defend)
            return context.SelfHealthPercent < 0.50f ? 100f : 10f;

        if (action.Type == ActionType.Heal)
            return context.SelfHealthPercent < 0.40f ? 80f : 0f;

        return 0f;
    }
}

public class ThreatEliminationRanker : IActionRanker
{
    public float RankAction(CombatAction action, CombatContext context)
    {
        if (action.Type == ActionType.Attack)
        {
            var target = action.Target;
            return target.HealthPercent < 0.30f ? 50f : 20f; // Bonus for finishing blows
        }

        return 0f;
    }
}
```

---

## Part 5: Common Gotchas & Best Practices

### 5.1 State Transition Gotchas

| Issue                       | Symptom                             | Fix                                          |
| --------------------------- | ----------------------------------- | -------------------------------------------- |
| **No hysteresis**           | State flickers rapidly              | Add exit threshold above entry threshold     |
| **Synchronous transitions** | State changes mid-action evaluation | Evaluate transitions before action selection |
| **Dead state unreachable**  | AI continues acting after death     | Explicitly check `IsDead` before all actions |
| **Missing state**           | Null reference on transition        | Use enum with exhaustive switch/dictionary   |
| **Circular transitions**    | A→B→C→A endless loop                | Add maximum transition count per turn        |

### 5.2 Action Selection Gotchas

```csharp
// GOTCHA 1: Forgetting to check ability cooldowns
// ❌ BAD: Doesn't check if ability is available
public CombatAction SelectAction(CombatContext context)
{
    if (context.SelfHealthPercent < 0.30f)
        return CombatAction.UseAbility("HealSpell"); // Might be on cooldown!
}

// ✓ GOOD: Check availability first
public CombatAction SelectAction(CombatContext context)
{
    if (context.SelfHealthPercent < 0.30f
        && context.IsAbilityAvailable("HealSpell")
        && context.HasMana(100))
        return CombatAction.UseAbility("HealSpell");
}

// GOTCHA 2: Selecting invalid targets
// ❌ BAD: Doesn't filter dead targets
public CombatAction SelectAction(CombatContext context)
{
    var target = context.AvailableTargets.First();
    return CombatAction.Attack(target); // Might be dead!
}

// ✓ GOOD: Always filter
public CombatAction SelectAction(CombatContext context)
{
    var target = context.AvailableTargets
        .Where(t => !t.IsDead && t.HealthPercent > 0)
        .FirstOrDefault();

    return target == null
        ? CombatAction.Pass()
        : CombatAction.Attack(target);
}

// GOTCHA 3: Action causes state change mid-execution
// ❌ BAD: Don't modify state during action selection
public CombatAction SelectAction(CombatContext context)
{
    _currentState = CombatState.Flee; // Never do this!
    return CombatAction.Attack(_target);
}

// ✓ GOOD: Only evaluate, don't transition
public override CombatAction SelectAction(CombatContext context)
{
    // State transitions happen in Update(), not SelectAction()
    return CombatAction.Attack(_target);
}
```

### 5.3 Performance Gotchas

```csharp
// GOTCHA 1: Recalculating threats every action selection
// ❌ BAD: O(n²) threat calculation per action
public CombatAction SelectAction(CombatContext context)
{
    var threats = context.Enemies.Select(e => CalculateThreat(e)).ToList();
    var topThreat = threats.Max();
    // ... more expensive calculations
}

// ✓ GOOD: Cache threat calculation and update when needed
public class CachedThreatEvaluator
{
    private ThreatAssessment _cachedThreat;
    private int _cachedEnemyCount = -1;

    public ThreatAssessment GetThreat(CombatContext context)
    {
        if (context.Enemies.Count != _cachedEnemyCount)
        {
            _cachedThreat = RecalculateThreat(context);
            _cachedEnemyCount = context.Enemies.Count;
        }

        return _cachedThreat;
    }
}

// GOTCHA 2: LINQ allocations in hot path
// ❌ BAD: Multiple LINQ allocations per turn
public CombatAction SelectAction(CombatContext context)
{
    var sorted = context.Targets.OrderBy(t => t.Health).ToList();
    var filtered = sorted.Where(t => !t.IsDead).ToList();
    var selected = filtered.FirstOrDefault();
}

// ✓ GOOD: Single pass, minimal allocations
public CombatAction SelectAction(CombatContext context)
{
    IAICombatant selected = null;
    int minHealth = int.MaxValue;

    foreach (var target in context.Targets)
    {
        if (!target.IsDead && target.Health < minHealth)
        {
            selected = target;
            minHealth = target.Health;
        }
    }

    return selected != null ? CombatAction.Attack(selected) : CombatAction.Pass();
}
```

### 5.4 Testing & Debugging Best Practices

```csharp
// Enable detailed logging for combat AI decisions
public class LoggingCombatAI : ICombatAI
{
    private readonly ICombatAI _innerAI;
    private readonly ILogger _logger;

    public CombatAction GetNextAction(CombatContext context)
    {
        var action = _innerAI.GetNextAction(context);

        _logger.LogInformation($"[{_innerAI.CurrentState}] " +
            $"Health: {context.SelfHealthPercent:P} | " +
            $"Threats: {context.AverageThreat:F2} | " +
            $"Action: {action.Type} [Target: {action.Target?.Name ?? "None"}]");

        return action;
    }
}

// Unit test example
[TestClass]
public class CombatAIStateTests
{
    [TestMethod]
    public void Aggressive_WithLowHealth_TransitionsToDefensive()
    {
        // Arrange
        var ai = new HierarchicalCombatAI(_stateFactory);
        var context = CreateContext(healthPercent: 0.30f);

        // Act
        ai.Update(context);

        // Assert
        Assert.AreEqual(CombatState.Defensive, ai.CurrentState);
    }

    [TestMethod]
    public void Defensive_WithHighHealth_SelectsHeal()
    {
        // Arrange
        var ai = new HierarchicalCombatAI(_stateFactory);
        ai.SetState(CombatState.Defensive);
        var context = CreateContext(healthPercent: 0.35f);

        // Act
        var action = ai.GetNextAction(context);

        // Assert
        Assert.AreEqual(ActionType.Heal, action.Type);
    }
}
```

### 5.5 AI Difficulty Scaling

```csharp
public enum AIDifficulty
{
    Easy,      // Aggressive only, poor targeting
    Normal,    // All states, decent threat assessment
    Hard,      // All states, optimal targeting, resource usage
    Ruthless   // All of above + coordinated allies
}

public class DifficultyAdjustedAI : ICombatAI
{
    private readonly HierarchicalCombatAI _baseAI;
    private readonly AIDifficulty _difficulty;

    public CombatAction GetNextAction(CombatContext context)
    {
        var action = _baseAI.GetNextAction(context);

        return _difficulty switch
        {
            AIDifficulty.Easy =>
                // More random, worse targeting
                Math.Random() < 0.3f ? SelectRandomAction(context) : action,

            AIDifficulty.Normal =>
                // Standard behavior
                action,

            AIDifficulty.Hard =>
                // Optimize action further
                OptimizeActionForDamage(action, context),

            AIDifficulty.Ruthless =>
                // Coordinate with other enemies
                SelectCoordinatedAction(action, context),

            _ => action
        };
    }

    private CombatAction OptimizeActionForDamage(
        CombatAction action,
        CombatContext context)
    {
        // Re-evaluate target selection for maximum efficiency
        if (action.Type == ActionType.Attack)
        {
            var betterTarget = FindOptimalTarget(context);
            if (betterTarget != action.Target)
                return CombatAction.Attack(betterTarget);
        }

        return action;
    }
}
```

---

## Part 6: Recommended Implementation Roadmap

### Phase 1: Core FSM (Week 1)

- [ ] Implement basic state enum + state interface
- [ ] Create Aggressive and Defensive states
- [ ] Simple health-based transitions
- [ ] Basic target selection

### Phase 2: Enhanced Transitions (Week 2)

- [ ] Add hysteresis to prevent flickering
- [ ] Implement threat assessment system
- [ ] Add Tactical and Flee states
- [ ] Resource tracking

### Phase 3: Action Refinement (Week 3)

- [ ] State-specific action selection logic
- [ ] Ability cooldown checking
- [ ] Priority-based action ranking
- [ ] Unit test coverage

### Phase 4: Optimization & Polish (Week 4)

- [ ] Performance profiling and caching
- [ ] Difficulty scaling
- [ ] Combat logging and debugging tools
- [ ] AI behavior review and tuning

---

## Conclusion

The **Hierarchical State Machine** with **hysteresis-based transitions**, **threat assessment**, and **weighted action selection** provides the best balance of:

- ✓ Understandability (easy to debug)
- ✓ Performance (cache-friendly)
- ✓ Extensibility (add new states/abilities)
- ✓ Gameplay quality (challenging but fair)

For your DiceEngine RPG, start with a clean state interface, implement health/threat transitions, and expand action diversity per state.
