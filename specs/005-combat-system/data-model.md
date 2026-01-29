# Phase 1 Design: Data Model

**Date**: 2026-01-29  
**Purpose**: Define domain entities, value objects, and relationships for the Turn-Based Combat System

---

## Domain Model Overview

The Combat System operates on linked aggregates representing combat encounters, combatants, and combat actions:

```
Adventure (existing aggregate root)
    ├─ CombatEncounter (NEW aggregate root)
    │   ├─ Round (entity)
    │   ├─ Combatant[] (entities)
    │   │   ├─ Character (existing reference)
    │   │   ├─ Enemy (if NPC)
    │   │   ├─ Health (current/max)
    │   │   ├─ ArmorClass (int)
    │   │   └─ Initiative (int)
    │   ├─ InitiativeOrder (LinkedList<Combatant>)
    │   └─ CompletedActions[] (AttackAction[])
    │
    └─ Enemy (NEW aggregate root)
        ├─ Name (string)
        ├─ Stats (STR, DEX, INT, CON, CHA)
        ├─ Health (current/max)
        ├─ ArmorClass (int)
        ├─ Equipment (weapon, armor)
        └─ AIState (aggressive, defensive, flee)

Combatant (NEW value object or entity)
    ├─ Character OR Enemy reference
    ├─ Current Health
    ├─ Status (active, defeated, fled)
    ├─ Initiative Entry (roll result, position)
    └─ Equipped Weapon

AttackAction (NEW value object)
    ├─ Attacker (Combatant)
    ├─ Target (Combatant)
    ├─ Attack Roll Result (d20 + mods vs AC)
    ├─ Damage (if hit)
    └─ Timestamp
```

### Data Flow

```
Initiate Combat
    │
    ├─ API validates (characters and enemies provided)
    │
    └─ CombatService.StartCombatAsync()
         │
         ├─ Create Combatants for each character/enemy
         │
         ├─ Calculate Initiative (d20 + DEX mod for each)
         │
         ├─ Sort by initiative (high to low, DEX tiebreak)
         │
         ├─ Set first combatant as active
         │
         └─ Database persistence (EF Core INSERT) ✅
              │
              └─ CombatEncounter created and ready for turns

Resolve Player Attack
    │
    ├─ API validates (player's turn, valid target)
    │
    └─ CombatService.ResolveAttackAsync()
         │
         ├─ AttackResolver rolls: d20 + attack mods
         │
         ├─ Compare to target AC
         │
         ├─ If hit: roll damage (weapon dice + mods)
         │
         ├─ Apply damage to target health
         │
         ├─ Check for defeat (health <= 0)
         │
         ├─ Record AttackAction (for history)
         │
         └─ Advance to next combatant ✅

Resolve Enemy Turn
    │
    ├─ CombatService.ResolveEnemyTurnAsync()
    │
    ├─ AIStateMachine evaluates enemy state (health %)
    │
    ├─ State transition if needed (aggressive→defensive, →flee)
    │
    ├─ Select action based on current state
    │
    ├─ Execute action (attack, defend, flee)
    │
    └─ Advance to next combatant ✅

End Combat
    │
    ├─ Check win/lose condition
    │
    ├─ Flag encounter as completed
    │
    └─ Return results (winner, rounds taken) ✅
```

---

## Entity Definitions

### 1. CombatEncounter (Root Aggregate)

**Purpose**: Represents an active combat session containing all participating combatants, turn order, and combat state  
**Ownership**: Created by CombatService, linked to Adventure  
**Lifecycle**: Create → ExecuteTurns → End (when all one side defeated or fled)

#### Properties

| Property         | Type                      | Constraints       | Purpose                                         | Calculated |
| ---------------- | ------------------------- | ----------------- | ----------------------------------------------- | ---------- |
| Id               | Guid                      | PK, unique        | Unique encounter identifier                     | No         |
| AdventureId      | Guid                      | FK, non-null      | Parent adventure                                | No         |
| Status           | CombatStatus              | enum              | NotStarted, Active, Completed                   | No         |
| CurrentRound     | int                       | >= 1              | Current round number                            | No         |
| CurrentTurnIndex | int                       | >= 0              | Index in initiative order                       | No         |
| Combatants       | ICollection<Combatant>    | Navigation        | All participants                                | No         |
| CompletedActions | ICollection<AttackAction> | Navigation        | History of actions                              | No         |
| InitiativeOrder  | List<Guid>                | JSON array        | Sorted combatant IDs (immutable after start)    | No         |
| Winner           | CombatSide?               | enum              | PlayerVictory, EnemyVictory, Draw, null=ongoing | No         |
| StartedAt        | DateTime                  | UTC               | When combat began                               | No         |
| EndedAt          | DateTime?                 | UTC, nullable     | When combat concluded                           | No         |
| Version          | uint                      | Concurrency token | Optimistic locking                              | No         |

#### Validation Rules

- **VR-001**: `AdventureId` must reference existing Adventure
- **VR-002**: `Status` must be valid enum value
- **VR-003**: `CurrentRound` >= 1 (starts at 1)
- **VR-004**: `CurrentTurnIndex` valid index in Combatants list
- **VR-005**: `InitiativeOrder` set once at combat start, never modified
- **VR-006**: At least 1 player character and 1 enemy required to start
- **VR-007**: Cannot start if any combatant has health <= 0
- **VR-008**: `Winner` null while Status=Active; set when Status=Completed
- **VR-009**: `EndedAt` null while Status=Active; set when Status=Completed
- **VR-010**: Version increments on each turn resolution

