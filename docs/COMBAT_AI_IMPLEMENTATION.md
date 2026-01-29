# C# Implementation Guide: Combat AI for DiceEngine

This supplement provides production-ready C# code patterns for implementing the AI state machine in your DiceEngine RPG system.

## 1. Core Interfaces & Types

```csharp
// File: DiceEngine.Domain/Entities/CombatContext.cs
using System;
using System.Collections.Generic;
using System.Linq;

namespace DiceEngine.Domain.Entities
{
    /// <summary>
    /// Immutable snapshot of combat state passed to AI decision-making
    /// </summary>
    public class CombatContext
    {
        public IAICombatant Self { get; }
        public IReadOnlyList<IAICombatant> Enemies { get; }
        public IReadOnlyList<IAICombatant> Allies { get; }
        public Dictionary<IAICombatant, float> ThreatMap { get; }
        public DateTime TurnTimestamp { get; }

        public CombatContext(
            IAICombatant self,
            IReadOnlyList<IAICombatant> enemies,
            IReadOnlyList<IAICombatant> allies,
            Dictionary<IAICombatant, float> threatMap)
        {
            Self = self ?? throw new ArgumentNullException(nameof(self));
            Enemies = enemies ?? throw new ArgumentNullException(nameof(enemies));
            Allies = allies ?? throw new ArgumentNullException(nameof(allies));
            ThreatMap = threatMap ?? throw new ArgumentNullException(nameof(threatMap));
            TurnTimestamp = DateTime.UtcNow;
        }

        // Convenience properties for state machines
        public float SelfHealthPercent => Self.Health / (float)Self.MaxHealth;
        public float AverageThreatLevel => ThreatMap.Values.DefaultIfEmpty(0).Average();
        public int ActiveEnemyCount => Enemies.Count(e => !e.IsDead);
        public bool IsSurrounded => ActiveEnemyCount >= 3;
    }

    /// <summary>
    /// Combat action selected by AI
    /// </summary>
    public class CombatAction
    {
        public enum ActionType
        {
            Attack,
            Defend,
            Heal,
            Debuff,
            BuffAlly,
            UseAbility,
            Pass,
            Flee
        }

        public ActionType Type { get; }
        public IAICombatant Target { get; }
        public string AbilityId { get; }
        public int Priority { get; } // Higher = execute first in turn order

        public static CombatAction Attack(IAICombatant target) =>
            new(ActionType.Attack, target, priority: 2);

        public static CombatAction Defend() =>
            new(ActionType.Defend, null, priority: 1);

        public static CombatAction Heal(IAICombatant target) =>
            new(ActionType.Heal, target, priority: 3);

        public static CombatAction UseAbility(string abilityId, IAICombatant target) =>
            new(ActionType.UseAbility, target, abilityId, priority: 2);

        public static CombatAction Pass() =>
            new(ActionType.Pass, null, priority: 0);

        public static CombatAction Flee() =>
            new(ActionType.Flee, null, priority: 5); // High priority

        private CombatAction(
            ActionType type,
            IAICombatant target = null,
            string abilityId = null,
            int priority = 2)
        {
            Type = type;
            Target = target;
            AbilityId = abilityId;
            Priority = priority;
        }
    }

    /// <summary>
    /// Combat states for AI state machine
    /// </summary>
    public enum CombatState
    {
        Idle,
        Aggressive,
        Defensive,
        Tactical,
        Flee,
        Dead
    }
}
```

