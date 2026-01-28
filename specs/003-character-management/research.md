# Phase 0 Research: Character Management System

**Date**: 2026-01-28  
**Purpose**: Resolve technical unknowns and establish best practices for character attribute systems, modifier calculations, and snapshot/versioning

---

## Research Task 1: D&D Attribute Systems and Modifier Calculations

### Decision: Six-attribute system with floor-division modifier formula

**Rationale**:
- D&D 5e uses standard ability scores (STR, DEX, INT, WIS, CON, CHA) ranging 3-18
- Modifier formula: `(score - 10) / 2` (floor division)
- Examples: 10→0, 11→0 (not 0.5), 12→1, 8→-1, 3→-3.5→-4
- Floor division (round toward negative infinity) matches D&D rules exactly

**Calculation Approach**:
```csharp
public static int CalculateModifier(int baseValue)
{
    // Floor division: (base - 10) rounded down
    // C#: int division automatically truncates toward zero for positive
    // For proper floor division: Math.Floor((baseValue - 10) / 2.0)
    return (baseValue - 10) / 2;  // WARNING: works for this range, see notes below
}

// CORRECTION: For consistency with D&D's rounding toward negative infinity:
public static int CalculateModifier(int baseValue)
{
    return (int)Math.Floor((baseValue - 10.0) / 2.0);
}
```

**Why Floor Division Matters**:
- Test case: baseValue=11 → (11-10)/2 = 0.5 → should floor to 0
- C# integer division truncates: (11-10)/2 = 1/2 = 0 ✅ (correct for positive)
- But: baseValue=9 → (9-10)/2 = -1/2 = 0 ✗ (should be -1, truncates toward zero)
- Solution: Use `Math.Floor()` for consistent behavior in all ranges

**Alternatives Considered & Rejected**:
- Linear scaling (1 point = 1% bonus): Too complex, breaks D&D balance
- Lookup table: Unnecessary complexity, formula is proven
- Database-computed modifier: Adds query complexity, better in-process

---

## Research Task 2: Snapshot/Versioning Strategies for Game State

### Decision: Denormalized snapshots with timestamp and full attribute state

**Rationale**:
- Snapshots capture complete character state at moment of creation
- Store as separate `CharacterSnapshot` entity with denormalized attributes
- Each snapshot is immutable point-in-time capture
- No restoration capability (read-only archive per FR-019)

**Design Approach**:
```csharp
public class Character
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid AdventureId { get; set; }
    
    // Current attributes
    public int StrBase { get; set; }
    public int DexBase { get; set; }
    public int IntBase { get; set; }
    public int ConBase { get; set; }
    public int ChaBase { get; set; }
    
    // Computed modifiers (not stored, calculated on retrieval)
    public int StrModifier => CalculateModifier(StrBase);
    public int DexModifier => CalculateModifier(DexBase);
    // ... etc
    
    public ICollection<CharacterSnapshot> Snapshots { get; set; }
}

public class CharacterSnapshot
{
    public Guid Id { get; set; }
    public Guid CharacterId { get; set; }
    public string Label { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Denormalized snapshot data (immutable after creation)
    public int StrBase { get; set; }
    public int DexBase { get; set; }
    public int IntBase { get; set; }
    public int ConBase { get; set; }
    public int ChaBase { get; set; }
    
    // Optionally store modifiers for historical reference
    public int StrModifier { get; set; }
    public int DexModifier { get; set; }
    // ... etc
}
```

**Alternatives Considered & Rejected**:
- Event Sourcing (store deltas): Overcomplicated for MVP, adds complexity without feature benefit
- Temporal tables (SQL Server feature): Requires PostgreSQL-specific extensions, EF Core support limited
- External versioning service: Adds deployment complexity, not needed for game save feature
- Restoration logic: Deferred per requirements (read-only snapshots), simplifies implementation

---

## Research Task 3: Handling Concurrent Updates & Consistency

