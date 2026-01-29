# Combat Implementation Patterns - Advanced C# Examples

**Purpose**: Detailed C# code examples for implementing combat mechanics with .NET patterns

## Table of Contents

1. [Value Objects & Domain Models](#value-objects--domain-models)
2. [Service Layer Architecture](#service-layer-architecture)
3. [Exception Handling](#exception-handling)
4. [Repository Pattern Integration](#repository-pattern-integration)
5. [API Controller Patterns](#api-controller-patterns)
6. [Advanced Testing Patterns](#advanced-testing-patterns)
7. [Performance Optimization](#performance-optimization)

---

## Value Objects & Domain Models

### AttackResult Value Object

```csharp
namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Immutable representation of an attack action result.
/// Combines all information needed to understand what happened in an attack.
/// </summary>
public sealed record AttackResult
{
    /// <summary>
    /// Raw d20 roll (1-20).
    /// </summary>
    public int AttackRoll { get; init; }

    /// <summary>
    /// Ability modifier + proficiency bonus + magic bonuses.
    /// </summary>
    public int AttackBonus { get; init; }

    /// <summary>
    /// Target's armor class.
    /// </summary>
    public int TargetAC { get; init; }

    /// <summary>
    /// Did the attack hit?
    /// </summary>
    public bool IsHit { get; init; }

    /// <summary>
    /// Natural 20 (automatic hit).
    /// </summary>
    public bool IsCriticalHit { get; init; }

    /// <summary>
    /// Natural 1 (automatic miss).
    /// </summary>
    public bool IsCriticalMiss { get; init; }

    /// <summary>
    /// Total damage dealt (0 if miss).
    /// </summary>
    public int Damage { get; init; }

    /// <summary>
    /// Weapon damage expression (e.g., "1d8+3").
    /// </summary>
    public string WeaponDamageDice { get; init; } = string.Empty;

    /// <summary>
    /// Final attack roll total (d20 + bonus).
    /// </summary>
    public int TotalAttackRoll => AttackRoll + AttackBonus;

    /// <summary>
    /// Did this attack meet or exceed AC?
    /// </summary>
    public bool MeetsAC => TotalAttackRoll >= TargetAC;

    /// <summary>
    /// Human-readable summary of attack result.
    /// </summary>
    public string Summary =>
        IsCriticalMiss ? "CRITICAL MISS - Attack automatically fails!" :
        IsCriticalHit ? $"CRITICAL HIT! Attack roll {TotalAttackRoll} (nat 20) vs AC {TargetAC}. Damage: {Damage}" :
        IsHit ? $"HIT! Attack roll {TotalAttackRoll} vs AC {TargetAC}. Damage: {Damage}" :
        $"MISS! Attack roll {TotalAttackRoll} vs AC {TargetAC}";
}
```

### Damage Calculation Value Object

```csharp
namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Detailed breakdown of damage calculation.
/// </summary>
public sealed record DamageBreakdown
{
    public int WeaponDamage { get; init; }
    public int AbilityModifier { get; init; }
    public int MagicBonus { get; init; }
    public int ResistanceReduction { get; init; }
    public bool IsResistant { get; init; }
    public bool IsVulnerable { get; init; }

    public int TotalDamage =>
        (WeaponDamage + AbilityModifier + MagicBonus) / (IsResistant ? 2 : 1) * (IsVulnerable ? 2 : 1);

    public string Details =>
        $"Base: {WeaponDamage}, Ability: {AbilityModifier}, Magic: {MagicBonus}" +
        (IsResistant ? " [RESISTANT -50%]" : "") +
        (IsVulnerable ? " [VULNERABLE x2]" : "") +
        $" = {TotalDamage}";
}
```

### Initiative Entry Value Object

```csharp
namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Immutable record of a combatant's initiative in turn order.
/// </summary>
public sealed record InitiativeEntry
{
    public string CombatantId { get; init; } = string.Empty;
    public string CombatantName { get; init; } = string.Empty;
    public int InitiativeRoll { get; init; }
    public int DexModifier { get; init; }
    public int TurnOrder { get; init; }  // Position in initiative (1-based)

    public int TotalInitiative => InitiativeRoll + DexModifier;

    public bool IsNatural20 => InitiativeRoll == 20;
    public bool IsNatural1 => InitiativeRoll == 1;

    public string Summary =>
        $"{CombatantName}: {InitiativeRoll} + {DexModifier} = {TotalInitiative} (Turn {TurnOrder})";
}
```

---

## Service Layer Architecture

### IHealthTracker Interface (Expected)

```csharp
namespace DiceEngine.Application.Services;

/// <summary>
/// Interface for combatant health tracking.
/// </summary>
public interface IHealthTracker
{
    int CurrentHP { get; }
    int MaxHP { get; }
    int TemporaryHP { get; }
    int EffectiveHP { get; }
    bool IsDefeated { get; }

    int TakeDamage(int damage);
    int Heal(int healing);
    void ApplyTemporaryHP(int tempHP);
    void ResetHealth();
}
```

### HealthTracker Implementation with Logging

```csharp
namespace DiceEngine.Application.Services;

using Microsoft.Extensions.Logging;

/// <summary>
/// Manages health points for a combatant during combat.
/// Tracks temporary HP, healing, and defeat state.
/// </summary>
public class HealthTracker : IHealthTracker
{
    private int _currentHP;
    private int _tempHP = 0;
    private readonly int _maxHP;
    private readonly ILogger<HealthTracker>? _logger;
    private readonly string _combatantId;

    public HealthTracker(int maxHP, string combatantId, ILogger<HealthTracker>? logger = null)
    {
        if (maxHP < 1)
            throw new ArgumentException("Max HP must be at least 1", nameof(maxHP));

        _maxHP = maxHP;
        _currentHP = maxHP;
        _combatantId = combatantId;
        _logger = logger;

        _logger?.LogInformation("HealthTracker created: {CombatantId}, MaxHP={MaxHP}",
            combatantId, maxHP);
    }

    public int CurrentHP => _currentHP;
    public int MaxHP => _maxHP;
    public int TemporaryHP => _tempHP;
    public int EffectiveHP => _tempHP + _currentHP;
    public bool IsDefeated => _currentHP <= 0;

    public int TakeDamage(int damage)
    {
        if (damage < 0)
            throw new ArgumentException("Damage cannot be negative", nameof(damage));

        if (damage == 0)
            return 0;

        int damageAbsorbed = damage;

        // Apply to temporary HP first
        if (_tempHP > 0)
        {
            int tempAbsorbed = Math.Min(damage, _tempHP);
            _tempHP -= tempAbsorbed;
            damageAbsorbed -= tempAbsorbed;

            _logger?.LogDebug("Damage absorbed by temp HP: {TempDamage}, Remaining temp: {TempHP}",
                tempAbsorbed, _tempHP);
        }

        // Apply remaining damage to current HP
        if (damageAbsorbed > 0)
        {
            int previousHP = _currentHP;
            _currentHP -= damageAbsorbed;
            if (_currentHP < 0)
                _currentHP = 0;

            _logger?.LogInformation("Damage applied to {CombatantId}: {Damage} HP, {PreviousHP} → {CurrentHP}",
                _combatantId, damageAbsorbed, previousHP, _currentHP);

            if (IsDefeated)
                _logger?.LogWarning("Combatant {CombatantId} defeated!", _combatantId);
        }

        return damage;
    }

    public int Heal(int healing)
    {
        if (healing < 0)
            throw new ArgumentException("Healing cannot be negative", nameof(healing));

        if (healing == 0 || IsDefeated)
            return 0;

        int previousHP = _currentHP;
        _currentHP = Math.Min(_currentHP + healing, _maxHP);
        int actualHeal = _currentHP - previousHP;

        _logger?.LogInformation("Healing applied to {CombatantId}: {Healing} HP, {PreviousHP} → {CurrentHP}",
            _combatantId, actualHeal, previousHP, _currentHP);

        return actualHeal;
    }

    public void ApplyTemporaryHP(int tempHP)
    {
        if (tempHP < 0)
            throw new ArgumentException("Temporary HP cannot be negative", nameof(tempHP));

        int previousTemp = _tempHP;
        _tempHP = Math.Max(_tempHP, tempHP);

        _logger?.LogDebug("Temporary HP applied to {CombatantId}: {TempHP} (was {Previous})",
            _combatantId, _tempHP, previousTemp);
    }

    public void ResetHealth()
    {
        _currentHP = _maxHP;
        _tempHP = 0;

        _logger?.LogDebug("Health reset for {CombatantId}", _combatantId);
    }

    /// <summary>
    /// Get a snapshot of current health state.
    /// </summary>
    public HealthSnapshot Snapshot() => new(
        CurrentHP: _currentHP,
        MaxHP: _maxHP,
        TemporaryHP: _tempHP,
        IsDefeated: IsDefeated
    );
}

public sealed record HealthSnapshot(
    int CurrentHP,
    int MaxHP,
    int TemporaryHP,
    bool IsDefeated)
{
    public int EffectiveHP => TemporaryHP + CurrentHP;
    public decimal HealthPercentage => (decimal)CurrentHP / MaxHP * 100;
    public string HealthBar =>
        $"[{new string('█', CurrentHP / 10)}{new string('░', (MaxHP - CurrentHP) / 10)}] {CurrentHP}/{MaxHP}";
}
```

### AttackResolver with Advanced Logic

```csharp
namespace DiceEngine.Application.Services;

using Microsoft.Extensions.Logging;
using DiceEngine.Domain.ValueObjects;

/// <summary>
/// Resolves attack actions using D&D 5e combat rules.
/// Handles attack rolls, critical hits, and damage calculation.
/// </summary>
public class AttackResolver
{
    private readonly IDiceService _diceService;
    private readonly ILogger<AttackResolver>? _logger;

    public AttackResolver(IDiceService diceService, ILogger<AttackResolver>? logger = null)
    {
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
        _logger = logger;
    }

    /// <summary>
    /// Resolve a complete attack action.
    /// </summary>
    public AttackResult ResolveAttack(
        int attackBonus,
        int targetAC,
        string weaponDamageDice,
        int damageModifier,
        string? attackerName = null,
        string? targetName = null)
    {
        if (string.IsNullOrWhiteSpace(weaponDamageDice))
            throw new ArgumentException("Weapon damage dice required", nameof(weaponDamageDice));

        // Validate weapon damage expression
        try
        {
            _diceService.ValidateExpression(weaponDamageDice);
        }
        catch
        {
            throw new InvalidOperationException($"Invalid weapon damage dice: {weaponDamageDice}");
        }

        // Roll d20 for attack
        var attackRoll = _diceService.Roll("d20");
        int rawD20 = attackRoll.IndividualRolls[0];

        // Determine critical hit/miss
        bool isCriticalHit = (rawD20 == 20);
        bool isCriticalMiss = (rawD20 == 1);

        // Calculate total attack including modifiers
        int totalAttack = rawD20 + attackBonus;

        // Determine if attack hits
        // Note: Crit overrides AC, miss overrides everything
        bool isHit = isCriticalMiss ? false : (isCriticalHit || totalAttack >= targetAC);

        _logger?.LogInformation(
            "Attack Resolved: {Attacker} vs {Target} - Roll: {RawD20} + {Bonus} = {Total} vs AC {AC} - {Result}",
            attackerName ?? "Unknown",
            targetName ?? "Unknown",
            rawD20,
            attackBonus,
            totalAttack,
            targetAC,
            isHit ? (isCriticalHit ? "CRIT HIT" : "HIT") : (isCriticalMiss ? "CRIT MISS" : "MISS"));

        // Calculate damage if hit
        int damage = 0;
        if (isHit)
        {
            damage = CalculateDamage(
                weaponDamageDice,
                damageModifier,
                isCriticalHit);
        }

        return new AttackResult
        {
            AttackRoll = rawD20,
            AttackBonus = attackBonus,
            TargetAC = targetAC,
            IsHit = isHit,
            IsCriticalHit = isCriticalHit,
            IsCriticalMiss = isCriticalMiss,
            Damage = damage,
            WeaponDamageDice = weaponDamageDice
        };
    }

    /// <summary>
    /// Calculate damage for a hit attack.
    /// </summary>
    private int CalculateDamage(
        string weaponDamageDice,
        int damageModifier,
        bool isCriticalHit)
    {
        // Modify damage expression for critical hit
        string damageExpression = weaponDamageDice;

        if (isCriticalHit)
        {
            damageExpression = DoubleDiceCount(damageExpression);
            _logger?.LogDebug("Critical hit! Doubled dice: {Original} → {Doubled}",
                weaponDamageDice, damageExpression);
        }

        // Add damage modifier
        if (damageModifier != 0)
        {
            if (damageModifier > 0)
                damageExpression += $"+{damageModifier}";
            else
                damageExpression += damageModifier.ToString(); // Already includes minus sign
        }

        // Roll damage
        var damageRoll = _diceService.Roll(damageExpression);
        int totalDamage = damageRoll.FinalTotal;

        // Minimum damage is 1 (even on critical miss)
        if (totalDamage < 1)
            totalDamage = 1;

        return totalDamage;
    }

    /// <summary>
    /// Double the number of dice in a damage expression.
    /// Example: "1d8+2" → "2d8+2"
    /// </summary>
    private string DoubleDiceCount(string expression)
    {
        // Find the modifier (if any)
        int modifierIndex = expression.LastIndexOfAny(new[] { '+', '-' },
            Math.Max(0, expression.Length - 10));

        string diceGroup = modifierIndex > 0 ? expression[..modifierIndex].Trim() : expression;
        string modifier = modifierIndex > 0 ? expression[modifierIndex..] : string.Empty;

        // Parse dice group (e.g., "1d8" → count=1, sides=8)
        var diceParts = diceGroup.Split('d', StringSplitOptions.IgnoreCase);

        if (diceParts.Length == 2 &&
            int.TryParse(diceParts[0], out int count) &&
            int.TryParse(diceParts[1], out int sides))
        {
            // Double the count
            int newCount = count * 2;
            return $"{newCount}d{sides}{modifier}";
        }

        // Fallback: return original if parsing fails
        _logger?.LogWarning("Failed to parse dice expression for doubling: {Expression}", expression);
        return expression;
    }

    /// <summary>
    /// Apply resistance or vulnerability to damage.
    /// </summary>
    public int ApplyResistance(int baseDamage, bool isResistant, bool isVulnerable)
    {
        int damage = baseDamage;

        if (isResistant)
        {
            damage = damage / 2;
            _logger?.LogDebug("Damage halved for resistance: {Base} → {Reduced}", baseDamage, damage);
        }

        if (isVulnerable)
        {
            damage = damage * 2;
            _logger?.LogDebug("Damage doubled for vulnerability: {Base} → {Increased}", baseDamage, damage);
        }

        return Math.Max(1, damage); // Minimum 1 damage
    }
}
```

---

## Exception Handling

### Custom Combat Exceptions

```csharp
namespace DiceEngine.Application.Exceptions;

/// <summary>
/// Base exception for combat-related errors.
/// </summary>
public class CombatException : ApplicationException
{
    public CombatException(string message) : base(message) { }
    public CombatException(string message, Exception innerException)
        : base(message, innerException) { }
}

/// <summary>
/// Thrown when combat state is invalid for requested operation.
/// </summary>
public class InvalidCombatStateException : CombatException
{
    public string CombatId { get; }

    public InvalidCombatStateException(string combatId, string message)
        : base($"Invalid combat state [{combatId}]: {message}")
    {
        CombatId = combatId;
    }
}

/// <summary>
/// Thrown when combatant is not found.
/// </summary>
public class CombatantNotFoundException : CombatException
{
    public string CombatantId { get; }

    public CombatantNotFoundException(string combatantId)
        : base($"Combatant not found: {combatantId}")
    {
        CombatantId = combatantId;
    }
}

/// <summary>
/// Thrown when action violates combat rules.
/// </summary>
public class CombatRuleViolationException : CombatException
{
    public string Rule { get; }

    public CombatRuleViolationException(string rule, string message)
        : base($"Rule violation [{rule}]: {message}")
    {
        Rule = rule;
    }
}

/// <summary>
/// Thrown when it's not a combatant's turn.
/// </summary>
public class NotYourTurnException : CombatRuleViolationException
{
    public string CombatantId { get; }
    public string CurrentTurnCombatantId { get; }

    public NotYourTurnException(string combatantId, string currentTurnId)
        : base(
            "turn-order",
            $"It's not {combatantId}'s turn (current: {currentTurnId})")
    {
        CombatantId = combatantId;
        CurrentTurnCombatantId = currentTurnId;
    }
}

/// <summary>
/// Thrown when targeting a defeated combatant.
/// </summary>
public class TargetDefeated Exception : CombatRuleViolationException
{
    public string TargetId { get; }

    public TargetDefeatedException(string targetId)
        : base("target-defeated", $"Cannot attack defeated target: {targetId}")
    {
        TargetId = targetId;
    }
}
```

### Using Exceptions in Services

```csharp
public class CombatResolver
{
    public AttackResult ProcessAttack(
        CombatEncounterState encounter,
        string attackerId,
        string targetId)
    {
        // Validate combatant exists
        var attacker = encounter.Combatants.FirstOrDefault(c => c.Id == attackerId);
        if (attacker == null)
            throw new CombatantNotFoundException(attackerId);

        var target = encounter.Combatants.FirstOrDefault(c => c.Id == targetId);
        if (target == null)
            throw new CombatantNotFoundException(targetId);

        // Validate it's attacker's turn
        if (encounter.CurrentCombatant?.Id != attackerId)
            throw new NotYourTurnException(attackerId, encounter.CurrentCombatant?.Id ?? "unknown");

        // Validate target is not defeated
        if (target.IsDefeated)
            throw new TargetDefeatedException(targetId);

        // Validate combat is active
        if (!encounter.IsActive)
            throw new InvalidCombatStateException(encounter.Id, "Combat is not active");

        // ... rest of method
    }
}
```

---

## Repository Pattern Integration

### ICombatRepository Interface

```csharp
namespace DiceEngine.Application.Services;

/// <summary>
/// Repository for persisting and retrieving combat encounters.
/// </summary>
public interface ICombatRepository
{
    /// <summary>
    /// Save a new combat encounter.
    /// </summary>
    Task<string> CreateAsync(CombatEncounterState encounter);

    /// <summary>
    /// Retrieve an encounter by ID.
    /// </summary>
    Task<CombatEncounterState?> GetByIdAsync(string combatId);

    /// <summary>
    /// Update an existing encounter.
    /// </summary>
    Task UpdateAsync(CombatEncounterState encounter);

    /// <summary>
    /// Get all active encounters.
    /// </summary>
    Task<IEnumerable<CombatEncounterState>> GetActiveAsync();

    /// <summary>
    /// Delete a completed encounter.
    /// </summary>
    Task DeleteAsync(string combatId);
}
```

### Saving Combat State

```csharp
public class CombatService
{
    private readonly CombatResolver _resolver;
    private readonly ICombatRepository _repository;

    public async Task<string> StartCombatAsync(List<CombatantState> combatants)
    {
        // Create encounter
        var encounter = _resolver.InitiateCombat(combatants);

        // Save to database
        var combatId = await _repository.CreateAsync(encounter);

        return combatId;
    }

    public async Task<AttackResult> AttackAsync(
        string combatId,
        string attackerId,
        string targetId)
    {
        // Load state
        var encounter = await _repository.GetByIdAsync(combatId)
            ?? throw new CombatantNotFoundException(combatId);

        // Resolve attack
        var result = _resolver.ProcessAttack(encounter, attackerId, targetId);

        // Save updated state
        await _repository.UpdateAsync(encounter);

        return result;
    }
}
```

---

## API Controller Patterns

### CombatController Example

```csharp
using Microsoft.AspNetCore.Mvc;
using DiceEngine.Application.Services;

namespace DiceEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CombatController : ControllerBase
{
    private readonly CombatService _combatService;
    private readonly ILogger<CombatController> _logger;

    public CombatController(CombatService combatService, ILogger<CombatController> logger)
    {
        _combatService = combatService ?? throw new ArgumentNullException(nameof(combatService));
        _logger = logger;
    }

    /// <summary>
    /// Initiate a new combat encounter.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CombatResponse>> StartCombat(
        [FromBody] StartCombatRequest request)
    {
        try
        {
            if (request?.Combatants == null || request.Combatants.Count == 0)
                return BadRequest("At least one combatant required");

            var combatId = await _combatService.StartCombatAsync(
                request.Combatants.Select(c => new CombatResolver.CombatantState
                {
                    Id = c.Id,
                    Name = c.Name,
                    MaxHP = c.MaxHP,
                    CurrentHP = c.MaxHP,
                    ArmorClass = c.ArmorClass,
                    DexModifier = c.DexModifier,
                    StrModifier = c.StrModifier,
                    EquippedWeapon = c.Weapon,
                    WeaponDamageDice = c.WeaponDamage
                }).ToList());

            return CreatedAtAction(nameof(GetCombat), new { id = combatId },
                new CombatResponse { CombatId = combatId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting combat");
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Get current combat status.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CombatStatusResponse>> GetCombat(string id)
    {
        var status = await _combatService.GetCombatStatusAsync(id);
        if (status == null)
            return NotFound();

        return Ok(status);
    }

    /// <summary>
    /// Process an attack action.
    /// </summary>
    [HttpPost("{combatId}/attack")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AttackResponse>> ProcessAttack(
        string combatId,
        [FromBody] AttackRequest request)
    {
        try
        {
            var result = await _combatService.AttackAsync(
                combatId,
                request.AttackerId,
                request.TargetId);

            return Ok(new AttackResponse
            {
                AttackRoll = result.AttackRoll,
                IsHit = result.IsHit,
                IsCritical = result.IsCriticalHit,
                Damage = result.Damage,
                Summary = result.Summary
            });
        }
        catch (CombatantNotFoundException)
        {
            return NotFound();
        }
        catch (NotYourTurnException)
        {
            return Conflict("It's not your turn");
        }
        catch (TargetDefeatedException)
        {
            return Conflict("Target is already defeated");
        }
        catch (InvalidCombatStateException)
        {
            return Conflict("Combat is not active");
        }
    }

    /// <summary>
    /// Advance to next turn.
    /// </summary>
    [HttpPost("{combatId}/next-turn")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CombatStatusResponse>> NextTurn(string combatId)
    {
        var status = await _combatService.NextTurnAsync(combatId);
        if (status == null)
            return NotFound();

        return Ok(status);
    }
}

// Request/Response DTOs
public class StartCombatRequest
{
    public List<CombatantDto> Combatants { get; set; } = new();
}

public class CombatantDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int MaxHP { get; set; }
    public int ArmorClass { get; set; }
    public int DexModifier { get; set; }
    public int StrModifier { get; set; }
    public string Weapon { get; set; } = string.Empty;
    public string WeaponDamage { get; set; } = string.Empty;
}

public class AttackRequest
{
    public string AttackerId { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
}

public class AttackResponse
{
    public int AttackRoll { get; set; }
    public bool IsHit { get; set; }
    public bool IsCritical { get; set; }
    public int Damage { get; set; }
    public string Summary { get; set; } = string.Empty;
}

public class CombatResponse
{
    public string CombatId { get; set; } = string.Empty;
}

public class CombatStatusResponse
{
    public string CombatId { get; set; } = string.Empty;
    public int Round { get; set; }
    public bool IsActive { get; set; }
    public string? CurrentCombatantId { get; set; }
    public string? VictorId { get; set; }
    public List<CombatantStatusDto> Combatants { get; set; } = new();
}

public class CombatantStatusDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int CurrentHP { get; set; }
    public int MaxHP { get; set; }
    public bool IsDefeated { get; set; }
    public int InitiativeScore { get; set; }
}
```

---

## Advanced Testing Patterns

### Mocking DiceService with Specific Rolls

```csharp
[Fact]
public void AttackResolver_OnCriticalHit_DoublesWeaponDice()
{
    // Arrange
    var mockDice = new Mock<IDiceService>();

    // Set up attack roll to return natural 20
    mockDice.Setup(s => s.Roll("d20"))
        .Returns(new RollResult
        {
            Expression = "d20",
            IndividualRolls = new List<int> { 20 },
            FinalTotal = 20
        });

    // Set up damage roll for critical (2d8 instead of 1d8)
    mockDice.Setup(s => s.Roll("2d8+3"))
        .Returns(new RollResult
        {
            Expression = "2d8+3",
            IndividualRolls = new List<int> { 7, 6 },
            FinalTotal = 16  // 7 + 6 + 3
        });

    var resolver = new AttackResolver(mockDice.Object);

    // Act
    var result = resolver.ResolveAttack(
        attackBonus: 5,
        targetAC: 20,
        weaponDamageDice: "1d8",
        damageModifier: 3);

    // Assert
    Assert.True(result.IsCriticalHit);
    Assert.True(result.IsHit);
    Assert.Equal(16, result.Damage);

    // Verify that "2d8+3" was rolled (not "1d8+3")
    mockDice.Verify(s => s.Roll("2d8+3"), Times.Once);
}
```

### Testing Combat Encounter Flow

```csharp
[Fact]
public void CombatResolver_ProcessesFullRound_InInitiativeOrder()
{
    // Arrange
    var mockDice = new Mock<IDiceService>();

    // Create test combatants
    var combatants = new List<CombatResolver.CombatantState>
    {
        new() { Id = "p1", Name = "Player", MaxHP = 50, CurrentHP = 50,
                DexModifier = 2, ArmorClass = 15, StrModifier = 3, WeaponDamageDice = "1d8" },
        new() { Id = "e1", Name = "Enemy", MaxHP = 30, CurrentHP = 30,
                DexModifier = -1, ArmorClass = 13, StrModifier = 2, WeaponDamageDice = "1d6" }
    };

    // Mock initiative rolls
    mockDice.Setup(s => s.Roll("d20"))
        .Returns(new RollResult
        {
            Expression = "d20",
            IndividualRolls = new List<int> { 15, 10 },  // Player wins initiative
            FinalTotal = 17
        });

    var resolver = new CombatResolver(mockDice.Object, new AttackResolver(mockDice.Object),
        new InitiativeCalculator(mockDice.Object), new HealthTracker(50, "test"));

    // Act
    var encounter = resolver.InitiateCombat(combatants);

    // Assert
    Assert.True(encounter.IsActive);
    Assert.Equal("p1", encounter.TurnOrder[0].Id);  // Player first
    Assert.Equal("e1", encounter.TurnOrder[1].Id);  // Enemy second
}
```

### Test Fixture for Combat Scenarios

```csharp
public class CombatFixture
{
    public static CombatResolver.CombatantState CreateFighter(
        string id = "fighter",
        string name = "Fighter",
        int maxHP = 55)
    {
        return new CombatResolver.CombatantState
        {
            Id = id,
            Name = name,
            MaxHP = maxHP,
            CurrentHP = maxHP,
            ArmorClass = 16,  // Plate armor
            DexModifier = 0,
            StrModifier = 3,
            EquippedWeapon = "Longsword",
            WeaponDamageDice = "1d8"
        };
    }

    public static CombatResolver.CombatantState CreateRogue(
        string id = "rogue",
        string name = "Rogue",
        int maxHP = 27)
    {
        return new CombatResolver.CombatantState
        {
            Id = id,
            Name = name,
            MaxHP = maxHP,
            CurrentHP = maxHP,
            ArmorClass = 15,  // Leather + DEX
            DexModifier = 3,
            StrModifier = 1,
            EquippedWeapon = "Shortsword",
            WeaponDamageDice = "1d6"
        };
    }

    public static CombatResolver.CombatantState CreateGoblin(
        string id = "goblin",
        string name = "Goblin",
        int maxHP = 7)
    {
        return new CombatResolver.CombatantState
        {
            Id = id,
            Name = name,
            MaxHP = maxHP,
            CurrentHP = maxHP,
            ArmorClass = 15,
            DexModifier = 2,
            StrModifier = 0,
            EquippedWeapon = "Scimitar",
            WeaponDamageDice = "1d6"
        };
    }
}

[Fact]
public void FighterVsGoblin_FighterWins()
{
    // Arrange
    var fighter = CombatFixture.CreateFighter();
    var goblin = CombatFixture.CreateGoblin();

    var mockDice = new Mock<IDiceService>();
    // ... mock rolls for realistic combat ...

    var resolver = new CombatResolver(/* ... */);
    var encounter = resolver.InitiateCombat(new() { fighter, goblin });

    // Act & Assert
    // Simulate multiple turns until goblin defeated
}
```

---

## Performance Optimization

### Caching Initiative Calculations

```csharp
public class CachedInitiativeCalculator : InitiativeCalculator
{
    private readonly Dictionary<string, CalculatedInitiative> _cache = new();

    public override CombatantInitiative RollInitiative(string combatantId, int dexModifier)
    {
        var cacheKey = $"{combatantId}:{dexModifier}";

        if (_cache.TryGetValue(cacheKey, out var cached) &&
            DateTime.UtcNow - cached.CalculatedAt < TimeSpan.FromSeconds(60))
        {
            return cached.Initiative;
        }

        var result = base.RollInitiative(combatantId, dexModifier);

        _cache[cacheKey] = new CalculatedInitiative
        {
            Initiative = result,
            CalculatedAt = DateTime.UtcNow
        };

        return result;
    }

    private record CalculatedInitiative(InitiativeEntry Initiative, DateTime CalculatedAt);
}
```

### Batch Processing Attacks

```csharp
public class BatchAttackResolver
{
    private readonly AttackResolver _resolver;

    public BatchAttackResolver(AttackResolver resolver)
    {
        _resolver = resolver;
    }

    /// <summary>
    /// Resolve multiple attacks in series (for AI turns, AoE damage, etc.).
    /// </summary>
    public IEnumerable<AttackResult> ResolveAttackBatch(
        IEnumerable<(int Bonus, int TargetAC, string Dice, int Modifier)> attacks)
    {
        foreach (var (bonus, ac, dice, mod) in attacks)
        {
            yield return _resolver.ResolveAttack(bonus, ac, dice, mod);
        }
    }
}
```

### Async Combat Service with Proper Offloading

```csharp
public class AsyncCombatService
{
    public async Task<CombatEncounterState> InitiateCombatAsync(
        List<CombatResolver.CombatantState> combatants)
    {
        // Heavy lifting in thread pool, don't block I/O
        var encounter = await Task.Run(() =>
        {
            return _combatResolver.InitiateCombat(combatants);
        });

        // DB operation async
        await _repository.CreateAsync(encounter);

        return encounter;
    }
}
```

---

## Summary

These advanced patterns provide:

- **Strong typing** with records and value objects
- **Comprehensive logging** for debugging combat
- **Exception handling** specific to combat violations
- **Repository pattern** for persistence
- **REST API** following conventions
- **Thorough testing** with detailed fixtures
- **Performance** through caching and async operations

Use these as templates when implementing the full CombatResolver service.