```csharp
// File: DiceEngine.Domain/Entities/IAICombatant.cs
using System.Collections.Generic;

namespace DiceEngine.Domain.Entities
{
    /// <summary>
    /// Contract for combatants with AI behavior
    /// </summary>
    public interface IAICombatant
    {
        // Identity
        string Name { get; }
        int Id { get; }

        // Health
        int Health { get; }
        int MaxHealth { get; }
        bool IsDead { get; }
        float HealthPercent => Health / (float)MaxHealth;

        // Resources
        int Mana { get; }
        int MaxMana { get; }
        int Stamina { get; }
        int MaxStamina { get; }

        // Combat stats
        float Damage { get; }
        float Armor { get; }
        float Accuracy { get; }
        float CriticalChance { get; }

        // Status effects
        IReadOnlyList<string> ActiveStatuses { get; }
        bool HasStatus(params string[] statuses);

        // Abilities
        IReadOnlyList<string> AvailableAbilities { get; }
        int GetAbilityCooldown(string abilityId);
    }

    /// <summary>
    /// Extension methods for combat calculations
    /// </summary>
    public static class AICombatantExtensions
    {
        public static float GetThreatScore(this IAICombatant self, IAICombatant other)
        {
            if (other.IsDead) return 0f;

            float threatScore = 0f;

            // Damage factor (40%)
            float damageRating = other.Damage / self.MaxHealth;
            threatScore += Math.Min(damageRating, 1f) * 0.40f;

            // Durability factor (30%)
            float durability = 1f - (other.HealthPercent * 0.5f);
            threatScore += durability * 0.30f;

            // Accuracy factor (20%)
            threatScore += other.Accuracy * 0.20f;

            // Crowd control factor (10%)
            bool hasCrowdControl = other.AvailableAbilities.Any(a => a.Contains("Stun") || a.Contains("Freeze"));
            threatScore += (hasCrowdControl ? 1f : 0f) * 0.10f;

            return Math.Min(threatScore, 1f);
        }

        public static bool CanAffordAbility(
            this IAICombatant self,
            CombatAbilityDefinition ability)
        {
            return self.Mana >= ability.ManaCost
                && self.Stamina >= ability.StaminaCost;
        }

        public static int TurnsUntilAbilityAvailable(
            this IAICombatant self,
            string abilityId)
        {
            return self.GetAbilityCooldown(abilityId);
        }
    }

    /// <summary>
    /// Ability definition for lookups and costs
    /// </summary>
    public class CombatAbilityDefinition
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public float Damage { get; set; }
        public int ManaCost { get; set; }
        public int StaminaCost { get; set; }
        public int CooldownTurns { get; set; }
        public bool IsHeal { get; set; }
        public bool IsDefensive { get; set; }
    }
}
```

---

## 2. State Machine Implementation

```csharp
// File: DiceEngine.Application/Services/Combat/States/CombatAIState.cs
using System;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services.Combat.States
{
    /// <summary>
    /// Base class for all combat AI states
    /// </summary>
    public abstract class CombatAIState
    {
        protected string Name => this.GetType().Name;

        /// <summary>
        /// Called when entering this state
        /// </summary>
        public virtual void OnEnterState(IAICombatant self)
        {
            // Override in derived classes for animations, sounds, etc.
        }

        /// <summary>
        /// Called when exiting this state
        /// </summary>
        public virtual void OnExitState(IAICombatant self)
        {
        }

        /// <summary>
        /// Evaluate whether to transition to a different state
        /// </summary>
        public abstract CombatState EvaluateTransition(CombatContext context);

        /// <summary>
        /// Select the action to perform this turn
        /// </summary>
        public abstract CombatAction SelectAction(CombatContext context);

        /// <summary>
        /// Helper: Random target selection (for variety)
        /// </summary>
        protected IAICombatant SelectRandomTarget(CombatContext context)
        {
            var validTargets = context.Enemies
                .Where(e => !e.IsDead)
                .ToList();

            if (validTargets.Count == 0)
                return null;

            return validTargets[new Random().Next(validTargets.Count)];
        }

        /// <summary>
        /// Helper: Select target with highest threat
        /// </summary>
        protected IAICombatant SelectByHighestThreat(CombatContext context)
        {
            if (!context.ThreatMap.Any())
                return context.Enemies.FirstOrDefault(e => !e.IsDead);

            return context.ThreatMap
                .Where(kvp => !kvp.Key.IsDead)
                .OrderByDescending(kvp => kvp.Value)
                .First()
                .Key;
        }

        /// <summary>
        /// Helper: Select weakest target by health
        /// </summary>
        protected IAICombatant SelectWeakestTarget(CombatContext context)
        {
            return context.Enemies
                .Where(e => !e.IsDead)
                .OrderBy(e => e.Health)
                .FirstOrDefault();
        }

        /// <summary>
        /// Helper: Find ally that needs healing
        /// </summary>
        protected IAICombatant SelectAllyNeedingHealing(CombatContext context, float threshold = 0.5f)
        {
            return context.Allies
                .Where(a => !a.IsDead && a.HealthPercent < threshold)
                .OrderBy(a => a.HealthPercent)
                .FirstOrDefault();
        }
    }
}
```