### Decision: Optimistic locking with version stamps for character updates

**Rationale**:
- Text adventure is typically single-user-per-adventure (game master controls game)
- Optimistic locking prevents lost updates if concurrent modifications occur
- Simple version stamp on Character entity (increment on each update)
- API returns 409 Conflict if concurrent modification detected

**EF Core Implementation**:
```csharp
public class Character
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    
    // ... attributes ...
    
    // Optimistic locking
    public uint Version { get; set; }
    public DateTime LastModifiedAt { get; set; }
}

// In CharacterService update method:
public async Task<Result<CharacterDto>> UpdateCharacterAsync(
    Guid characterId, UpdateCharacterRequest request, uint expectedVersion)
{
    var character = await _repository.GetByIdAsync(characterId);
    
    if (character.Version != expectedVersion)
    {
        return Result.Error("Character has been modified. Please refresh and retry.");
    }
    
    // Update attributes
    character.StrBase = request.StrBase;
    // ... update other attributes ...
    
    character.Version++;
    character.LastModifiedAt = DateTime.UtcNow;
    
    await _repository.SaveAsync(character);
    return Result.Ok(/* map to DTO */);
}
```

**Alternatives Considered & Rejected**:
- Pessimistic locking (SELECT FOR UPDATE): Performance penalty, unnecessary for text adventure
- Last-write-wins: Silent data loss, unacceptable for game saves
- Distributed consensus: Overcomplicated for single-user scenario

---

## Research Task 4: Entity Framework Core Patterns for Snapshots

### Decision: Owned types for attributes, separate snapshot entity

**Rationale**:
- Attributes (STR, DEX, etc.) are value objects (immutable, no identity)
- Use EF Core Owned Types for clean attribute handling
- Snapshot as separate entity with shadow copies of attributes
- Supports efficient batch queries (snapshots paginated with parent)

**EF Core Configuration**:
```csharp
// In DbContext OnModelCreating:

modelBuilder.Entity<Character>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
    entity.Property(e => e.Version).IsConcurrencyToken();
    
    entity.HasMany(e => e.Snapshots)
        .WithOne(s => s.Character)
        .HasForeignKey(s => s.CharacterId)
        .OnDelete(DeleteBehavior.Cascade);
});

modelBuilder.Entity<CharacterSnapshot>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Label).IsRequired().HasMaxLength(255);
    entity.Property(e => e.CreatedAt).IsRequired();
    
    entity.HasIndex(e => e.CharacterId);
    entity.HasIndex(e => new { e.CharacterId, e.CreatedAt }).IsDescending(false, true);
});
```

**Alternatives Considered & Rejected**:
- EF Core Owned Types for entire snapshot: Makes eager loading complex, harder to query snapshots separately
- JSON columns (PostgreSQL): Flexible but no type safety, query performance worse
- Separate table per version: Schema explosion, maintenance nightmare

---

## Research Task 5: Validation and Constraints

### Decision: Multi-layer validation with domain rules enforced in entity constructors

**Rationale**:
- Parser validation: API request format (type + range checks)
- Domain validation: Business rules in entity construction
- Database constraints: NOT NULL, UNIQUE, FK references, CHECK constraints
- Application service: Transaction semantics and orchestration

