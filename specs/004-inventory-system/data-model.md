# Phase 1 Design: Data Model

**Date**: 2026-01-29  
**Purpose**: Define domain entities, value objects, and relationships for the Inventory Management System

---

## Domain Model Overview

The Inventory Management System operates on interconnected aggregates representing items, inventory storage, equipment slots, and loot generation:

```
Adventure (existing aggregate root)
    └─ InventoryEntry (NEW junction entity)
        ├─ Item (NEW abstract base)
        │   ├─ StackableItem (concrete)
        │   └─ UniqueItem (concrete)
        
Character (existing aggregate root)
    └─ EquipmentSlot (NEW entity)
        └─ UniqueItem (equipped item reference)

LootTable (NEW aggregate root)
    └─ LootTableEntry (NEW entity)
        └─ Item (base item reference)
```

### Data Flow

```
Add Item to Inventory
    │
    ├─ API validates request (item exists, quantity > 0)
    │
    └─ InventoryService.AddItemAsync()
         │
         ├─ If StackableItem: Check for existing stack
         │   ├─ Exists → Merge (cap at 100)
         │   └─ Not exists → Create new InventoryEntry
         │
         ├─ If UniqueItem: Always create new InventoryEntry
         │
         ├─ Check inventory capacity (< 100 unique entries)
         │
         └─ Database persistence (EF Core INSERT) ✅

Equip Item to Slot
    │
    ├─ API validates (item is UniqueItem, slot type matches)
    │
    └─ EquipmentService.EquipItemAsync()
         │
         ├─ Validate item exists in inventory
         │
         ├─ Validate slot type compatibility
         │
         ├─ Move item: Inventory → EquipmentSlot
         │
         ├─ Calculate stat modifiers (apply to character)
         │
         └─ Database persistence (UPDATE slot, DELETE inventory entry) ✅

Generate Loot
    │
    ├─ API validates (loot table exists)
    │
    └─ LootGeneratorService.GenerateAsync()
         │
         ├─ Calculate total weight of loot table entries
         │
         ├─ Roll dice: DiceService.RollAsync($"1d{totalWeight}")
         │
         ├─ Select item based on cumulative weight range
         │
         ├─ Add generated item to adventure inventory
         │
         └─ Return generated item details ✅
```

---

## Entity Definitions

### 1. Item (Abstract Base Entity)

**Purpose**: Base class for all items in the game (stackable consumables and unique equipment)  
**Ownership**: Items exist independently, referenced by inventory, equipment, and loot tables  
**Lifecycle**: Created by game designers → Referenced by inventory/loot → Deleted when no references exist

#### Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| Id | Guid | PK, unique | Unique item identifier | No |
| Name | string | Non-null, 1-100 chars | Item display name | No |
| Description | string | 0-500 chars | Item flavor text | No |
| Rarity | ItemRarity | enum | Common, Uncommon, Rare, Epic, Legendary | No |
| ItemType | string | Discriminator | "Stackable" or "Unique" (EF Core TPH) | No |

#### Validation Rules

- **VR-001**: `Name` must be non-null and between 1-100 characters
- **VR-002**: `Description` optional but max 500 characters
- **VR-003**: `Rarity` must be valid enum value
- **VR-004**: `ItemType` discriminator set by EF Core based on concrete type

#### Key Methods

```csharp
public abstract class Item
{
    public Guid Id { get; protected set; }
    public string Name { get; protected set; } = string.Empty;
    public string Description { get; protected set; } = string.Empty;
    public ItemRarity Rarity { get; protected set; }
    
    protected Item() { } // EF Core constructor
    
    // Factory methods in derived classes
}

public enum ItemRarity
{
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
}
```

#### Database Mapping (EF Core TPH)

```csharp
modelBuilder.Entity<Item>(entity =>
{
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(100);
    
    entity.Property(e => e.Description)
        .HasMaxLength(500);
    
    entity.Property(e => e.Rarity)
        .HasConversion<string>()
        .HasMaxLength(20);
    
    // Table-per-Hierarchy discriminator
    entity.HasDiscriminator<string>("ItemType")
        .HasValue<StackableItem>("Stackable")
        .HasValue<UniqueItem>("Unique");
    
    entity.ToTable("items");
});
```

---

### 2. StackableItem (Concrete Entity)