```csharp
// File: DiceEngine.Application/Services/Combat/States/AggressiveAIState.cs
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services.Combat.States
{
    /// <summary>
    /// Aggressive state: Attack high-threat targets
    /// </summary>
    public class AggressiveAIState : CombatAIState
    {
        private readonly IAbilityRegistry _abilities;
        private readonly float _switchToDefensiveThreshold = 0.45f;
        private readonly float _switchToFleeThreshold = 0.20f;

        public AggressiveAIState(IAbilityRegistry abilities)
        {
            _abilities = abilities ?? throw new ArgumentNullException(nameof(abilities));
        }

        public override void OnEnterState(IAICombatant self)
        {
            // Could log or trigger animation here
        }

        public override CombatState EvaluateTransition(CombatContext context)
        {
            // Check if should flee
            if (context.SelfHealthPercent <= _switchToFleeThreshold)
                return CombatState.Flee;

            // Check if should go defensive
            if (context.SelfHealthPercent <= _switchToDefensiveThreshold
                && context.AverageThreatLevel > 0.5f)
                return CombatState.Defensive;

            // Stay aggressive
            return CombatState.Aggressive;
        }

        public override CombatAction SelectAction(CombatContext context)
        {
            var target = SelectByHighestThreat(context);
            if (target == null)
                return CombatAction.Pass();

            // If enemy is low health, try to finish
            if (target.HealthPercent < 0.30f)
            {
                var finishAbility = FindFinishingAbility(context);
                if (finishAbility != null && context.Self.CanAffordAbility(finishAbility))
                {
                    return CombatAction.UseAbility(finishAbility.Id, target);
                }
            }

            // Otherwise use standard attack
            return CombatAction.Attack(target);
        }

        private CombatAbilityDefinition FindFinishingAbility(CombatContext context)
        {
            return context.Self.AvailableAbilities
                .Select(id => _abilities.GetAbility(id))
                .Where(a => a.Damage > context.Self.Damage * 1.5f) // 50% damage boost
                .OrderByDescending(a => a.Damage)
                .FirstOrDefault();
        }
    }
}
```

```csharp
// File: DiceEngine.Application/Services/Combat/States/DefensiveAIState.cs
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services.Combat.States
{
    /// <summary>
    /// Defensive state: Prioritize survival and healing
    /// </summary>
    public class DefensiveAIState : CombatAIState
    {
        private readonly IAbilityRegistry _abilities;
        private readonly float _defensiveHealthThreshold = 0.45f;
        private readonly float _exitDefensiveThreshold = 0.65f;
        private readonly float _healThreshold = 0.50f;

        // Hysteresis tracking (prevent state flickering)
        private bool _isInDefensiveMode = false;

        public DefensiveAIState(IAbilityRegistry abilities)
        {
            _abilities = abilities ?? throw new ArgumentNullException(nameof(abilities));
        }

        public override CombatState EvaluateTransition(CombatContext context)
        {
            // Hysteresis: entry threshold is different from exit threshold
            if (!_isInDefensiveMode && context.SelfHealthPercent <= _defensiveHealthThreshold)
            {
                _isInDefensiveMode = true;
            }
            else if (_isInDefensiveMode && context.SelfHealthPercent > _exitDefensiveThreshold)
            {
                _isInDefensiveMode = false;
                return CombatState.Aggressive;
            }

            // Check if should flee despite defensive stance
            if (context.SelfHealthPercent <= 0.20f || context.IsSurrounded)
                return CombatState.Flee;

            return CombatState.Defensive;
        }

        public override CombatAction SelectAction(CombatContext context)
        {
            // Priority 1: Heal self if low
            if (context.SelfHealthPercent < _healThreshold)
            {
                var healAbility = FindHealingAbility(context);
                if (healAbility != null && context.Self.CanAffordAbility(healAbility))
                {
                    return CombatAction.UseAbility(healAbility.Id, context.Self);
                }
            }

            // Priority 2: Help weak allies
            var weakAlly = SelectAllyNeedingHealing(context, 0.40f);
            if (weakAlly != null)
            {
                var healAbility = FindHealingAbility(context);
                if (healAbility != null && context.Self.CanAffordAbility(healAbility))
                {
                    return CombatAction.UseAbility(healAbility.Id, weakAlly);
                }
            }

            // Priority 3: Defend
            var target = SelectByHighestThreat(context);
            if (target != null && context.AverageThreatLevel > 0.6f)
            {
                return CombatAction.Defend();
            }

            // Priority 4: Reduced damage attack
            if (target != null)
                return CombatAction.Attack(target);

            return CombatAction.Pass();
        }

        private CombatAbilityDefinition FindHealingAbility(CombatContext context)
        {
            return context.Self.AvailableAbilities
                .Select(id => _abilities.GetAbility(id))
                .Where(a => a.IsHeal && context.Self.GetAbilityCooldown(a.Id) == 0)
                .OrderByDescending(a => a.Damage) // Healing power
                .FirstOrDefault();
        }
    }
}
```