#### Key Methods

```csharp
public class CombatEncounter
{
    public Guid Id { get; private set; }
    public Guid AdventureId { get; private set; }
    public CombatStatus Status { get; private set; }
    public int CurrentRound { get; private set; }
    public int CurrentTurnIndex { get; private set; }
    public ICollection<Combatant> Combatants { get; private set; } = new List<Combatant>();
    public ICollection<AttackAction> CompletedActions { get; private set; } = new List<AttackAction>();
    public List<Guid> InitiativeOrder { get; private set; } = new();
    public CombatSide? Winner { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }
    public uint Version { get; private set; }

    private CombatEncounter() { }

    // Factory method
    public static Result<CombatEncounter> Create(
        Guid adventureId,
        IEnumerable<Combatant> combatants)
    {
        if (!combatants.Any())
            return Result<CombatEncounter>.Failure("Must have at least one combatant");

        var encounter = new CombatEncounter
        {
            Id = Guid.NewGuid(),
            AdventureId = adventureId,
            Status = CombatStatus.NotStarted,
            CurrentRound = 1,
            CurrentTurnIndex = 0,
            StartedAt = DateTime.UtcNow,
            Version = 1
        };

        foreach (var combatant in combatants)
        {
            encounter.Combatants.Add(combatant);
        }

        return Result<CombatEncounter>.Success(encounter);
    }

    // Start combat: calculate initiative, set order
    public void StartCombat(List<Guid> initiativeOrder)
    {
        if (Status != CombatStatus.NotStarted)
            throw new InvalidOperationException("Combat already started");

        InitiativeOrder.Clear();
        InitiativeOrder.AddRange(initiativeOrder);
        Status = CombatStatus.Active;
        Version++;
    }

    // Get active combatant
    public Guid GetActiveCombatantId()
    {
        if (Status != CombatStatus.Active)
            return Guid.Empty;

        return CurrentTurnIndex < InitiativeOrder.Count
            ? InitiativeOrder[CurrentTurnIndex]
            : Guid.Empty;
    }

    // Advance to next turn
    public void AdvanceToNextTurn()
    {
        CurrentTurnIndex++;

        // If reached end of initiative order, start new round
        if (CurrentTurnIndex >= InitiativeOrder.Count)
        {
            CurrentRound++;
            CurrentTurnIndex = 0;
        }

        Version++;
    }

    // End combat with winner determination
    public void EndCombat(CombatSide winner)
    {
        Status = CombatStatus.Completed;
        Winner = winner;
        EndedAt = DateTime.UtcNow;
        Version++;
    }

    // Check if combat should end
    public CombatOutcome? CheckCombatEnd()
    {
        var playerCount = Combatants.Count(c => c.CombatantType == CombatantType.Character && c.Status == CombatantStatus.Active);
        var enemyCount = Combatants.Count(c => c.CombatantType == CombatantType.Enemy && c.Status == CombatantStatus.Active);

        if (playerCount == 0)
            return new CombatOutcome { Winner = CombatSide.Enemy, RoundEnded = CurrentRound };

        if (enemyCount == 0)
            return new CombatOutcome { Winner = CombatSide.Player, RoundEnded = CurrentRound };

        return null; // Combat continues
    }
}

public enum CombatStatus { NotStarted, Active, Completed }
public enum CombatSide { Player, Enemy, Draw }
```

#### Database Mapping (EF Core)

```csharp
modelBuilder.Entity<CombatEncounter>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.AdventureId).IsRequired();
    entity.HasOne<Adventure>()
        .WithMany()
        .HasForeignKey(e => e.AdventureId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.Property(e => e.Status)
        .HasConversion<string>()
        .HasMaxLength(20);

    entity.Property(e => e.CurrentRound).IsRequired();
    entity.Property(e => e.CurrentTurnIndex).IsRequired();

    entity.Property(e => e.InitiativeOrder)
        .HasColumnType("jsonb")
        .HasConversion(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null) ?? new());

    entity.Property(e => e.Winner)
        .HasConversion<string>()
        .HasMaxLength(20);

    entity.Property(e => e.StartedAt).IsRequired();
    entity.Property(e => e.EndedAt);
    entity.Property(e => e.Version).IsConcurrencyToken();

    entity.HasMany(e => e.Combatants)
        .WithOne(c => c.CombatEncounter)
        .HasForeignKey(c => c.CombatEncounterId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.HasMany(e => e.CompletedActions)
        .WithOne(a => a.CombatEncounter)
        .HasForeignKey(a => a.CombatEncounterId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.HasIndex(e => e.AdventureId);
    entity.HasIndex(e => e.Status);

    entity.ToTable("combat_encounters");
});
```

---

### 2. Combatant (Entity)

**Purpose**: Represents a single participant in combat (player character or enemy)  
**Ownership**: Owned by CombatEncounter, stores reference to Character or Enemy  
**Lifecycle**: Created when combat starts → Updated as damage applied → Marked defeated if health reaches 0 → Removed if fled

#### Properties