**Purpose**: Represents bulk items that combine into stacks (potions, arrows, gold)  
**Ownership**: Extends Item base class  
**Lifecycle**: Same as Item, quantity tracked in InventoryEntry

#### Additional Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| MaxStackSize | int | Default 100 | Maximum items per stack | No |

#### Validation Rules

- **VR-001**: Inherits all Item validation rules
- **VR-002**: `MaxStackSize` must be > 0 (validated at creation)
- **VR-003**: Quantity validation occurs at InventoryEntry level (not on item itself)

#### Key Methods

```csharp
public class StackableItem : Item
{
    public int MaxStackSize { get; private set; } = 100;
    
    private StackableItem() { } // EF Core
    
    public static Result<StackableItem> Create(
        string name, 
        string description, 
        ItemRarity rarity,
        int maxStackSize = 100)
    {
        // Validate inputs
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            return Result<StackableItem>.Failure("Name must be 1-100 characters");
        
        if (maxStackSize <= 0)
            return Result<StackableItem>.Failure("MaxStackSize must be positive");
        
        return Result<StackableItem>.Success(new StackableItem
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Rarity = rarity,
            MaxStackSize = maxStackSize
        });
    }
    
    public bool CanStackWith(StackableItem other)
    {
        return Name == other.Name && Rarity == other.Rarity;
    }
}
```

#### Database Mapping

```csharp
modelBuilder.Entity<StackableItem>(entity =>
{
    entity.Property(e => e.MaxStackSize).IsRequired();
});
```

---

### 3. UniqueItem (Concrete Entity)

**Purpose**: Represents individual equipment pieces (weapons, armor) with unique identity and stat modifiers  
**Ownership**: Extends Item base class  
**Lifecycle**: Created → Stored in inventory → Equipped to slot → Unequipped → Removed

#### Additional Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| SlotType | SlotType? | enum, nullable | Compatible equipment slot (null = not equippable) | No |
| Modifiers | List&lt;StatModifier&gt; | JSON | Stat bonuses when equipped | No |

#### Validation Rules

- **VR-001**: Inherits all Item validation rules
- **VR-002**: `SlotType` must be valid enum value if not null
- **VR-003**: `Modifiers` can be empty list (item with no stat bonuses)
- **VR-004**: Each modifier in list must have valid StatName and Value

#### Key Methods

```csharp
public class UniqueItem : Item
{
    public SlotType? SlotType { get; private set; }
    public List<StatModifier> Modifiers { get; private set; } = new();
    
    private UniqueItem() { } // EF Core
    
    public static Result<UniqueItem> Create(
        string name,
        string description,
        ItemRarity rarity,
        SlotType? slotType,
        List<StatModifier>? modifiers = null)
    {
        // Validate inputs
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            return Result<UniqueItem>.Failure("Name must be 1-100 characters");
        
        return Result<UniqueItem>.Success(new UniqueItem
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Rarity = rarity,
            SlotType = slotType,
            Modifiers = modifiers ?? new List<StatModifier>()
        });
    }
    
    public bool IsEquippable() => SlotType.HasValue;
    
    public int GetModifierForStat(string statName)
    {
        return Modifiers.Where(m => m.StatName == statName).Sum(m => m.Value);
    }
}

public enum SlotType
{
    Head,
    Chest,
    Hands,
    Legs,
    Feet,
    MainHand,
    OffHand
}
```

#### Database Mapping

```csharp
modelBuilder.Entity<UniqueItem>(entity =>
{
    entity.Property(e => e.SlotType)
        .HasConversion<string>()
        .HasMaxLength(20);
    
    entity.Property(e => e.Modifiers)
        .HasColumnType("jsonb")
        .HasConversion(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<StatModifier>>(v, (JsonSerializerOptions?)null) 
                 ?? new List<StatModifier>());
});
```

---

### 4. StatModifier (Value Object)

**Purpose**: Represents a single stat modification (e.g., +2 Defense, +1 Attack)  
**Ownership**: Owned by UniqueItem (stored as JSON array)  
**Lifecycle**: Immutable, created with item, applied when item equipped

#### Properties

| Property | Type | Constraints | Purpose | Immutable |
|----------|------|-------------|---------|-----------|
| StatName | string | Non-null, matches character stat | Target stat to modify | Yes |
| Value | int | Can be positive or negative | Modifier amount | Yes |

#### Validation Rules