```csharp
// File: DiceEngine.Application/Services/Combat/States/FleeAIState.cs
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services.Combat.States
{
    /// <summary>
    /// Flee state: Prioritize survival over combat
    /// </summary>
    public class FleeAIState : CombatAIState
    {
        private readonly IAbilityRegistry _abilities;
        private readonly float _minFleeHealth = 0.20f;
        private readonly float _recoveryThreshold = 0.50f;
        private int _fleeCounter = 0;
        private readonly int _maxFleeRounds = 5; // Surrender after 5 rounds of fleeing

        public FleeAIState(IAbilityRegistry abilities)
        {
            _abilities = abilities ?? throw new ArgumentNullException(nameof(abilities));
        }

        public override void OnEnterState(IAICombatant self)
        {
            _fleeCounter = 0;
        }

        public override CombatState EvaluateTransition(CombatContext context)
        {
            _fleeCounter++;

            // If health recovers, return to aggressive
            if (context.SelfHealthPercent > _recoveryThreshold && context.ActiveEnemyCount < 3)
            {
                return CombatState.Aggressive;
            }

            // If no enemies left, go idle
            if (context.ActiveEnemyCount == 0)
            {
                return CombatState.Idle;
            }

            // Give up after N rounds
            if (_fleeCounter > _maxFleeRounds)
            {
                return CombatState.Dead; // Simulate surrender as defeat
            }

            return CombatState.Flee;
        }

        public override CombatAction SelectAction(CombatContext context)
        {
            // Priority 1: Use protective abilities
            var defensiveAbility = FindDefensiveAbility(context);
            if (defensiveAbility != null && context.Self.CanAffordAbility(defensiveAbility))
            {
                return CombatAction.UseAbility(defensiveAbility.Id, context.Self);
            }

            // Priority 2: Heal urgently
            var healAbility = FindHealingAbility(context);
            if (healAbility != null && context.Self.CanAffordAbility(healAbility))
            {
                return CombatAction.UseAbility(healAbility.Id, context.Self);
            }

            // Priority 3: Defend
            if (context.AverageThreatLevel > 0.5f)
            {
                return CombatAction.Defend();
            }

            // Fallback: minimal action
            return CombatAction.Pass();
        }

        private CombatAbilityDefinition FindHealingAbility(CombatContext context)
        {
            return context.Self.AvailableAbilities
                .Select(id => _abilities.GetAbility(id))
                .Where(a => a.IsHeal && context.Self.GetAbilityCooldown(a.Id) == 0)
                .First();
        }

        private CombatAbilityDefinition FindDefensiveAbility(CombatContext context)
        {
            return context.Self.AvailableAbilities
                .Select(id => _abilities.GetAbility(id))
                .Where(a => a.IsDefensive && context.Self.GetAbilityCooldown(a.Id) == 0)
                .FirstOrDefault();
        }
    }
}
```