| Property          | Type            | Constraints           | Purpose                            | Calculated |
| ----------------- | --------------- | --------------------- | ---------------------------------- | ---------- |
| Id                | Guid            | PK, unique            | Unique combatant identifier        | No         |
| CombatEncounterId | Guid            | FK, non-null          | Parent combat encounter            | No         |
| CombatantType     | CombatantType   | enum                  | Character, Enemy                   | No         |
| CharacterId       | Guid?           | FK, nullable          | Reference to Character (if player) | No         |
| EnemyId           | Guid?           | FK, nullable          | Reference to Enemy (if NPC)        | No         |
| DisplayName       | string          | Non-null, 1-100 chars | Name for UI display                | No         |
| CurrentHealth     | int             | >= 0                  | Health remaining                   | No         |
| MaxHealth         | int             | > 0                   | Maximum health (initial)           | No         |
| ArmorClass        | int             | >= 10                 | Armor/defense value                | No         |
| Status            | CombatantStatus | enum                  | Active, Defeated, Fled             | No         |
| DexterityModifier | int             | -5 to +5              | DEX modifier (for initiative)      | No         |
| EquippedWeaponId  | Guid?           | FK, nullable          | Currently equipped weapon          | No         |
| InitiativeRoll    | int             | 1-20                  | Raw d20 result (for display)       | No         |
| InitiativeScore   | int             | -5 to 25+             | d20 + DEX mod                      | No         |
| AIState           | AIState?        | enum, nullable        | Current AI state (if Enemy)        | No         |
| TiebreakerKey     | Guid            | PK, unique            | For deterministic tie-breaking     | No         |
| CreatedAt         | DateTime        | UTC                   | When combatant entered encounter   | No         |

#### Validation Rules

- **VR-001**: Either `CharacterId` or `EnemyId` must be non-null (XOR)
- **VR-002**: `DisplayName` must be 1-100 characters
- **VR-003**: `CurrentHealth` must be 0 <= health <= MaxHealth
- **VR-004**: `MaxHealth` must be > 0
- **VR-005**: `ArmorClass` must be >= 10 (D&D standard minimum)
- **VR-006**: `DexterityModifier` must be between -5 and +5
- **VR-007**: `InitiativeRoll` must be 1-20 (d20 result)
- **VR-008**: `InitiativeScore` = InitiativeRoll + DexterityModifier
- **VR-009**: `Status` must be valid enum value
- **VR-010**: Only Enemy combatants can have non-null `AIState`

#### Key Methods

```csharp
public class Combatant
{
    public Guid Id { get; private set; }
    public Guid CombatEncounterId { get; private set; }
    public CombatantType CombatantType { get; private set; }
    public Guid? CharacterId { get; private set; }
    public Guid? EnemyId { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public int CurrentHealth { get; private set; }
    public int MaxHealth { get; private set; }
    public int ArmorClass { get; private set; }
    public CombatantStatus Status { get; private set; }
    public int DexterityModifier { get; private set; }
    public Guid? EquippedWeaponId { get; private set; }
    public int InitiativeRoll { get; private set; }
    public int InitiativeScore { get; private set; }
    public AIState? AIState { get; private set; }
    public Guid TiebreakerKey { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Combatant() { }

    // Factory for character combatant
    public static Result<Combatant> CreateFromCharacter(
        Character character,
        int armorClass,
        int maxHealth = 30)
    {
        var result = new Combatant
        {
            Id = Guid.NewGuid(),
            CombatantType = CombatantType.Character,
            CharacterId = character.Id,
            DisplayName = character.Name,
            CurrentHealth = maxHealth,
            MaxHealth = maxHealth,
            ArmorClass = armorClass,
            Status = CombatantStatus.Active,
            DexterityModifier = character.DexModifier,
            TiebreakerKey = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        return Result<Combatant>.Success(result);
    }

    // Factory for enemy combatant
    public static Result<Combatant> CreateFromEnemy(Enemy enemy)
    {
        var result = new Combatant
        {
            Id = Guid.NewGuid(),
            CombatantType = CombatantType.Enemy,
            EnemyId = enemy.Id,
            DisplayName = enemy.Name,
            CurrentHealth = enemy.CurrentHealth,
            MaxHealth = enemy.MaxHealth,
            ArmorClass = enemy.ArmorClass,
            Status = CombatantStatus.Active,
            DexterityModifier = enemy.DexterityModifier,
            AIState = enemy.CurrentAIState,
            TiebreakerKey = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };

        return Result<Combatant>.Success(result);
    }

    // Apply damage to combatant
    public void TakeDamage(int damageAmount)
    {
        if (damageAmount < 0)
            throw new ArgumentException("Damage must be non-negative");

        CurrentHealth = Math.Max(0, CurrentHealth - damageAmount);

        if (CurrentHealth == 0)
            Status = CombatantStatus.Defeated;
    }

    // Check if combatant is still fighting
    public bool IsActive() => Status == CombatantStatus.Active && CurrentHealth > 0;

    // Health percentage (for AI decision-making)
    public double HealthPercentage => CurrentHealth * 100.0 / MaxHealth;

    // Mark as defeated
    public void MarkDefeated()
    {
        Status = CombatantStatus.Defeated;
        CurrentHealth = 0;
    }

    // Mark as fled
    public void MarkFled()
    {
        Status = CombatantStatus.Fled;
    }
}

public enum CombatantType { Character, Enemy }
public enum CombatantStatus { Active, Defeated, Fled }
public enum AIState { Aggressive, Defensive, Flee }
```

#### Database Mapping (EF Core)