- **VR-001**: `StatName` must be non-null and match existing character stats
- **VR-002**: `Value` can be any integer (negative for penalties)
- **VR-003**: Value objects are immutable (properties init-only)

#### Implementation

```csharp
public record StatModifier
{
    public string StatName { get; init; } = string.Empty;
    public int Value { get; init; }
    
    public StatModifier(string statName, int value)
    {
        if (string.IsNullOrWhiteSpace(statName))
            throw new ArgumentException("StatName required", nameof(statName));
        
        StatName = statName;
        Value = value;
    }
}
```

---

### 5. InventoryEntry (Junction Entity)

**Purpose**: Links items to adventures and tracks quantity for stackable items  
**Ownership**: Owned by Adventure, references Item  
**Lifecycle**: Created when item added → Updated (quantity) → Deleted when item removed

#### Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| Id | Guid | PK, unique | Entry identifier | No |
| AdventureId | Guid | FK, non-null | Owner adventure | No |
| ItemId | Guid | FK, non-null | Referenced item | No |
| Quantity | int | >= 1 | Stack size (for stackable items) | No |
| SlotPosition | int? | Optional | UI display order | No |
| AddedAt | DateTime | UTC | When item acquired | No |

#### Validation Rules

- **VR-001**: `AdventureId` must reference existing Adventure
- **VR-002**: `ItemId` must reference existing Item
- **VR-003**: `Quantity` must be >= 1 (removing last item deletes entry)
- **VR-004**: For StackableItems: quantity <= item.MaxStackSize (default 100)
- **VR-005**: For UniqueItems: quantity always 1 (enforced in service)
- **VR-006**: Adventure can have max 100 InventoryEntry records

#### Key Methods

```csharp
public class InventoryEntry
{
    public Guid Id { get; private set; }
    public Guid AdventureId { get; private set; }
    public Adventure Adventure { get; private set; } = null!;
    public Guid ItemId { get; private set; }
    public Item Item { get; private set; } = null!;
    public int Quantity { get; private set; }
    public int? SlotPosition { get; private set; }
    public DateTime AddedAt { get; private set; }
    
    private InventoryEntry() { } // EF Core
    
    public static Result<InventoryEntry> Create(
        Guid adventureId,
        Guid itemId,
        int quantity = 1,
        int? slotPosition = null)
    {
        if (quantity < 1)
            return Result<InventoryEntry>.Failure("Quantity must be >= 1");
        
        return Result<InventoryEntry>.Success(new InventoryEntry
        {
            Id = Guid.NewGuid(),
            AdventureId = adventureId,
            ItemId = itemId,
            Quantity = quantity,
            SlotPosition = slotPosition,
            AddedAt = DateTime.UtcNow
        });
    }
    
    public void AddQuantity(int amount, int maxStackSize = 100)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive", nameof(amount));
        
        int newQuantity = Math.Min(Quantity + amount, maxStackSize);
        Quantity = newQuantity;
    }
    
    public void RemoveQuantity(int amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive", nameof(amount));
        
        if (amount > Quantity)
            throw new InvalidOperationException("Cannot remove more than current quantity");
        
        Quantity -= amount;
    }
}
```

#### Database Mapping

```csharp
modelBuilder.Entity<InventoryEntry>(entity =>
{
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.AdventureId).IsRequired();
    entity.HasOne(e => e.Adventure)
        .WithMany()
        .HasForeignKey(e => e.AdventureId)
        .OnDelete(DeleteBehavior.Cascade);
    
    entity.Property(e => e.ItemId).IsRequired();
    entity.HasOne(e => e.Item)
        .WithMany()
        .HasForeignKey(e => e.ItemId)
        .OnDelete(DeleteBehavior.Restrict); // Don't delete item if in inventory
    
    entity.Property(e => e.Quantity).IsRequired();
    entity.Property(e => e.AddedAt).IsRequired();
    
    // Indexes for performance
    entity.HasIndex(e => e.AdventureId);
    entity.HasIndex(e => new { e.AdventureId, e.ItemId }); // For stack merging queries
    
    entity.ToTable("inventory_entries");
});
```

---

### 6. EquipmentSlot (Entity)

**Purpose**: Represents a character's equipment slot (7 slots total) and currently equipped item  
**Ownership**: Owned by Character  
**Lifecycle**: Created with character → Updated (equip/unequip) → Deleted with character

#### Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| Id | Guid | PK, unique | Slot identifier | No |
| CharacterId | Guid | FK, non-null | Owner character | No |
| SlotType | SlotType | enum, non-null | Slot designation | No |
| EquippedItemId | Guid? | FK, nullable | Currently equipped item | No |
| EquippedAt | DateTime? | UTC, nullable | When item equipped | No |

#### Validation Rules

- **VR-001**: `CharacterId` must reference existing Character
- **VR-002**: `SlotType` must be unique per character (one Head slot, one Chest slot, etc.)
- **VR-003**: `EquippedItemId` if not null must reference UniqueItem
- **VR-004**: Equipped item's SlotType must match slot's SlotType (weapons in weapon slots only)
- **VR-005**: Each character has exactly 7 EquipmentSlot records (one per SlotType)

#### Key Methods

```csharp
public class EquipmentSlot
{
    public Guid Id { get; private set; }
    public Guid CharacterId { get; private set; }
    public Character Character { get; private set; } = null!;
    public SlotType SlotType { get; private set; }
    public Guid? EquippedItemId { get; private set; }
    public UniqueItem? EquippedItem { get; private set; }
    public DateTime? EquippedAt { get; private set; }
    
    private EquipmentSlot() { } // EF Core
    
    public static EquipmentSlot CreateEmpty(Guid characterId, SlotType slotType)
    {
        return new EquipmentSlot
        {
            Id = Guid.NewGuid(),
            CharacterId = characterId,
            SlotType = slotType,
            EquippedItemId = null,
            EquippedAt = null
        };
    }
    
    public Result Equip(UniqueItem item)
    {
        if (!item.IsEquippable())
            return Result.Failure("Item is not equippable");
        
        if (item.SlotType != SlotType)
            return Result.Failure($"Item cannot be equipped to {SlotType} slot");
        
        EquippedItemId = item.Id;
        EquippedAt = DateTime.UtcNow;
        return Result.Success();
    }
    
    public UniqueItem? Unequip()
    {
        var previousItem = EquippedItem;
        EquippedItemId = null;
        EquippedAt = null;
        return previousItem;
    }
    
    public bool IsEmpty() => EquippedItemId == null;
}
```

#### Database Mapping

```csharp
modelBuilder.Entity<EquipmentSlot>(entity =>
{
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.CharacterId).IsRequired();
    entity.HasOne(e => e.Character)
        .WithMany(c => c.EquipmentSlots)
        .HasForeignKey(e => e.CharacterId)
        .OnDelete(DeleteBehavior.Cascade);
    
    entity.Property(e => e.SlotType)
        .HasConversion<string>()
        .IsRequired();
    
    entity.Property(e => e.EquippedItemId);
    entity.HasOne(e => e.EquippedItem)
        .WithMany()
        .HasForeignKey(e => e.EquippedItemId)
        .OnDelete(DeleteBehavior.SetNull);
    
    // Unique constraint: one slot per type per character
    entity.HasIndex(e => new { e.CharacterId, e.SlotType })
        .IsUnique();
    
    entity.HasIndex(e => e.CharacterId);
    
    entity.ToTable("equipment_slots");
});
```

---

### 7. LootTable (Aggregate Root)

**Purpose**: Defines a collection of items with weights for random loot generation  
**Ownership**: Independent aggregate (not owned by adventure or character)  
**Lifecycle**: Created by game designers → Referenced by game events → Updated → Deleted

#### Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| Id | Guid | PK, unique | Loot table identifier | No |
| Name | string | Non-null, 1-100 chars | Descriptive name (e.g., "Goblin Loot") | No |
| Description | string | 0-500 chars | Usage notes | No |
| Entries | ICollection&lt;LootTableEntry&gt; | Navigation | Items with weights | No |

#### Validation Rules

- **VR-001**: `Name` must be non-null and 1-100 characters
- **VR-002**: `Entries` must have at least 1 entry (cannot generate from empty table)
- **VR-003**: Total weight of all entries must be > 0

#### Key Methods

```csharp
public class LootTable
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public ICollection<LootTableEntry> Entries { get; private set; } = new List<LootTableEntry>();
    
    private LootTable() { } // EF Core
    
    public static Result<LootTable> Create(string name, string description = "")
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 100)
            return Result<LootTable>.Failure("Name must be 1-100 characters");
        
        return Result<LootTable>.Success(new LootTable
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty
        });
    }
    
    public void AddEntry(LootTableEntry entry)
    {
        if (entry.Weight <= 0)
            throw new ArgumentException("Entry weight must be positive", nameof(entry));
        
        Entries.Add(entry);
    }
    
    public int GetTotalWeight()
    {
        return Entries.Sum(e => e.Weight);
    }
}
```

