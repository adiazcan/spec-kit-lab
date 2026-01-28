# Phase 1 Design: Data Model

**Date**: 2026-01-28  
**Purpose**: Define domain entities, value objects, and relationships for the Character Management System

---

## Domain Model Overview

The Character Management System operates on linked entities representing game characters:

```
Adventure (existing aggregate root)
    ├─ Character (NEW aggregate root)
    │   ├─ Name (string)
    │   ├─ Five Attributes: STR, DEX, INT, CON, CHA (int base values)
    │   ├─ Computed Modifiers: derived from base values
    │   ├─ Version (optimistic locking)
    │   └─ Snapshots: CharacterSnapshot[]
    │
    └─ CharacterSnapshot (NEW entity)
        ├─ Label (optional)
        ├─ Timestamp
        └─ Captured Attributes (STR, DEX, INT, CON, CHA with modifiers)
```

### Data Flow

```
Create Character Request
    │
    ├─ API validates format (3-18 range)
    │
    └─ CharacterService.CreateAsync()
         │
         ├─ Domain validation (entity constructor)
         │
         ├─ Database persistence (EF Core INSERT)
         │
         └─ Character aggregate created ✅
              │
              └─ Available for retrieval, update, snapshot

Update Character Attributes
    │
    ├─ API validates request format
    │
    └─ CharacterService.UpdateAsync()
         │
         ├─ Optimistic lock check (version match)
         │
         ├─ Recalculate modifiers (in-process)
         │
         ├─ Database persistence (EF Core UPDATE)
         │
         └─ Character updated ✅
              │
              └─ Modifiers auto-recalculated on next retrieval

Create Character Snapshot
    │
    ├─ CharacterService.CreateSnapshotAsync()
    │
    ├─ Capture current attributes + calculated modifiers
    │
    └─ CharacterSnapshot entity created (immutable) ✅
         │
         └─ Read-only archive, no restoration
```

---

## Entity Definitions

### 1. Character (Root Aggregate)

**Purpose**: Represents a playable/non-playable game character with attributes, modifiers, and history  
**Ownership**: Created by CharacterService, owned by Adventure  
**Lifecycle**: Create → Update (optional) → Snapshot (optional) → Delete (optional)

#### Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| Id | Guid | PK, unique | Unique character identifier | No |
| Name | string | Non-null, 1-255 chars | Character name | No |
| AdventureId | Guid | FK, non-null | Foreign key to Adventure | No |
| StrBase | int | 3-18 | Strength base value | No |
| DexBase | int | 3-18 | Dexterity base value | No |
| IntBase | int | 3-18 | Intelligence base value | No |
| ConBase | int | 3-18 | Constitution base value | No |
| ChaBase | int | 3-18 | Charisma base value | No |
| StrModifier | int | computed | Strength modifier: (StrBase-10)/2 | Yes |
| DexModifier | int | computed | Dexterity modifier: (DexBase-10)/2 | Yes |
| IntModifier | int | computed | Intelligence modifier: (IntBase-10)/2 | Yes |
| ConModifier | int | computed | Constitution modifier: (ConBase-10)/2 | Yes |
| ChaModifier | int | computed | Charisma modifier: (ChaBase-10)/2 | Yes |
| CreatedAt | DateTime | UTC, immutable | Timestamp of creation | No |
| LastModifiedAt | DateTime | UTC | Timestamp of last update | No |
| Version | uint | Concurrency token | Version for optimistic locking | No |
| Snapshots | ICollection<CharacterSnapshot> | Navigation property | Historical snapshots (read-only reference) | No |

#### Validation Rules

- **VR-001**: `Name` must be non-null and between 1-255 characters
- **VR-002**: All base attributes (STR, DEX, INT, CON, CHA) must be 3-18 (inclusive)
- **VR-003**: `AdventureId` must reference an existing Adventure (FK constraint)
- **VR-004**: `CreatedAt` must be UTC timestamp (set at creation, never modified)
- **VR-005**: `Version` starts at 1, increments on each update (optimistic locking)
- **VR-006**: Modifiers computed as `(base - 10) / 2` using floor division (Math.Floor)

#### Key Methods

```csharp
public class Character
{
    // Factory method (preferred creation path)
    public static Result<Character> Create(
        string name, Guid adventureId,
        int str, int dex, int intel, int con, int cha)
    {
        // Validate all fields, return Result<Character>
    }
    
    // Update method with optimistic locking
    public void UpdateAttributes(
        int str, int dex, int intel, int con, int cha)
    {
        // Validate and update base values
        // Modifiers recomputed via properties
        // Version incremented
    }
    
    // Computed modifier properties (no setters)
    public int StrModifier => CalculateModifier(StrBase);
    public int DexModifier => CalculateModifier(DexBase);
    // ... etc
    
    private static int CalculateModifier(int baseValue)
    {
        return (int)Math.Floor((baseValue - 10.0) / 2.0);
    }
}
```