```csharp
modelBuilder.Entity<Combatant>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.CombatEncounterId).IsRequired();
    entity.HasOne<CombatEncounter>()
        .WithMany(c => c.Combatants)
        .HasForeignKey(e => e.CombatEncounterId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.Property(e => e.CombatantType)
        .HasConversion<string>()
        .HasMaxLength(20);

    entity.Property(e => e.CharacterId);
    entity.Property(e => e.EnemyId);

    entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
    entity.Property(e => e.CurrentHealth).IsRequired();
    entity.Property(e => e.MaxHealth).IsRequired();
    entity.Property(e => e.ArmorClass).IsRequired();

    entity.Property(e => e.Status)
        .HasConversion<string>()
        .HasMaxLength(20);

    entity.Property(e => e.DexterityModifier).IsRequired();
    entity.Property(e => e.InitiativeRoll).IsRequired();
    entity.Property(e => e.InitiativeScore).IsRequired();

    entity.Property(e => e.AIState)
        .HasConversion<string>()
        .HasMaxLength(20);

    entity.Property(e => e.TiebreakerKey).IsRequired();
    entity.Property(e => e.CreatedAt).IsRequired();

    entity.HasIndex(e => e.CombatEncounterId);
    entity.HasIndex(e => new { e.CombatEncounterId, e.Status });
    entity.HasIndex(e => new { e.CombatEncounterId, e.InitiativeScore }).IsDescending(false, true);

    entity.ToTable("combatants");
});
```

---

### 3. Enemy (Root Aggregate)

**Purpose**: Represents a non-player character with stats, equipment, and AI behavior  
**Ownership**: Created independently, referenced by Combatant  
**Lifecycle**: Create → Stored in database → Used in encounters → Defeated/Fled → Can be reused in future encounters

#### Properties

| Property            | Type     | Constraints           | Purpose                                       | Calculated |
| ------------------- | -------- | --------------------- | --------------------------------------------- | ---------- |
| Id                  | Guid     | PK, unique            | Unique enemy identifier                       | No         |
| Name                | string   | Non-null, 1-100 chars | Enemy name/title                              | No         |
| Description         | string   | 0-500 chars           | Flavor text                                   | No         |
| CurrentHealth       | int      | >= 1                  | Current health pool                           | No         |
| MaxHealth           | int      | > 0                   | Maximum health                                | No         |
| StrBase             | int      | 3-18                  | Strength base value                           | No         |
| DexBase             | int      | 3-18                  | Dexterity base value                          | No         |
| IntBase             | int      | 3-18                  | Intelligence base value                       | No         |
| ConBase             | int      | 3-18                  | Constitution base value                       | No         |
| ChaBase             | int      | 3-18                  | Charisma base value                           | No         |
| StrModifier         | int      | computed              | STR modifier                                  | Yes        |
| DexModifier         | int      | computed              | DEX modifier                                  | Yes        |
| IntModifier         | int      | computed              | INT modifier                                  | Yes        |
| ConModifier         | int      | computed              | CON modifier                                  | Yes        |
| ChaModifier         | int      | computed              | CHA modifier                                  | Yes        |
| ArmorClass          | int      | >= 10                 | Defense value                                 | No         |
| CurrentAIState      | AIState  | enum                  | Aggressive, Defensive, Flee                   | No         |
| FleeHealthThreshold | double   | 0.0-1.0               | Health % when switches to flee (default 0.25) | No         |
| EquippedWeaponInfo  | string   | JSON                  | Weapon name and damage dice                   | No         |
| CreatedAt           | DateTime | UTC                   | When enemy was created                        | No         |
| LastModifiedAt      | DateTime | UTC                   | When enemy was last updated                   | No         |

#### Validation Rules

- **VR-001**: `Name` must be 1-100 characters
- **VR-002**: All base attributes must be 3-18
- **VR-003**: `MaxHealth` > 0
- **VR-004**: `CurrentHealth` <= MaxHealth (enforced in constructor)
- **VR-005**: `ArmorClass` >= 10
- **VR-006**: `FleeHealthThreshold` between 0.0 and 1.0 (typically 0.25)
- **VR-007**: Modifiers calculated as `(base - 10) / 2` using floor division

#### Key Methods