**Validation Layers**:
```csharp
// Layer 1: Domain rule (entity constructor)
public class Character
{
    public Character(string name, Guid adventureId, int str, int dex, int intel, int con, int cha)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Character name cannot be empty.");
        
        if (name.Length > 255)
            throw new DomainException("Character name cannot exceed 255 characters.");
        
        ValidateAttributeValue(str, nameof(str));
        ValidateAttributeValue(dex, nameof(dex));
        // ... validate other attributes ...
        
        // All validations passed, set properties
        Id = Guid.NewGuid();
        Name = name.Trim();
        AdventureId = adventureId;
        StrBase = str;
        DexBase = dex;
        IntBase = intel;
        ConBase = con;
        ChaBase = cha;
        CreatedAt = DateTime.UtcNow;
        Version = 1;
    }
    
    private static void ValidateAttributeValue(int value, string attributeName)
    {
        if (value < 3 || value > 18)
            throw new DomainException($"{attributeName} must be between 3 and 18, received {value}.");
    }
}

// Layer 2: API validation (ASP.NET Core)
[ApiController]
[Route("api/adventures/{adventureId}/characters")]
public class CharactersController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateCharacter(
        Guid adventureId, [FromBody] CreateCharacterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        if (request.StrBase < 3 || request.StrBase > 18)
            return BadRequest(new { error = "STR must be 3-18" });
        
        // ... validate other attributes ...
        
        var result = await _characterService.CreateAsync(adventureId, request);
        return result.IsSuccess ? CreatedAtAction(...) : BadRequest(result.Error);
    }
}
```

---

## Research Task 6: Performance Considerations for Snapshots

### Decision: Pagination for snapshot retrieval, indexed queries on chronological order

**Rationale**:
- Snapshots retrieved in chronological order (most recent first)
- Pagination prevents loading unbounded snapshot history
- Index on (CharacterId, CreatedAt DESC) enables efficient sorting
- Limit to 50 snapshots per page by default

**Query Performance Strategy**:
```csharp
public async Task<PagedResult<CharacterSnapshotDto>> GetSnapshotsAsync(
    Guid characterId, int page = 1, int pageSize = 50)
{
    var query = _context.CharacterSnapshots
        .Where(s => s.CharacterId == characterId)
        .OrderByDescending(s => s.CreatedAt);  // Index supports this
    
    var total = await query.CountAsync();
    var snapshots = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(s => new CharacterSnapshotDto { /* ... */ })
        .ToListAsync();
    
    return new PagedResult<CharacterSnapshotDto>
    {
        Data = snapshots,
        Total = total,
        Page = page,
        PageSize = pageSize
    };
}
```

**Database Index Strategy**:
```sql
-- PostgreSQL migration
CREATE INDEX idx_character_snapshots_chronological 
ON character_snapshots(character_id DESC, created_at DESC);
```

---

## Research Task 7: Attribute State Immutability

### Decision: Value object for attributes with factory method validation

**Rationale**:
- Attributes are immutable once set (prevent accidental state corruption)
- Modifier calculated once and cached in snapshot (no recalculation)
- Current character attributes stored as primitive values, computed properties for modifiers
- Snapshots store modifiers for historical accuracy (in case formula changes)

**Implementation**:
```csharp
public class CharacterAttribute
{
    public int BaseValue { get; private set; }
    public int Modifier { get; private set; }
    
    public static Result<CharacterAttribute> Create(int baseValue)
    {
        if (baseValue < 3 || baseValue > 18)
            return Result.Error($"Attribute must be 3-18, received {baseValue}");
        
        return Result.Ok(new CharacterAttribute
        {
            BaseValue = baseValue,
            Modifier = CalculateModifier(baseValue)
        });
    }
    
    private static int CalculateModifier(int baseValue)
    {
        return (int)Math.Floor((baseValue - 10.0) / 2.0);
    }
}
```

---

## Summary of Findings

| Discovery | Solution | Rationale |
|-----------|----------|-----------|
| Modifier rounding | Use Math.Floor for negative infinity rounding | D&D 5e standard; handles all ranges correctly |
| Snapshot strategy | Denormalized with timestamp immutability | Simple, performant, supports read-only archives |
| Concurrent updates | Optimistic locking with version stamps | Prevents silent data loss, minimal overhead |
| Attribute validation | Multi-layer (domain + API + DB) | Fail fast at all boundaries, prevent invalid state |
| Snapshot queries | Paginated with (CharacterId, CreatedAt DESC) index | Efficient retrieval, prevents memory overload |
| Attribute immutability | Value objects with factory validation | Prevent state corruption, compute once |