#### Database Mapping (EF Core)

```csharp
modelBuilder.Entity<Character>(entity =>
{
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(255);
    
    entity.Property(e => e.AdventureId).IsRequired();
    entity.HasOne<Adventure>()
        .WithMany()
        .HasForeignKey(e => e.AdventureId)
        .OnDelete(DeleteBehavior.Cascade);
    
    entity.Property(e => e.StrBase).IsRequired();
    entity.Property(e => e.DexBase).IsRequired();
    entity.Property(e => e.IntBase).IsRequired();
    entity.Property(e => e.ConBase).IsRequired();
    entity.Property(e => e.ChaBase).IsRequired();
    
    entity.Property(e => e.CreatedAt).IsRequired();
    entity.Property(e => e.LastModifiedAt).IsRequired();
    entity.Property(e => e.Version).IsConcurrencyToken();
    
    entity.HasMany(e => e.Snapshots)
        .WithOne(s => s.Character)
        .HasForeignKey(s => s.CharacterId)
        .OnDelete(DeleteBehavior.Cascade);
    
    entity.HasIndex(e => e.AdventureId);
    entity.ToTable("characters");
});
```

---

### 2. CharacterSnapshot (Archive Entity)

**Purpose**: Immutable point-in-time capture of character state for game saves and versioning  
**Ownership**: Created by CharacterService, owned by Character  
**Lifecycle**: Create (once) → Retrieved (read-only) → Delete (cascade with character)

#### Properties

| Property | Type | Constraints | Purpose | Immutable After Creation |
|----------|------|-------------|---------|-------------------------|
| Id | Guid | PK, unique | Snapshot identifier | Yes |
| CharacterId | Guid | FK, non-null | Reference to parent Character | Yes |
| Label | string | 0-255 chars | User-friendly name (e.g., "Level 1", "Before Dragon") | Yes |
| CreatedAt | DateTime | UTC, immutable | When snapshot was captured | Yes |
| StrBase | int | 3-18 | Captured STR base value | Yes |
| DexBase | int | 3-18 | Captured DEX base value | Yes |
| IntBase | int | 3-18 | Captured INT base value | Yes |
| ConBase | int | 3-18 | Captured CON base value | Yes |
| ChaBase | int | 3-18 | Captured CHA base value | Yes |
| StrModifier | int | computed | Modifier at snapshot time | Yes |
| DexModifier | int | computed | Modifier at snapshot time | Yes |
| IntModifier | int | computed | Modifier at snapshot time | Yes |
| ConModifier | int | computed | Modifier at snapshot time | Yes |
| ChaModifier | int | computed | Modifier at snapshot time | Yes |
| Character | Character | Navigation property | Parent character reference | Yes |

#### Validation Rules

- **VR-001**: `CharacterId` must reference an existing Character (FK constraint)
- **VR-002**: `Label` optional but max 255 characters if provided
- **VR-003**: All captured attributes (base values) must match Character's attributes at snapshot time
- **VR-004**: All captured modifiers must be calculated from base values at creation
- **VR-005**: `CreatedAt` must be UTC timestamp (immutable)
- **VR-006**: Snapshots are read-only (no update operations after creation)

#### Key Methods

```csharp
public class CharacterSnapshot
{
    // Factory method
    public static CharacterSnapshot CreateFromCharacter(
        Character character, string? label = null)
    {
        return new CharacterSnapshot
        {
            Id = Guid.NewGuid(),
            CharacterId = character.Id,
            Label = label?.Trim(),
            CreatedAt = DateTime.UtcNow,
            StrBase = character.StrBase,
            DexBase = character.DexBase,
            IntBase = character.IntBase,
            ConBase = character.ConBase,
            ChaBase = character.ChaBase,
            StrModifier = character.StrModifier,
            DexModifier = character.DexModifier,
            IntModifier = character.IntModifier,
            ConModifier = character.ConModifier,
            ChaModifier = character.ChaModifier
        };
    }
    
    // No update methods - snapshots are immutable
}
```

#### Database Mapping (EF Core)