```csharp
public class Enemy
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int CurrentHealth { get; private set; }
    public int MaxHealth { get; private set; }
    public int StrBase { get; private set; }
    public int DexBase { get; private set; }
    public int IntBase { get; private set; }
    public int ConBase { get; private set; }
    public int ChaBase { get; private set; }
    public int ArmorClass { get; private set; }
    public AIState CurrentAIState { get; private set; }
    public double FleeHealthThreshold { get; private set; } = 0.25;
    public string EquippedWeaponInfo { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime LastModifiedAt { get; private set; }

    // Computed modifiers
    public int StrModifier => CalculateModifier(StrBase);
    public int DexModifier => CalculateModifier(DexBase);
    public int IntModifier => CalculateModifier(IntBase);
    public int ConModifier => CalculateModifier(ConBase);
    public int ChaModifier => CalculateModifier(ChaBase);

    private Enemy() { }

    // Factory method
    public static Result<Enemy> Create(
        string name,
        int str, int dex, int intel, int con, int cha,
        int maxHealth,
        int armorClass,
        string weaponInfo,
        double fleeThreshold = 0.25)
    {
        // Validate all fields
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            return Result<Enemy>.Failure("Name must be 1-100 characters");

        if (maxHealth <= 0)
            return Result<Enemy>.Failure("MaxHealth must be positive");

        // Validate attributes
        var attributeError = ValidateAttributes(str, dex, intel, con, cha);
        if (attributeError != null)
            return Result<Enemy>.Failure(attributeError);

        var enemy = new Enemy
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            StrBase = str,
            DexBase = dex,
            IntBase = intel,
            ConBase = con,
            ChaBase = cha,
            CurrentHealth = maxHealth,
            MaxHealth = maxHealth,
            ArmorClass = armorClass,
            CurrentAIState = AIState.Aggressive,
            EquippedWeaponInfo = weaponInfo,
            FleeHealthThreshold = fleeThreshold,
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };

        return Result<Enemy>.Success(enemy);
    }

    // Evaluate current AI state based on health
    public void EvaluateAIState()
    {
        var healthPercent = CurrentHealth * 1.0 / MaxHealth;

        // State transition with hysteresis
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

    // Apply damage
    public void TakeDamage(int amount)
    {
        CurrentHealth = Math.Max(0, CurrentHealth - amount);
    }

    // Health percentage
    public double HealthPercentage => CurrentHealth * 100.0 / MaxHealth;

    private static int CalculateModifier(int baseValue)
    {
        return (int)Math.Floor((baseValue - 10.0) / 2.0);
    }

    private static string? ValidateAttributes(int str, int dex, int intel, int con, int cha)
    {
        var attributes = new[] { str, dex, intel, con, cha };
        if (attributes.Any(a => a < 3 || a > 18))
            return "All attributes must be in range 3-18";

        return null;
    }
}
```

#### Database Mapping (EF Core)

```csharp
modelBuilder.Entity<Enemy>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
    entity.Property(e => e.Description).HasMaxLength(500);
    entity.Property(e => e.CurrentHealth).IsRequired();
    entity.Property(e => e.MaxHealth).IsRequired();

    entity.Property(e => e.StrBase).IsRequired();
    entity.Property(e => e.DexBase).IsRequired();
    entity.Property(e => e.IntBase).IsRequired();
    entity.Property(e => e.ConBase).IsRequired();
    entity.Property(e => e.ChaBase).IsRequired();

    entity.Property(e => e.ArmorClass).IsRequired();

    entity.Property(e => e.CurrentAIState)
        .HasConversion<string>()
        .HasMaxLength(20);

    entity.Property(e => e.FleeHealthThreshold).IsRequired();
    entity.Property(e => e.EquippedWeaponInfo).HasMaxLength(200);
    entity.Property(e => e.CreatedAt).IsRequired();
    entity.Property(e => e.LastModifiedAt).IsRequired();

    entity.HasIndex(e => e.Name);

    entity.ToTable("enemies");
});
```

---

### 4. AttackAction (Value Object)

**Purpose**: Records the result of an attack action for history and display  
**Ownership**: Owned by CombatEncounter, immutable after creation  
**Lifecycle**: Created when attack resolves → Stored for history → Never modified

#### Properties

| Property                      | Type     | Constraints   | Purpose                    | Immutable |
| ----------------------------- | -------- | ------------- | -------------------------- | --------- |
| Id                            | Guid     | PK, unique    | Action identifier          | Yes       |
| CombatEncounterId             | Guid     | FK, non-null  | Parent encounter           | Yes       |
| AttackerId                    | Guid     | FK, non-null  | Combatant attacking        | Yes       |
| TargetId                      | Guid     | FK, non-null  | Combatant target           | Yes       |
| AttackRoll                    | int      | 1-20          | Raw d20 result             | Yes       |
| AttackModifier                | int      | -5 to +10     | Attack bonus applied       | Yes       |
| AttackTotal                   | int      | -5 to 30      | Attack roll + modifier     | Yes       |
| TargetAC                      | int      | >= 10         | Defending AC               | Yes       |
| IsHit                         | bool     | true/false    | Whether attack hit         | Yes       |
| IsCriticalHit                 | bool     | true/false    | Natural 20                 | Yes       |
| WeaponName                    | string   | 1-100 chars   | Weapon used                | Yes       |
| DamageExpression              | string   | e.g., "1d8+3" | Dice expression for damage | Yes       |
| DamageRoll                    | int      | 1+            | Raw damage dice result     | Yes       |
| DamageModifier                | int      | -5 to +10     | Damage bonus               | Yes       |
| TotalDamage                   | int      | >= 0          | Damage dealt (0 if miss)   | Yes       |
| ResolvingCombatantHealthAfter | int      | >= 0          | Target health post-damage  | Yes       |
| Timestamp                     | DateTime | UTC           | When action occurred       | Yes       |

#### Validation Rules

- **VR-001**: `AttackRoll` must be 1-20
- **VR-002**: `AttackTotal` = AttackRoll + AttackModifier
- **VR-003**: `IsHit` = AttackTotal >= TargetAC
- **VR-004**: `IsCriticalHit` = (AttackRoll == 20)
- **VR-005**: `TotalDamage` = DamageRoll + DamageModifier if IsHit, else 0
- **VR-006**: All properties immutable after creation

#### Implementation