---

## 3. Threat Assessment Engine

```csharp
// File: DiceEngine.Application/Services/Combat/ThreatAssessmentService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services.Combat
{
    /// <summary>
    /// Calculates threat levels for all combatants
    /// </summary>
    public interface IThreatAssessmentService
    {
        Dictionary<IAICombatant, float> CalculateThreatMap(
            IAICombatant evaluator,
            IReadOnlyList<IAICombatant> enemies);
    }

    public class ThreatAssessmentService : IThreatAssessmentService
    {
        // Threat calculation weightings
        private const float DamageWeight = 0.40f;
        private const float DurabilityWeight = 0.30f;
        private const float AccuracyWeight = 0.20f;
        private const float SpecialAbilityWeight = 0.10f;

        public Dictionary<IAICombatant, float> CalculateThreatMap(
            IAICombatant evaluator,
            IReadOnlyList<IAICombatant> enemies)
        {
            var threatMap = new Dictionary<IAICombatant, float>();

            foreach (var enemy in enemies)
            {
                if (enemy.IsDead)
                {
                    threatMap[enemy] = 0f;
                    continue;
                }

                float threatScore = 0f;

                // Damage per turn (potential to kill evaluator)
                float estimatedDamage = enemy.Damage;
                float damageRating = estimatedDamage / evaluator.MaxHealth;
                threatScore += Math.Min(damageRating, 1f) * DamageWeight;

                // Durability (how long until defeated)
                float durability = 1f - (enemy.HealthPercent * 0.5f); // Healthier = higher threat
                threatScore += durability * DurabilityWeight;

                // Accuracy (chance to hit)
                threatScore += enemy.Accuracy * AccuracyWeight;

                // Special abilities
                bool hasDebilitations = enemy.ActiveStatuses.Any(s => s.Contains("Poison") || s.Contains("Curse"));
                bool hasCrowdControl = enemy.AvailableAbilities.Any(a =>
                    a.Contains("Stun") || a.Contains("Freeze") || a.Contains("Paralyze"));

                float specialThreat = hasDebilitations ? 0.5f : 0f;
                specialThreat += hasCrowdControl ? 0.5f : 0f;
                threatScore += specialThreat * SpecialAbilityWeight;

                threatMap[enemy] = Math.Min(threatScore, 1f);
            }

            return threatMap;
        }
    }
}
```

---

## 4. Main AI Controller

```csharp
// File: DiceEngine.Application/Services/Combat/CombatAIController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.Entities;
using DiceEngine.Application.Services.Combat.States;

namespace DiceEngine.Application.Services.Combat
{
    /// <summary>
    /// Main controller for combat AI - manages state machine
    /// </summary>
    public interface ICombatAIController
    {
        CombatState CurrentState { get; }
        CombatAction DecideAction(CombatContext context);
    }

    public class HierarchicalCombatAIController : ICombatAIController
    {
        private readonly Dictionary<CombatState, CombatAIState> _states;
        private CombatState _currentState;
        private IAICombatant _self;

        public CombatState CurrentState => _currentState;

        public HierarchicalCombatAIController(
            IAICombatant self,
            IAbilityRegistry abilityRegistry)
        {
            _self = self ?? throw new ArgumentNullException(nameof(self));

            // Initialize state instances
            _states = new Dictionary<CombatState, CombatAIState>
            {
                { CombatState.Aggressive, new AggressiveAIState(abilityRegistry) },
                { CombatState.Defensive, new DefensiveAIState(abilityRegistry) },
                { CombatState.Flee, new FleeAIState(abilityRegistry) },
            };

            // Start in aggressive state
            _currentState = CombatState.Aggressive;
            _states[_currentState]?.OnEnterState(_self);
        }

        public CombatAction DecideAction(CombatContext context)
        {
            // Step 1: Evaluate state transitions
            var nextState = _states[_currentState].EvaluateTransition(context);
            if (nextState != _currentState)
            {
                TransitionToState(nextState);
            }

            // Step 2: Select action from current state
            var action = _states[_currentState].SelectAction(context);

            return action ?? CombatAction.Pass();
        }

        private void TransitionToState(CombatState newState)
        {
            if (newState == CombatState.Dead)
            {
                _currentState = newState;
                return;
            }

            _states[_currentState]?.OnExitState(_self);
            _currentState = newState;
            _states[_currentState]?.OnEnterState(_self);
        }
    }
}
```