#### Database Mapping

```csharp
modelBuilder.Entity<LootTable>(entity =>
{
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(100);
    
    entity.Property(e => e.Description)
        .HasMaxLength(500);
    
    entity.HasMany(e => e.Entries)
        .WithOne(e => e.LootTable)
        .HasForeignKey(e => e.LootTableId)
        .OnDelete(DeleteBehavior.Cascade);
    
    entity.ToTable("loot_tables");
});
```

---

### 8. LootTableEntry (Entity)

**Purpose**: Links an item to a loot table with a weight/probability  
**Ownership**: Owned by LootTable  
**Lifecycle**: Created with loot table → Updated (weight changes) → Deleted with loot table

#### Properties

| Property | Type | Constraints | Purpose | Calculated |
|----------|------|-------------|---------|-----------|
| Id | Guid | PK, unique | Entry identifier | No |
| LootTableId | Guid | FK, non-null | Parent loot table | No |
| ItemId | Guid | FK, non-null | Item that can be generated | No |
| Weight | int | > 0 | Relative probability | No |
| Quantity | int | Default 1 | How many of this item to generate | No |

#### Validation Rules

- **VR-001**: `LootTableId` must reference existing LootTable
- **VR-002**: `ItemId` must reference existing Item
- **VR-003**: `Weight` must be > 0 (higher weight = more likely)
- **VR-004**: `Quantity` must be >= 1 (for stackable items, how many to grant)

#### Key Methods

```csharp
public class LootTableEntry
{
    public Guid Id { get; private set; }
    public Guid LootTableId { get; private set; }
    public LootTable LootTable { get; private set; } = null!;
    public Guid ItemId { get; private set; }
    public Item Item { get; private set; } = null!;
    public int Weight { get; private set; }
    public int Quantity { get; private set; } = 1;
    
    private LootTableEntry() { } // EF Core
    
    public static Result<LootTableEntry> Create(
        Guid lootTableId,
        Guid itemId,
        int weight,
        int quantity = 1)
    {
        if (weight <= 0)
            return Result<LootTableEntry>.Failure("Weight must be positive");
        
        if (quantity < 1)
            return Result<LootTableEntry>.Failure("Quantity must be >= 1");
        
        return Result<LootTableEntry>.Success(new LootTableEntry
        {
            Id = Guid.NewGuid(),
            LootTableId = lootTableId,
            ItemId = itemId,
            Weight = weight,
            Quantity = quantity
        });
    }
}
```

#### Database Mapping

```csharp
modelBuilder.Entity<LootTableEntry>(entity =>
{
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.LootTableId).IsRequired();
    entity.HasOne(e => e.LootTable)
        .WithMany(t => t.Entries)
        .HasForeignKey(e => e.LootTableId)
        .OnDelete(DeleteBehavior.Cascade);
    
    entity.Property(e => e.ItemId).IsRequired();
    entity.HasOne(e => e.Item)
        .WithMany()
        .HasForeignKey(e => e.ItemId)
        .OnDelete(DeleteBehavior.Restrict); // Don't delete item if in loot table
    
    entity.Property(e => e.Weight).IsRequired();
    entity.Property(e => e.Quantity).IsRequired();
    
    // Index for loot generation queries
    entity.HasIndex(e => e.LootTableId);
    
    entity.ToTable("loot_table_entries");
});
```

---

## Relationships and Constraints

### Adventure ↔ InventoryEntry

- **Cardinality**: One Adventure to Many InventoryEntries
- **Foreign Key**: InventoryEntry.AdventureId → Adventure.Id
- **Delete Behavior**: CASCADE (delete adventure → delete inventory)
- **Constraint**: Max 100 InventoryEntry records per adventure

### Item ↔ InventoryEntry

- **Cardinality**: One Item to Many InventoryEntries (same item can be in multiple inventories)
- **Foreign Key**: InventoryEntry.ItemId → Item.Id
- **Delete Behavior**: RESTRICT (cannot delete item if in any inventory)

### Character ↔ EquipmentSlot