```csharp
public record AttackAction
{
    public Guid Id { get; init; }
    public Guid CombatEncounterId { get; init; }
    public Guid AttackerId { get; init; }
    public Guid TargetId { get; init; }
    public int AttackRoll { get; init; }
    public int AttackModifier { get; init; }
    public int AttackTotal { get; init; }
    public int TargetAC { get; init; }
    public bool IsHit { get; init; }
    public bool IsCriticalHit { get; init; }
    public string WeaponName { get; init; } = string.Empty;
    public string DamageExpression { get; init; } = string.Empty;
    public int DamageRoll { get; init; }
    public int DamageModifier { get; init; }
    public int TotalDamage { get; init; }
    public int ResolvingCombatantHealthAfter { get; init; }
    public DateTime Timestamp { get; init; }

    // Factory method
    public static AttackAction Record(
        Guid encounterId,
        Guid attackerId,
        Guid targetId,
        int attackRoll,
        int attackMod,
        int targetAC,
        string weaponName,
        string damageExpr,
        int damageRoll,
        int damageMod,
        int healthAfter)
    {
        var total = attackRoll + attackMod;
        var hits = total >= targetAC;
        var damage = hits ? damageRoll + damageMod : 0;

        return new AttackAction
        {
            Id = Guid.NewGuid(),
            CombatEncounterId = encounterId,
            AttackerId = attackerId,
            TargetId = targetId,
            AttackRoll = attackRoll,
            AttackModifier = attackMod,
            AttackTotal = total,
            TargetAC = targetAC,
            IsHit = hits,
            IsCriticalHit = (attackRoll == 20),
            WeaponName = weaponName,
            DamageExpression = damageExpr,
            DamageRoll = damageRoll,
            DamageModifier = damageMod,
            TotalDamage = damage,
            ResolvingCombatantHealthAfter = healthAfter,
            Timestamp = DateTime.UtcNow
        };
    }
}
```

#### Database Mapping (EF Core)

```csharp
modelBuilder.Entity<AttackAction>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.CombatEncounterId).IsRequired();
    entity.HasOne<CombatEncounter>()
        .WithMany(c => c.CompletedActions)
        .HasForeignKey(e => e.CombatEncounterId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.Property(e => e.AttackerId).IsRequired();
    entity.Property(e => e.TargetId).IsRequired();
    entity.Property(e => e.AttackRoll).IsRequired();
    entity.Property(e => e.AttackModifier).IsRequired();
    entity.Property(e => e.AttackTotal).IsRequired();
    entity.Property(e => e.TargetAC).IsRequired();
    entity.Property(e => e.IsHit).IsRequired();
    entity.Property(e => e.IsCriticalHit).IsRequired();
    entity.Property(e => e.WeaponName).IsRequired().HasMaxLength(100);
    entity.Property(e => e.DamageExpression).IsRequired().HasMaxLength(50);
    entity.Property(e => e.DamageRoll).IsRequired();
    entity.Property(e => e.DamageModifier).IsRequired();
    entity.Property(e => e.TotalDamage).IsRequired();
    entity.Property(e => e.ResolvingCombatantHealthAfter).IsRequired();
    entity.Property(e => e.Timestamp).IsRequired();

    entity.HasIndex(e => e.CombatEncounterId);
    entity.HasIndex(e => new { e.CombatEncounterId, e.Timestamp });

    entity.ToTable("attack_actions");
});
```

---

### 5. InitiativeEntry (Value Object)

**Purpose**: Calculates and stores initiative result for a combatant  
**Ownership**: Immutable, returned by InitiativeCalculator service  
**Lifecycle**: Created once at combat start, used for sorting, never modified

#### Properties

| Property        | Type | Constraints | Purpose                                 | Immutable |
| --------------- | ---- | ----------- | --------------------------------------- | --------- |
| CombatantId     | Guid | PK          | Combat participant                      | Yes       |
| InitiativeRoll  | int  | 1-20        | d20 die result                          | Yes       |
| DexModifier     | int  | -5 to +5    | DEX modifier from combatant             | Yes       |
| InitiativeScore | int  | -5 to 25+   | Roll + Modifier                         | Yes       |
| TiebreakerScore | Guid | PK          | Unique value for deterministic tiebreak | Yes       |

#### Implementation

```csharp
public record InitiativeEntry
{
    public Guid CombatantId { get; init; }
    public int InitiativeRoll { get; init; }
    public int DexModifier { get; init; }
    public int InitiativeScore { get; init; }
    public Guid TiebreakerScore { get; init; }

    public InitiativeEntry(Guid combatantId, int roll, int dexMod, Guid tiebreaker)
    {
        CombatantId = combatantId;
        InitiativeRoll = roll;
        DexModifier = dexMod;
        InitiativeScore = roll + dexMod;
        TiebreakerScore = tiebreaker;
    }

    // For sorting: highest score first, then DEX tiebreaker, then GUID
    public static int Compare(InitiativeEntry a, InitiativeEntry b)
    {
        var scoreCompare = b.InitiativeScore.CompareTo(a.InitiativeScore);
        if (scoreCompare != 0)
            return scoreCompare;

        var dexCompare = b.DexModifier.CompareTo(a.DexModifier);
        if (dexCompare != 0)
            return dexCompare;

        return a.TiebreakerScore.CompareTo(b.TiebreakerScore);
    }
}
```

---

## Relationships and Constraints

### CombatEncounter ↔ Adventure

- **Cardinality**: Many CombatEncounters to One Adventure
- **Foreign Key**: CombatEncounter.AdventureId → Adventure.Id
- **Delete Behavior**: CASCADE
- **Query Path**: `GET /api/adventures/{adventureId}/combats` (list encounters)

### Combatant ↔ CombatEncounter

