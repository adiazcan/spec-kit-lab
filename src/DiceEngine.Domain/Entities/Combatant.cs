namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents a single participant in a combat encounter
/// Can be either a player character or an NPC enemy
/// Owned by CombatEncounter aggregate
/// </summary>
public class Combatant
{
    // Identity
    public Guid Id { get; private set; }
    public Guid CombatEncounterId { get; private set; }
    
    // Type and References
    public CombatantType CombatantType { get; private set; }
    public Guid? CharacterId { get; private set; }  // Non-null if Character
    public Guid? EnemyId { get; private set; }      // Non-null if Enemy
    
    // Display
    public string DisplayName { get; private set; } = string.Empty;
    
    // Combat Stats
    public int CurrentHealth { get; private set; }
    public int MaxHealth { get; private set; }
    public int ArmorClass { get; private set; }
    public CombatantStatus Status { get; private set; } = CombatantStatus.Active;
    
    // Initiative
    public int DexterityModifier { get; private set; }
    public int InitiativeRoll { get; private set; }  // d20 result (1-20)
    public int InitiativeScore { get; private set; } // Roll + modifier
    public Guid TiebreakerKey { get; private set; }  // For deterministic tie-breaking
    
    // Equipment
    public Guid? EquippedWeaponId { get; private set; }
    
    // AI (for Enemy combatants only)
    public AIState? AIState { get; private set; }
    
    // Audit
    public DateTime CreatedAt { get; private set; }

    // Computed Properties
    public double HealthPercentage => CurrentHealth * 100.0 / MaxHealth;
    public bool IsActive => Status == CombatantStatus.Active && CurrentHealth > 0;

    // Private constructor for EF Core
    private Combatant()
    {
    }

    /// <summary>
    /// Factory method to create a Combatant from a Character
    /// </summary>
    public static Combatant CreateFromCharacter(
        Guid adventureId,
        string characterName,
        Guid characterId,
        int dexModifier,
        int armorClass,
        int maxHealth,
        int initiativeRoll)
    {
        // Validate inputs
        if (string.IsNullOrWhiteSpace(characterName) || characterName.Length > 100)
            throw new ArgumentException("Character name must be 1-100 characters", nameof(characterName));
        
        if (initiativeRoll < 1 || initiativeRoll > 20)
            throw new ArgumentException("Initiative roll must be 1-20", nameof(initiativeRoll));
        
        if (maxHealth <= 0)
            throw new ArgumentException("Max health must be positive", nameof(maxHealth));
        
        if (armorClass < 10)
            throw new ArgumentException("Armor class must be at least 10", nameof(armorClass));

        var initiativeScore = initiativeRoll + dexModifier;
        return new Combatant
        {
            Id = Guid.NewGuid(),
            CombatEncounterId = adventureId, // Will be set properly when added to encounter
            CombatantType = CombatantType.Character,
            CharacterId = characterId,
            EnemyId = null,
            DisplayName = characterName.Trim(),
            CurrentHealth = maxHealth,
            MaxHealth = maxHealth,
            ArmorClass = armorClass,
            Status = CombatantStatus.Active,
            DexterityModifier = dexModifier,
            InitiativeRoll = initiativeRoll,
            InitiativeScore = initiativeScore,
            TiebreakerKey = Guid.NewGuid(),
            AIState = null, // No AI for player characters
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Factory method to create a Combatant from an Enemy
    /// </summary>
    public static Combatant CreateFromEnemy(
        Enemy enemy,
        int initiativeRoll)
    {
        // Validate inputs
        if (initiativeRoll < 1 || initiativeRoll > 20)
            throw new ArgumentException("Initiative roll must be 1-20", nameof(initiativeRoll));

        var initiativeScore = initiativeRoll + enemy.DexModifier;
        return new Combatant
        {
            Id = Guid.NewGuid(),
            CombatEncounterId = Guid.Empty, // Will be set when added to encounter
            CombatantType = CombatantType.Enemy,
            CharacterId = null,
            EnemyId = enemy.Id,
            DisplayName = enemy.Name,
            CurrentHealth = enemy.CurrentHealth,
            MaxHealth = enemy.MaxHealth,
            ArmorClass = enemy.ArmorClass,
            Status = CombatantStatus.Active,
            DexterityModifier = enemy.DexModifier,
            InitiativeRoll = initiativeRoll,
            InitiativeScore = initiativeScore,
            TiebreakerKey = Guid.NewGuid(),
            AIState = enemy.CurrentAIState,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Apply damage to this combatant
    /// </summary>
    public void TakeDamage(int damageAmount)
    {
        if (damageAmount < 0)
            throw new ArgumentException("Damage must be non-negative");

        CurrentHealth = Math.Max(0, CurrentHealth - damageAmount);

        if (CurrentHealth == 0 && Status == CombatantStatus.Active)
        {
            Status = CombatantStatus.Defeated;
        }
    }

    /// <summary>
    /// Mark this combatant as defeated
    /// </summary>
    public void MarkDefeated()
    {
        Status = CombatantStatus.Defeated;
        CurrentHealth = 0;
    }

    /// <summary>
    /// Mark this combatant as fled from combat
    /// </summary>
    public void MarkFled()
    {
        Status = CombatantStatus.Fled;
    }

    /// <summary>
    /// Update AI state (for enemy combatants)
    /// </summary>
    public void UpdateAIState(AIState newState)
    {
        if (CombatantType == CombatantType.Enemy)
        {
            AIState = newState;
        }
    }

    /// <summary>
    /// Set the combat encounter ID (called when added to an encounter)
    /// </summary>
    public void SetCombatEncounterId(Guid encounterId)
    {
        CombatEncounterId = encounterId;
    }
}