```csharp
modelBuilder.Entity<CharacterSnapshot>(entity =>
{
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.CharacterId).IsRequired();
    entity.HasOne(e => e.Character)
        .WithMany(c => c.Snapshots)
        .HasForeignKey(e => e.CharacterId)
        .OnDelete(DeleteBehavior.Cascade);
    
    entity.Property(e => e.Label).HasMaxLength(255);
    entity.Property(e => e.CreatedAt).IsRequired();
    
    entity.Property(e => e.StrBase).IsRequired();
    entity.Property(e => e.DexBase).IsRequired();
    entity.Property(e => e.IntBase).IsRequired();
    entity.Property(e => e.ConBase).IsRequired();
    entity.Property(e => e.ChaBase).IsRequired();
    
    // Modifiers stored for historical reference
    entity.Property(e => e.StrModifier).IsRequired();
    entity.Property(e => e.DexModifier).IsRequired();
    entity.Property(e => e.IntModifier).IsRequired();
    entity.Property(e => e.ConModifier).IsRequired();
    entity.Property(e => e.ChaModifier).IsRequired();
    
    // Indexes for efficient queries
    entity.HasIndex(e => e.CharacterId);
    entity.HasIndex(e => new { e.CharacterId, e.CreatedAt }).IsDescending(false, true);
    
    entity.ToTable("character_snapshots");
});
```

---

## Relationships and Constraints

### Character ↔ Adventure

- **Cardinality**: Many Characters to One Adventure
- **Foreign Key**: Character.AdventureId → Adventure.Id
- **Delete Behavior**: CASCADE (delete adventure → delete characters)
- **Query Path**: `GET /api/adventures/{adventureId}/characters` (list by adventure)

### Character ↔ CharacterSnapshot

- **Cardinality**: One Character to Many Snapshots
- **Foreign Key**: CharacterSnapshot.CharacterId → Character.Id
- **Delete Behavior**: CASCADE (delete character → delete snapshots)
- **Query Path**: `GET /api/characters/{id}/snapshots` (list snapshots for character)

### Data Integrity Constraints

```sql
-- Character table
ALTER TABLE characters
ADD CONSTRAINT chk_str_range CHECK (str_base >= 3 AND str_base <= 18),
ADD CONSTRAINT chk_dex_range CHECK (dex_base >= 3 AND dex_base <= 18),
ADD CONSTRAINT chk_int_range CHECK (int_base >= 3 AND int_base <= 18),
ADD CONSTRAINT chk_con_range CHECK (con_base >= 3 AND con_base <= 18),
ADD CONSTRAINT chk_cha_range CHECK (cha_base >= 3 AND cha_base <= 18);

-- CharacterSnapshot table
ALTER TABLE character_snapshots
ADD CONSTRAINT chk_snapshot_str CHECK (str_base >= 3 AND str_base <= 18),
ADD CONSTRAINT chk_snapshot_dex CHECK (dex_base >= 3 AND dex_base <= 18),
ADD CONSTRAINT chk_snapshot_int CHECK (int_base >= 3 AND int_base <= 18),
ADD CONSTRAINT chk_snapshot_con CHECK (con_base >= 3 AND con_base <= 18),
ADD CONSTRAINT chk_snapshot_cha CHECK (cha_base >= 3 AND cha_base <= 18);
```

---

## State Management

### Character Lifecycle State Machine

```
┌──────────────────────────────┐
│  Character Creation          │
│  (validate, persist)         │
└──────────────┬───────────────┘
               │
               ├─ Valid → Active
               │
               │  ┌─────────────────────────────┐
               │  │  Character Active State     │
               │  │ - Can be retrieved          │
               │  │ - Can be updated            │
               │  │ - Can have snapshots        │
               │  │ - Version increments on     │
               │  │   each update               │
               │  └────────────┬────────────────┘
               │               │
               │               ├─ Update Attributes → Version++, LastModifiedAt updated
               │               │
               │               ├─ Create Snapshot → CharacterSnapshot created (immutable)
               │               │
               │               └─ Delete Character → Deleted (cascades snapshots)
               │
               └─ Invalid → Rejected (DomainException)
```

### CharacterSnapshot Lifecycle State Machine

```
┌──────────────────────────────┐
│  Snapshot Creation           │
│  (capture current state)     │
└──────────────┬───────────────┘
               │
               └─ Immutable Archive State
                  - Read-only
                  - No updates allowed
                  - Cascades on character delete
                  - Retrieved by creation timestamp
```

---

## Modifier Calculation Rules

### Formula

$$\text{Modifier} = \left\lfloor \frac{\text{BaseValue} - 10}{2} \right\rfloor$$

### Examples

| Base Value | Calculation | Result | Notes |
|------------|-------------|--------|-------|
| 3 | (3-10)/2 = -7/2 = -3.5 → -4 | **-4** | Minimum possible |
| 8 | (8-10)/2 = -2/2 = -1 | **-1** | Below average |
| 9 | (9-10)/2 = -1/2 = -0.5 → -1 | **-1** | Floor toward negative infinity |
| 10 | (10-10)/2 = 0/2 = 0 | **0** | Average (no modifier) |
| 11 | (11-10)/2 = 1/2 = 0.5 → 0 | **0** | Above average, no modifier yet |
| 12 | (12-10)/2 = 2/2 = 1 | **+1** | Modest bonus |
| 18 | (18-10)/2 = 8/2 = 4 | **+4** | Maximum possible |