- **Cardinality**: One Character to Seven EquipmentSlots (exactly 7)
- **Foreign Key**: EquipmentSlot.CharacterId → Character.Id
- **Delete Behavior**: CASCADE (delete character → delete slots)
- **Constraint**: Unique(CharacterId, SlotType) - one slot per type per character

### UniqueItem ↔ EquipmentSlot

- **Cardinality**: One UniqueItem to Zero-or-One EquipmentSlot (item equipped in at most one slot)
- **Foreign Key**: EquipmentSlot.EquippedItemId → UniqueItem.Id
- **Delete Behavior**: SET NULL (delete item → unequip from slot)

### LootTable ↔ LootTableEntry

- **Cardinality**: One LootTable to Many LootTableEntries
- **Foreign Key**: LootTableEntry.LootTableId → LootTable.Id
- **Delete Behavior**: CASCADE (delete loot table → delete entries)

### Item ↔ LootTableEntry

- **Cardinality**: One Item to Many LootTableEntries (same item can be in multiple loot tables)
- **Foreign Key**: LootTableEntry.ItemId → Item.Id
- **Delete Behavior**: RESTRICT (cannot delete item if in any loot table)

---

## State Management

### Item Lifecycle State Machine

```
┌──────────────────────────────┐
│  Item Created                │
│  (game designer defines)     │
└──────────────┬───────────────┘
               │
               ├─ Available (not in inventory or loot table)
               │
               ├─ In Loot Table (LootTableEntry references)
               │
               └─ In Inventory (InventoryEntry references)
                  │
                  ├─ Stackable: Quantity tracked
                  │
                  └─ Unique: Can be equipped
                     │
                     ├─ Equipped → StatModifiers applied to character
                     │
                     └─ Unequipped → Returned to inventory
```

### EquipmentSlot State Machine

```
┌──────────────────────────────┐
│  Slot Created                │
│  (with character)            │
└──────────────┬───────────────┘
               │
               ├─ Empty (EquippedItemId == null)
               │  │
               │  └─ Equip Item → Equipped State
               │
               └─ Equipped (EquippedItemId != null)
                  │
                  ├─ Swap Item → New item equipped
                  │
                  └─ Unequip → Empty State
```

### Loot Generation State Machine

```
┌──────────────────────────────┐
│  Loot Table Queried          │
│  (trigger: defeat enemy,     │
│   open chest)                │
└──────────────┬───────────────┘
               │
               ├─ Roll Dice (DiceService.RollAsync)
               │
               ├─ Select Entry (cumulative weight matching)
               │
               ├─ Generate Item Instance
               │  │
               │  ├─ Stackable → Quantity from entry
               │  │
               │  └─ Unique → Single instance
               │
               └─ Add to Inventory (merge stacks if applicable)
```

---

## Design Decisions and Rationale

### 1. Table-per-Hierarchy (TPH) for Item Inheritance

**Decision**: Single `items` table with discriminator column  
**Why**:
- **Performance**: No JOINs required for polymorphic queries
- **Simplicity**: EF Core native support, minimal configuration
- **Query efficiency**: `.OfType<StackableItem>()` filters automatically
- **Shared properties**: Name, description, rarity shared across types

**Tradeoff**: Some columns NULL for certain types (e.g., `MaxStackSize` NULL for UniqueItem), acceptable overhead.

### 2. InventoryEntry as Junction Entity

**Decision**: Separate table linking Adventure to Item with quantity metadata  
**Why**:
- **Flexibility**: Same item type can appear in multiple inventories
- **Quantity tracking**: InventoryEntry stores stack size
- **Prevents duplication**: Items defined once, referenced many times
- **Supports future features**: Item location, container nesting

### 3. Stat Modifiers as JSON Column

**Decision**: Store List<StatModifier> as jsonb in PostgreSQL  
**Why**:
- **Flexibility**: Any number of modifiers per item without schema changes
- **Query efficiency**: Rarely query individual modifiers (only load with item)
- **Simplicity**: Avoids separate StatModifier table and JOINs
- **PostgreSQL jsonb**: Indexed, efficient storage

### 4. Seven Fixed Equipment Slots

**Decision**: Exactly 7 EquipmentSlot records per character (enum-driven)  
**Why**:
- **Spec requirement**: "seven equipment slots" explicitly defined
- **Validation simplicity**: SlotType enum prevents invalid slots
- **Query efficiency**: Always 7 rows per character, no dynamic slot management
- **Prevents scope creep**: Cannot add 8th slot without spec change