- **Cardinality**: Many Combatants to One CombatEncounter
- **Foreign Key**: Combatant.CombatEncounterId → CombatEncounter.Id
- **Delete Behavior**: CASCADE
- **Query Path**: `GET /api/combats/{id}/combatants` (list participants)

### Combatant ↔ Character/Enemy

- **Cardinality**: One Combatant to One Character/Enemy
- **Foreign Key**: Combatant.CharacterId → Character.Id OR Combatant.EnemyId → Enemy.Id
- **Delete Behavior**: RESTRICT (prevents deleting character/enemy in active combat)

### AttackAction ↔ CombatEncounter

- **Cardinality**: Many AttackActions to One CombatEncounter
- **Foreign Key**: AttackAction.CombatEncounterId → CombatEncounter.Id
- **Delete Behavior**: CASCADE
- **Query Path**: `GET /api/combats/{id}/actions` (combat history)

### Data Integrity Constraints

```sql
-- CombatEncounter table
ALTER TABLE combat_encounters
ADD CONSTRAINT chk_round_positive CHECK (current_round >= 1),
ADD CONSTRAINT chk_turn_index_non_negative CHECK (current_turn_index >= 0);

-- Combatant table
ALTER TABLE combatants
ADD CONSTRAINT chk_health_range CHECK (current_health >= 0 AND current_health <= max_health),
ADD CONSTRAINT chk_max_health_positive CHECK (max_health > 0),
ADD CONSTRAINT chk_ac_minimum CHECK (armor_class >= 10),
ADD CONSTRAINT chk_dex_range CHECK (dexterity_modifier >= -5 AND dexterity_modifier <= 5),
ADD CONSTRAINT chk_initiative_roll CHECK (initiative_roll >= 1 AND initiative_roll <= 20),
ADD CONSTRAINT chk_char_or_enemy CHECK (
    (combatant_type = 'Character' AND character_id IS NOT NULL AND enemy_id IS NULL) OR
    (combatant_type = 'Enemy' AND enemy_id IS NOT NULL AND character_id IS NULL)
);

-- Enemy table
ALTER TABLE enemies
ADD CONSTRAINT chk_str_range CHECK (str_base >= 3 AND str_base <= 18),
ADD CONSTRAINT chk_dex_range CHECK (dex_base >= 3 AND dex_base <= 18),
ADD CONSTRAINT chk_int_range CHECK (int_base >= 3 AND int_base <= 18),
ADD CONSTRAINT chk_con_range CHECK (con_base >= 3 AND con_base <= 18),
ADD CONSTRAINT chk_cha_range CHECK (cha_base >= 3 AND cha_base <= 18),
ADD CONSTRAINT chk_max_health CHECK (max_health > 0),
ADD CONSTRAINT chk_current_health CHECK (current_health >= 0),
ADD CONSTRAINT chk_ac_minimum CHECK (armor_class >= 10),
ADD CONSTRAINT chk_flee_threshold CHECK (flee_health_threshold >= 0.0 AND flee_health_threshold <= 1.0);

-- AttackAction table
ALTER TABLE attack_actions
ADD CONSTRAINT chk_attack_roll CHECK (attack_roll >= 1 AND attack_roll <= 20),
ADD CONSTRAINT chk_ac_minimum CHECK (target_ac >= 10),
ADD CONSTRAINT chk_damage_non_negative CHECK (total_damage >= 0);
```

---

## State Management

### CombatEncounter Lifecycle

```
┌──────────────────────────────────┐
│  Combat Initiation               │
│  - Create encounter              │
│  - Add combatants                │
│  - Status: NotStarted            │
└──────────────┬────────────────────┘
               │
               ├─ Validation: >= 1 player, >= 1 enemy
               │
               └─ Valid → Call StartCombat()
                              │
                              ├─ Calculate initiative for all
                              ├─ Sort by initiative score
                              ├─ Status: Active
                              └─ CurrentTurnIndex: 0 (first combatant)
                                  │
                                  ┌─────────────────────────────────────────┐
                                  │  Active Combat Loop                     │
                                  │  (While Status == Active)               │
                                  │                                         │
                                  │  1. Get active combatant                │
                                  │  2. Resolve action (attack/defend/flee) │
                                  │  3. Update health                       │
                                  │  4. Check for defeat                    │
                                  │  5. AdvanceToNextTurn()                 │
                                  │  6. Check win condition                 │
                                  │  7. If end condition → Call EndCombat() │
                                  │                                         │
                                  └─────────────────────────────────────────┘
                                  │
                                  ├─ If Winner determined
                                  │
                                  └─ Status: Completed
                                     Winner: Player/Enemy/Draw
                                     EndedAt: [timestamp]
```

### Combatant Status Lifecycle

```
┌───────────────┐
│   Active      │ (Just entered combat)
│ (HP > 0)      │
└───────┬───────┘
        │
        ├─ Take damage
        │  │
        │  ├─ HP > 0 → Remain Active
        │  │
        │  └─ HP <= 0 → Defeated
        │               │
        │               └─ Marked as Defeated
        │                  Skipped in turn order
        │                  Cannot act
        │
        └─ Execute flee action → Fled
                                  │
                                  └─ Removed from turn order
                                     No longer participates
```

### AIState Lifecycle for Enemies