---

## 5. Integration with DiceEngine Service Layer

```csharp
// File: DiceEngine.Application/Services/Combat/CombatTurnService.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services.Combat
{
    /// <summary>
    /// Orchestrates combat turns including AI decision-making
    /// </summary>
    public interface ICombatTurnService
    {
        Task<CombatAction> GetAIActionAsync(
            IAICombatant combatant,
            CombatContext context);
    }

    public class CombatTurnService : ICombatTurnService
    {
        private readonly IThreatAssessmentService _threatService;
        private readonly Dictionary<int, ICombatAIController> _aiControllers;

        public CombatTurnService(IThreatAssessmentService threatService)
        {
            _threatService = threatService ?? throw new ArgumentNullException(nameof(threatService));
            _aiControllers = new Dictionary<int, ICombatAIController>();
        }

        public async Task<CombatAction> GetAIActionAsync(
            IAICombatant combatant,
            CombatContext context)
        {
            // Lazy initialization of AI controller per combatant
            if (!_aiControllers.ContainsKey(combatant.Id))
            {
                _aiControllers[combatant.Id] = new HierarchicalCombatAIController(
                    combatant,
                    GetAbilityRegistry());
            }

            var controller = _aiControllers[combatant.Id];
            var action = controller.DecideAction(context);

            return await Task.FromResult(action);
        }

        private IAbilityRegistry GetAbilityRegistry()
        {
            // Implementation depends on your DiceEngine setup
            return new AbilityRegistry();
        }
    }
}
```

---

## 6. Logging & Debugging Support

```csharp
// File: DiceEngine.Application/Services/Combat/DebugCombatAILogger.cs
using System;
using DiceEngine.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace DiceEngine.Application.Services.Combat.Debugging
{
    /// <summary>
    /// Decorator for logging AI decisions (remove in production)
    /// </summary>
    public class DebugCombatAILogger : ICombatAIController
    {
        private readonly ICombatAIController _innerController;
        private readonly ILogger<DebugCombatAILogger> _logger;

        public CombatState CurrentState => _innerController.CurrentState;

        public DebugCombatAILogger(
            ICombatAIController innerController,
            ILogger<DebugCombatAILogger> logger)
        {
            _innerController = innerController ?? throw new ArgumentNullException(nameof(innerController));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public CombatAction DecideAction(CombatContext context)
        {
            var action = _innerController.DecideAction(context);

            _logger.LogInformation(
                "AI Decision - State: {State} | " +
                "Health: {HealthPercent:P0} | " +
                "AvgThreat: {AvgThreat:F2} | " +
                "Action: {ActionType} [Target: {Target}]",
                CurrentState,
                context.SelfHealthPercent,
                context.AverageThreatLevel,
                action.Type,
                action.Target?.Name ?? "None");

            return action;
        }
    }
}
```

---

## Unit Tests Example