### 5. Loot Generation via Dice Service

**Decision**: Integrate with existing DiceService for weighted random selection  
**Why**:
- **Consistency**: All randomness uses dice mechanics (thematic fit for RPG)
- **Reusability**: Leverage tested RollAsync logic
- **Flexibility**: "1d100" roll mapped to cumulative weight ranges
- **Testability**: Seeded dice rolls for deterministic tests

### 6. Quantity Stored in InventoryEntry (Not Item)

**Decision**: InventoryEntry.Quantity tracks stack size, not Item.Quantity  
**Why**:
- **Items are templates**: Same "Healing Potion" can be in multiple inventories with different quantities
- **Prevents data duplication**: One item definition, many inventory instances
- **Clearer ownership**: Quantity is inventory-specific, not item-specific

### 7. Equipment Modifiers Applied at Query Time

**Decision**: Character stats calculated by summing equipped item modifiers on demand  
**Why**:
- **No denormalization**: Character stats not duplicated in database
- **Easier consistency**: Source of truth is equipped items, not cached stats
- **Simpler updates**: Equip/unequip doesn't require stat recalculation writes
- **Performance acceptable**: <200ms even with modifier summation

---

## Constraints Summary

| Constraint | Value | Source | Rationale |
|-----------|-------|--------|-----------|
| Max inventory entries | 100 | FR-118, Assumptions | Prevents unlimited hoarding, forces inventory management |
| Max stack size | 100 | Assumptions | Prevents unlimited stacking, typical RPG balance |
| Equipment slots per character | 7 | FR-007 | Fixed slots (head, chest, hands, legs, feet, main hand, off hand) |
| Item name length | 1-100 chars | Implementation | Practical limit for UI display |
| Item description length | 0-500 chars | Implementation | Flavor text, avoids excessive storage |
| Loot table entry weight | > 0 | FR-012 | Weighted selection requires positive weights |
| Loot generation quantity | >= 1 | FR-013 | Cannot grant 0 or negative items |

---

## Database Indexes

### Performance-Critical Indexes

```sql
-- Inventory queries (frequent: "get all items in adventure")
CREATE INDEX idx_inventory_adventure ON inventory_entries(adventure_id);
CREATE INDEX idx_inventory_adventure_item ON inventory_entries(adventure_id, item_id);

-- Equipment queries (frequent: "get all equipped items for character")
CREATE INDEX idx_equipment_character ON equipment_slots(character_id);
CREATE UNIQUE INDEX idx_equipment_character_slot ON equipment_slots(character_id, slot_type);

-- Loot generation queries (frequent: "get all entries in loot table")
CREATE INDEX idx_loot_entries_table ON loot_table_entries(loot_table_id);

-- Item type filtering (frequent: ".OfType<StackableItem>()")
-- No index needed: ItemType discriminator already indexed by EF Core
```

---

## Future Extensions (Not MVP)

1. **Item durability**: UniqueItem loses durability on use, breaks at 0
2. **Item enchantments**: Apply magical effects beyond stat modifiers
3. **Crafting system**: Combine items to create new items
4. **Item sets**: Bonuses for equipping multiple related items
5. **Cursed items**: Cannot unequip without special action
6. **Container items**: Bags that hold sub-inventory (nested inventories)
7. **Item trading**: Transfer inventory items between characters/adventures
8. **Item rarity affects loot**: Higher rarity items have lower loot weights

---

## Summary

**Item hierarchy**:
- Abstract `Item` base with `StackableItem` and `UniqueItem` concrete types
- TPH inheritance for efficient queries

**Inventory management**:
- `InventoryEntry` junction entity links adventures to items with quantity
- Stack merging for identical stackable items (cap at 100)
- Max 100 unique inventory entries per adventure

**Equipment system**:
- Seven `EquipmentSlot` entities per character
- Slot type validation prevents invalid equips
- Stat modifiers from equipped items applied dynamically

**Loot generation**:
- `LootTable` aggregate with weighted `LootTableEntry` items
- Dice service integration for weighted random selection
- Generated items added to adventure inventory

**Clear validation layers**: API → Service → Domain  
**Simplicity**: Standard EF Core patterns, no over-engineering  
**Meets all FR requirements**: Inventory CRUD, equipment slots, loot tables, stat modifiers
