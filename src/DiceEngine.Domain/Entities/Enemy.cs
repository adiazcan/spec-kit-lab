namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents a non-player character (NPC) enemy with stats, equipment, and AI behavior
/// Aggregate Root for the Enemy domain
/// </summary>
public class Enemy
{
    // Properties
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int CurrentHealth { get; private set; }
    public int MaxHealth { get; private set; }
    
    // Ability Scores (3-18 range, D&D 5e standard)
    public int StrBase { get; private set; }
    public int DexBase { get; private set; }
    public int IntBase { get; private set; }
    public int ConBase { get; private set; }
    public int ChaBase { get; private set; }
    
    // Combat properties
    public int ArmorClass { get; private set; }
    public AIState CurrentAIState { get; private set; } = AIState.Aggressive;
    public double FleeHealthThreshold { get; private set; } = 0.25; // 25% default
    public string EquippedWeaponInfo { get; private set; } = string.Empty; // "WeaponName|DamageExpression"
    
    // Audit
    public DateTime CreatedAt { get; private set; }
    public DateTime LastModifiedAt { get; private set; }

    // Computed Properties
    public int StrModifier => CalculateModifier(StrBase);
    public int DexModifier => CalculateModifier(DexBase);
    public int IntModifier => CalculateModifier(IntBase);
    public int ConModifier => CalculateModifier(ConBase);
    public int ChaModifier => CalculateModifier(ChaBase);
    public double HealthPercentage => CurrentHealth * 100.0 / MaxHealth;

    // Private constructor for EF Core
    private Enemy()
    {
    }

    /// <summary>
    /// Factory method to create a new Enemy aggregate
    /// Throws ArgumentException if inputs are invalid
    /// </summary>
    public static Enemy Create(
        string name,
        int strBase, int dexBase, int intBase, int conBase, int chaBase,
        int maxHealth,
        int armorClass,
        string weaponInfo,
        double fleeThreshold = 0.25,
        string description = "")
    {
        // Validate name
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            throw new ArgumentException("Name must be 1-100 characters", nameof(name));

        // Validate health
        if (maxHealth <= 0)
            throw new ArgumentException("MaxHealth must be positive", nameof(maxHealth));

        // Validate attributes
        ValidateAttributes(strBase, dexBase, intBase, conBase, chaBase);

        // Validate armor class
        if (armorClass < 10)
            throw new ArgumentException("Armor Class must be at least 10", nameof(armorClass));

        // Validate flee threshold
        if (fleeThreshold < 0.0 || fleeThreshold > 1.0)
            throw new ArgumentException("Flee health threshold must be between 0.0 and 1.0", nameof(fleeThreshold));

        var now = DateTime.UtcNow;
        return new Enemy
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Description = description.Trim(),
            StrBase = strBase,
            DexBase = dexBase,
            IntBase = intBase,
            ConBase = conBase,
            ChaBase = chaBase,
            CurrentHealth = maxHealth,
            MaxHealth = maxHealth,
            ArmorClass = armorClass,
            CurrentAIState = AIState.Aggressive,
            EquippedWeaponInfo = weaponInfo,
            FleeHealthThreshold = fleeThreshold,
            CreatedAt = now,
            LastModifiedAt = now
        };
    }

    /// <summary>
    /// Apply damage to the enemy and update AI state
    /// </summary>
    public void TakeDamage(int amount)
    {
        if (amount < 0)
            throw new ArgumentException("Damage must be non-negative");

        CurrentHealth = Math.Max(0, CurrentHealth - amount);
        LastModifiedAt = DateTime.UtcNow;
        
        // Re-evaluate AI state after damage
        EvaluateAIState();
    }

    /// <summary>
    /// Evaluate and update AI state based on current health percentage
    /// State transitions: Aggressive > Defensive > Flee
    /// </summary>
    public void EvaluateAIState()
    {
        var healthPercent = HealthPercentage / 100.0;

        // State transition with thresholds
        if (healthPercent <= FleeHealthThreshold)
        {
            CurrentAIState = AIState.Flee;
        }
        else if (healthPercent < 0.5)
        {
            CurrentAIState = AIState.Defensive;
        }
        else
        {
            CurrentAIState = AIState.Aggressive;
        }
    }

    /// <summary>
    /// Restore health (for future features like healing)
    /// </summary>
    public void RestoreHealth(int amount)
    {
        if (amount < 0)
            throw new ArgumentException("Restore amount must be non-negative");

        CurrentHealth = Math.Min(MaxHealth, CurrentHealth + amount);
        LastModifiedAt = DateTime.UtcNow;
        EvaluateAIState();
    }

    /// <summary>
    /// Calculate ability modifier from ability score (D&D 5e formula)
    /// </summary>
    private static int CalculateModifier(int baseValue)
    {
        return (int)Math.Floor((baseValue - 10.0) / 2.0);
    }

    /// <summary>
    /// Validate all ability scores are in valid D&D 5e range
    /// </summary>
    private static void ValidateAttributes(int str, int dex, int intel, int con, int cha)
    {
        var attributes = new[] { ("STR", str), ("DEX", dex), ("INT", intel), ("CON", con), ("CHA", cha) };
        foreach (var (name, value) in attributes)
        {
            if (value < 3 || value > 18)
                throw new ArgumentException($"Ability score {name} must be in range 3-18, got {value}", name.ToLower());
        }
    }
}