```csharp
// File: DiceEngine.Application.Tests/CombatAIStateTests.cs
using System;
using System.Collections.Generic;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using DiceEngine.Domain.Entities;
using DiceEngine.Application.Services.Combat;
using DiceEngine.Application.Services.Combat.States;

namespace DiceEngine.Application.Tests
{
    [TestClass]
    public class CombatAIStateTests
    {
        private MockAICombatant CreateMockCombatant(
            int health = 100,
            float healthPercent = 1f,
            string name = "TestEnemy")
        {
            return new MockAICombatant
            {
                Name = name,
                Id = new Random().Next(),
                Health = (int)(100 * healthPercent),
                MaxHealth = 100,
                IsDead = healthPercent <= 0,
                Damage = 10f,
                Accuracy = 0.75f,
            };
        }

        [TestMethod]
        public void AggressiveState_SelectsHighestThreatTarget()
        {
            // Arrange
            var mockAbilities = new MockAbilityRegistry();
            var aggressiveState = new AggressiveAIState(mockAbilities);

            var self = CreateMockCombatant(healthPercent: 1f, name: "Hero");
            var highThreatEnemy = CreateMockCombatant(healthPercent: 1f, name: "HighThreat");
            var lowThreatEnemy = CreateMockCombatant(healthPercent: 0.3f, name: "LowThreat");

            var threatMap = new Dictionary<IAICombatant, float>
            {
                { highThreatEnemy, 0.9f },
                { lowThreatEnemy, 0.3f }
            };

            var context = new CombatContext(
                self,
                new[] { highThreatEnemy, lowThreatEnemy },
                new IAICombatant[] { },
                threatMap);

            // Act
            var action = aggressiveState.SelectAction(context);

            // Assert
            Assert.AreEqual(CombatAction.ActionType.Attack, action.Type);
            Assert.AreEqual(highThreatEnemy, action.Target);
        }

        [TestMethod]
        public void DefensiveState_WithLowHealth_ReturnsDamage()
        {
            // Arrange
            var mockAbilities = new MockAbilityRegistry();
            var defensiveState = new DefensiveAIState(mockAbilities);

            var self = CreateMockCombatant(healthPercent: 0.35f, name: "Hero");
            var enemy = CreateMockCombatant(healthPercent: 0.5f);

            var context = new CombatContext(
                self,
                new[] { enemy },
                new IAICombatant[] { },
                new Dictionary<IAICombatant, float> { { enemy, 0.5f } });

            // Act
            var action = defensiveState.SelectAction(context);

            // Assert
            // Should attempt to heal rather than attack
            Assert.IsTrue(
                action.Type == CombatAction.ActionType.Heal
                || action.Type == CombatAction.ActionType.Defend);
        }

        [TestMethod]
        public void FleeState_EvaluatesTransition_WithHealthRecovery()
        {
            // Arrange
            var mockAbilities = new MockAbilityRegistry();
            var fleeState = new FleeAIState(mockAbilities);

            var self = CreateMockCombatant(healthPercent: 0.15f, name: "Hero");
            var enemy = CreateMockCombatant(healthPercent: 1f);

            var context = new CombatContext(
                self,
                new[] { enemy },
                new IAICombatant[] { },
                new Dictionary<IAICombatant, float> { { enemy, 0.8f } });

            // Simulate health recovery
            self.Health = 60; // 60% health
            var recoveryContext = new CombatContext(
                self,
                new[] { enemy },
                new IAICombatant[] { },
                new Dictionary<IAICombatant, float> { { enemy, 0.8f } });

            // Act
            var nextState = fleeState.EvaluateTransition(recoveryContext);

            // Assert
            Assert.AreEqual(CombatState.Aggressive, nextState);
        }
    }
}
```

---

## Integration Checklist

- [ ] Define your `IAbilityRegistry` interface matching your ability system
- [ ] Implement ability definitions with cost and cooling logic
- [ ] Update `IAICombatant` interface to match your Character entity
- [ ] Create state instances in `HierarchicalCombatAIController`
- [ ] Wire `ThreatAssessmentService` into your combat orchestrator
- [ ] Add `DebugCombatAILogger` wrapper for testing
- [ ] Write unit tests for state transitions and action selection
- [ ] Profile threat calculation performance with many nodes
- [ ] Add difficulty scaling wrapper around main controller
- [ ] Expose AI state for UI debugging/visualization

---

## Performance Optimization Notes

1. **Cache threat calculations** - Recalculate only when combatant count changes
2. **Use object pooling** for `CombatAction` and `CombatContext` instances
3. **Lazy-initialize AI controllers** per combatant ID
4. **Use `IReadOnlyList`** for immutable context data
5. **Avoid LINQ allocations** in hot path (action selection per turn)