### C# Implementation

```csharp
// Correct floor division implementation
private static int CalculateModifier(int baseValue)
{
    // Math.Floor handles negative results correctly
    // (9-10)/2 = -0.5 rounds to -1 ✅
    return (int)Math.Floor((baseValue - 10.0) / 2.0);
}

// Unit tests verify correctness
[Theory]
[InlineData(3, -4)]
[InlineData(8, -1)]
[InlineData(9, -1)]  // Critical: 0.5 floors to -1, not 0
[InlineData(10, 0)]
[InlineData(11, 0)]  // Critical: 0.5 floors to 0
[InlineData(18, 4)]
public void CalculateModifier_ReturnsCorrectValues(int baseValue, int expectedModifier)
{
    var actual = CharacterAttributeHelper.CalculateModifier(baseValue);
    Assert.Equal(expectedModifier, actual);
}
```

---

## Design Decisions and Rationale

### 1. Computed Modifiers (Not Stored in Current Character)

**Decision**: Modifiers calculated from base values; not persisted for current character  
**Why**:
- Single source of truth (base value)
- Formula immutable; no recalculation needed if logic changes
- Snapshots store modifiers for historical accuracy
- Simplifies updates (only update base values, modifiers derived)

### 2. Snapshots Are Immutable

**Decision**: CharacterSnapshot cannot be updated after creation; no restoration  
**Why**:
- Prevents accidental modification of historical state
- Meets requirements (FR-019: snapshots are read-only)
- Simplifies concurrency (no version tracking needed for snapshots)
- Clearly communicates intent (archive, not live data)

### 3. Optimistic Locking on Character

**Decision**: Version-based optimistic locking for concurrent updates  
**Why**:
- Prevents lost updates if two users modify character simultaneously
- Low overhead (single version column)
- Matches EF Core's built-in support
- Returns 409 Conflict for version mismatch (client retries with fresh data)

### 4. Attributes as Simple Integers

**Decision**: Store attributes as int properties, not complex objects  
**Why**:
- Simpler mapping to database (no value object complexity)
- Modifier calculation straightforward (computed property)
- All attributes validated in same constructor
- Avoids over-engineering for MVP scope

### 5. Label Optional on Snapshots

**Decision**: Snapshot labels are user-defined, optional  
**Why**:
- Allows flexibility ("Before Dragon" vs "Auto-save 2026-01-28")
- Database nullable field (no default required)
- API request allows omission

### 6. Snapshots Store Modifiers

**Decision**: Denormalize modifier values in snapshot  
**Why**:
- Historical accuracy (if formula ever changes, snapshots preserve original modifiers)
- Avoids recalculation (faster queries)
- Simpler than storing formula version
- Slight storage overhead acceptable

---

## Constraints Summary

| Constraint | Value | Source | Rationale |
|----------|-------|--------|-----------|
| Character.Name length | 1-255 chars | Database VARCHAR | Practical limit, avoids storage issues |
| Attribute base value range | 3-18 | FR-002 | D&D 5e standard |
| Modifier calculation | Floor division | FR-003, Research | D&D rule: (base-10)/2 rounded down |
| Snapshots per character | Unlimited (paginated) | Performance | Queries paginated, no hard limit |
| Character name uniqueness | Not enforced | Simplicity | Multiple characters can share names |
| Update conflicts | Optimistic locking | Concurrency | Detects simultaneous modifications |
| Snapshot restoration | Not supported | FR-019 | Snapshots serve as archives only |

---

## Future Extensions (Not MVP)

1. **Multi-character snapshots**: Capture entire party state at once
2. **Snapshot comparison**: Diff showing what changed between snapshots
3. **Snapshot restoration**: Rollback character to previous snapshot (deferred per spec)
4. **Character classes/templates**: Pre-built attribute arrays (e.g., "Barbarian")
5. **Skill proficiencies**: Derived from attributes with customization
6. **Equipment tracking**: Linked items with attribute bonuses
7. **Experience/leveling**: Automatic attribute growth on level-up

---

## Summary

**Character aggregate root**:
- Represents in-game character with unique identity
- Five core attributes (STR, DEX, INT, CON, CHA) with auto-calculated modifiers
- Linked to Adventure (many-to-one relationship)
- Supports versioning for optimistic locking

**CharacterSnapshot entity**:
- Immutable point-in-time capture of character state
- Stores full attribute snapshot + calculated modifiers
- Supports game saves and historical reference
- Automatically cascades when character deleted

**Clear validation layers**: API → Domain → Database  
**Simplicity**: No event sourcing, no complex state machines, standard EF Core patterns  
**Meets all FR requirements**: CRUD operations, attribute constraints, automatic modifiers, snapshots