```
┌─────────────────────────────────────────────┐
│  Aggressive (Health > 50%) - Default        │
│  - Attack highest-threat target             │
│  - Engage offensive                         │
└────────────────────┬────────────────────────┘
                     │
                     ├─ Health drops to 25-50%
                     │
                     └─ Transition to Defensive
                            │
                            ├─ Aggressive attacks continue
                            ├─ Consider tactical retreat
                            └─ Favor self-preservation
                                  │
                                  ├─ Health < 25%
                                  │
                                  └─ Transition to Flee
                                         │
                                         ├─ Prioritize escape
                                         ├─ Avoid new targets
                                         └─ Attempt to leave combat
                                              │
                                              ├─ Success → Status = Fled
                                              │
                                              └─ Blocked → Revert to Defensive
```

---

## Design Decisions and Rationale

### 1. Combatant as Separate Entity (Not Direct Character Reference)

**Decision**: Combatant wraps Character or Enemy with combat-specific state  
**Why**:

- Character/Enemy retain permanent stats; Combatant holds temporary combat state (health, initiative)
- Different characters can fight multiple times without modifying original entities
- Clean separation: Character = permanent, Combatant = temporary
- Allows easy combat restart without data loss

### 2. InitiativeOrder as Immutable List (Not Pointer/Cursor)

**Decision**: Store complete sorted order at combat start, maintain as-is throughout  
**Why**:

- D&D 5e RAW: Initiative established once, never recalculated
- Skip defeated combatants in place rather than removing from list (simpler)
- Maintains combat history (who went when)
- Easier to debug/audit encounter state

### 3. Health Mutations in Combatant

**Decision**: CurrentHealth mutable; modified in-place during damage resolution  
**Why**:

- Combat is real-time state; mutations reflect reality
- Simpler than immutable snapshots
- Performance: O(1) health update
- Database single UPDATE statement vs complex transaction

### 4. AIState Transitions Based on Health Percentage

**Decision**: Simple 3-state machine: Aggressive > Defensive > Flee based on health %  
**Why**:

- Lightweight evaluation (O(1), just division)
- D&D-aligned: common player experience
- Hysteresis prevents thrashing (25% flee threshold)
- Sufficient AI variance for replayability

### 5. AttackAction Records History (Immutable)

**Decision**: Never update attack actions; create new for each action  
**Why**:

- Audit trail (who did what when)
- Prevents accidental modifications
- Simpler queries (all actions final)
- Records support debugging/replays

### 6. Rolled Dice Stored (d20, damage rolls)

**Decision**: Store actual d20 result + damage roll results in history  
**Why**:

- Transparency (verify combat math)
- Replayability (deterministic with same seed)
- Debugging (see what happened, not just outcome)
- User trust (no hidden rolls)

### 7. Damage Calculated Synchronously (No Async)

**Decision**: Attack → Roll → Damage → Apply all in single transaction  
**Why**:

- All combat operations < 100ms (meets performance goal)
- No race conditions (single-threaded encounter)
- Simpler exception handling
- D&D games expect immediate resolution

### 8. Enemy as Separate Aggregate (Not just Item/Loot)

**Decision**: Enemy is full aggregate root like Character  
**Why**:

- Enemies are reusable (multiple encounters, different parties)
- Independent stat blocks (not derived from loot)
- Future extensions easier (leveling, loot drops, rewards)
- Clearer ownership (not inventory)

---

## Design Constraints Summary

| Constraint                   | Value                 | Source        | Rationale                    |
| ---------------------------- | --------------------- | ------------- | ---------------------------- |
| Max combatants per encounter | 20+                   | Performance   | Support party + enemy groups |
| Initiative calculation       | d20 + DEX             | FR-002        | D&D 5e standard              |
| Attack roll                  | d20 + mods vs AC      | FR-004        | D&D 5e combat                |
| Damage roll                  | Weapon dice + mods    | FR-005        | D&D 5e standard              |
| AI state transitions         | Automatic on % change | FR-010        | Immersive behavior           |
| Turn resolution latency      | < 100ms               | Constitution  | Maintain flow                |
| Combat history               | All actions recorded  | FR-019        | Audit/transparency           |
| Concurrent updates           | Optimistic locking    | Best practice | Prevent conflicts            |

---

## Future Extensions (Not MVP)

1. **Spell casting**: Special actions with different rolls/saves
2. **Bonus actions**: Movement modeled as separate action
3. **Conditions**: Paralyzed, stunned, blinded (affect rolls)
4. **Resistances**: Damage type reduction
5. **Healing actions**: Restore health instead of dealing damage
6. **Multi-attack**: Extra attack actions per turn (higher levels)
7. **Divine Intervention**: Resurrection/auto-success mechanics
8. **Loot generation**: Auto-reward items on victory
9. **Difficulty scaling**: Enemy stat multipliers for challenging encounters
10. **Combat spectating**: Watch-mode for non-participating users

---

## Summary

**CombatEncounter aggregate root**: Orchestrates turn-based combat, maintains initiative order, tracks round/turn, determines victory

**Combatant entity**: Wraps Character/Enemy with temporary combat state (health, initiative, status)

**Enemy aggregate root**: NPC with attributes, AI state machine, equipment, reusable across encounters

**AttackAction value object**: Immutable history of attack results (roll, hit/miss, damage)

**AIState machine**: Aggressive → Defensive → Flee based on health %, determines enemy actions

**Clear separation**: Permanent data (Character/Enemy) vs temporary state (Combatant health, initiative)

**D&D 5e aligned**: Initiative, attack rolls, AC, damage calculation follows standard rules

**Performance-optimized**: All operations <100ms, no N+1 queries, minimal I/O during combat
