# Phase 0 Research: Inventory Management System

**Date**: 2026-01-28  
**Purpose**: Research technical approaches and best practices for inventory system design

---

## Research Overview

This phase investigates design patterns, algorithms, and best practices for implementing robust inventory management in an RPG context. Focus areas include: inventory architecture patterns, weighted loot generation, item effect stacking, and equipment slot management.

---

## 1. Inventory Architecture Patterns

### Decision: Aggregate Root Pattern with Inventory as Primary Aggregate

**Selected Approach**: Implement Inventory as an aggregate root (Domain-Driven Design) that contains collections of stackable and unique items. Character has a reference to their inventory aggregate.

**Rationale**:
- Inventory is a cohesive business entity with its own identity and lifecycle
- Enforces invariants: max 100 unique items, max 100 per stack, preventing duplicate stacks
- Supports transactional consistency within inventory operations
- Aligns with DDD principles already used in DiceEngine feature
- Simplifies testing: can test inventory operations independently from character

**Decision**: Inventory (aggregate root) → [StackableItem | UniqueItem] (aggregate members)

**Alternatives Considered**:
- **Character-owned inventory**: Treating inventory as a value object on Character. Rejected because inventory has complex business logic (stacking, slot management, effects) and should be independently testable. Character should only hold reference to Inventory ID.
- **Flat item collection**: Storing items without aggregate structure. Rejected because it would require controller/service logic to enforce invariants, violating DDD and making testing complex.

---

## 2. Stackable vs. Unique Item Strategy

### Decision: Inheritance Hierarchy with Shared Base + Specialized Properties

**Selected Approach**:
- Base Entity `Item`: Contains universal properties (Name, Description, Rarity, Effects, ItemType)
- `StackableItem` (derived): Adds `Quantity` property, validates against max 100 per stack
- `UniqueItem` (derived): Adds `Durability`, `Enchantments`, `Modifications` (individual state for each instance)
- Inventory aggregation logic handles stacking logic: identical `StackableItem` types merge quantities

**Rationale**:
- Inheritance allows code reuse for common properties (Name, Description, Effects) while specializing behavior
- Quantity is exclusive to stackable items; unique items never have quantity
- Durability/enchantments are exclusive to unique items (each sword is different)
- EF Core supports table-per-hierarchy (discriminator column) for efficient queries
- Clear semantic distinction in code: if you see `StackableItem`, you know it has quantity

**Stack Merge Logic**:
```csharp
// When adding a StackableItem to inventory:
var existing = inventory.Items.OfType<StackableItem>()
    .FirstOrDefault(i => i.Name == newItem.Name && i.Rarity == newItem.Rarity);
if (existing != null)
{
    existing.Quantity = Math.Min(existing.Quantity + newItem.Quantity, 100);
}
else
{
    inventory.AddItem(newItem);
}
```

**Alternatives Considered**:
- **Separate StackableItemService and UniqueItemService**: Would duplicate inventory logic and violate DRY. Rejected.
- **Composition over inheritance**: Using `IStackableItem` and `IUniqueItem` interfaces. Rejected because EF Core inheritance mapping is more efficient and querying is cleaner with derived types.
- **Store quantity on ALL items**: Would require special handling for unique items where quantity must always be 1. Rejected as it adds noise to the model.

---

## 3. Equipment Slot Management

### Decision: Dedicated EquipmentSlot Entities with Validation

**Selected Approach**:
- Seven `EquipmentSlot` entities (Head, Chest, Hands, Legs, Feet, MainHand, OffHand)
- Each slot can hold one `UniqueItem` at most
- Slot types define what item categories can equip (e.g., Head slot only accepts helmets)
- Equipment slots are part of a `CharacterEquipment` aggregate (separate from character)
- Attempting to equip invalid item to slot → validation error, no state change

**Slot Type Constraints**:
```
Head → Helmets, crowns, circlets
Chest → Breastplates, tunics, robes
Hands → Gloves, gauntlets
Legs → Leggings, cuisses, pants  
Feet → Boots, greaves
MainHand → Swords, axes, staves, bows, shields
OffHand → Shields, daggers, torches, off-hand weapons
```

**Rationale**:
- Explicit slots prevent invalid equip attempts (armor in weapon slots)
- Separate CharacterEquipment aggregate from Inventory allows independent validation
- Having seven fixed slots prevents scope creep (can't add 8th slot without specification change)
- Two-handed weapons don't block slots; dual-wield is mechanically supported
- Clear error messages when equipment constraints violated

**Alternatives Considered**:
- **Equipment slot enums on items**: Items specify which slots = valid (e.g., item.AllowedSlots = [Head]). Rejected because validation logic would scatter across Item and Equipment service code.
- **No slot validation engine**: Let controller logic decide. Rejected because invariants would be weakly enforced; could get invalid states.
- **Separate armor/weapon/accessory aggregates**: Overcomplicates the model; a single slot system with type validation is simpler.

---

## 4. Item Effects and Stat Modifiers

### Decision: StatModifier Value Objects + ItemEffect Descriptors

**Selected Approach**:
- `ItemEffect` encapsulates an effect type (Consumable, Modifier) and parameters (health restore amount, defense bonus, etc.)
- `StatModifier` is a value object representing a single stat change: (StatName, ModifierValue, Source)
- When equipped, item generates collection of `StatModifier` objects that are summed into character stats
- Effects trigger on consumption (consumable items) or automatically once equipped (equipment)

**StatModifier Stacking**:
```csharp
// Multiple items with modifiers stack additively
var equipment = new[] { breastplate, shield, ring };
var modifiers = equipment.SelectMany(e => e.Effects)
    .Where(e => e.EffectType == EffectType.Modifier)
    .SelectMany(e => e.GenerateStatModifiers())
    .GroupBy(m => m.StatName)
    .ToDictionary(g => g.Key, g => g.Sum(m => m.Value));
// Result: [Defense: +3, Attack: +1]
```

**Rationale**:
- Value objects for modifiers ensure immutability and are composable
- Effects are descriptors (not executable code) → safe serialization to database
- Stacking is explicit and auditable (know which item caused which modifier)
- Supports both automatic (equipped) and triggered (consumed) effects
- Easy to test: given items X and Y, verify resulting stat modifiers

**Alternatives Considered**:
- **Executable effects**: Store effect logic as delegates/functions. Rejected because not serializable, harder to test, and creates maintenance burden (arbitrary code in database).
- **Stat modifier calculations on demand**: Recalculate every time stats accessed. Rejected because performance (repeated calculations) and loses detail about which item caused which modifier.
- **Override semantics**: Newer items override older items. Rejected because spec explicitly requires additive stacking (e.g., +1 defense from armor and +1 from ring = +2 total).

---

## 5. Loot Table and Random Generation

### Decision: Weighted Random Selection with Sealed Entries

**Selected Approach**:
- `LootTable` aggregate contains collection of `LootTableEntry` items (Item reference, Weight/Probability)
- When opening/defeating source, call `LootService.GenerateLoot(lootTableId)` 
- Algorithm: Calculate cumulative weights, generate random 0-100, select entry where random < cumulative weight
- Loot items automatically added to player inventory (with stack merging for stackable items)

**Weighted Selection Algorithm**:
```csharp
public Item SelectFromLootTable(LootTable table, Random rng)
{
    int totalWeight = table.Entries.Sum(e => e.Weight);
    int random = rng.Next(totalWeight);
    int cumulative = 0;
    
    foreach (var entry in table.Entries)
    {
        cumulative += entry.Weight;
        if (random < cumulative)
            return entry.Item;
    }
    return table.Entries.Last().Item; // Fallback (should not reach)
}
```

**Rationale**:
- Weighted approach more flexible than fixed probabilities (60% = weight 60 not percentage)
- Weights are integers (simpler than floating point and avoids rounding errors)
- O(n) algorithm is acceptable for typical loot tables (< 20 entries)
- Clear semantics: higher weight = more likely to appear
- Supports duplicates in table (e.g., "Gold" listed twice for 2x probability)

**Testing Determinism**:
- Loot generation seeded with known Random(seed) for reproducible tests
- Assert that 1000 generations from known table match expected distribution within ±5%

**Alternatives Considered**:
- **Probability percentages (0.0-1.0)**: Rejected because cumulative rounding errors and harder to understand (weight 3 vs probability 0.0789).
- **Binary search for performance**: Rejected because O(n) sufficient for typical table sizes and simpler code.
- **Async generation**: Rejected because deterministic, fast operation (<1ms) doesn't need async.
- **Multiple items per open**: Spec states single item per creature, all items for chest. Implemented via LootTable config of single entry vs. collection of entries.

---

## 6. Inventory Capacity and Constraints

### Decision: 100 Unique Items + 100 Max Per Stack (as per Spec)

**Implementation**:
- Inventory.AddItem() validation before adding
- If stackable and identical exists: merge (capping at 100 per stack)
- If stackable and no match AND inventory < 100 unique slots: add new stack
- If unique AND inventory < 100 unique items: add unique item
- If storage full: return validation error with message

**Rationale**:
- Spec explicitly states 100 unique items and 100 per stack as assumption
- Reasonable midgame inventory for RPG (large enough to be useful, small enough to require management)
- Capping individual stacks at 100 prevents player from hoarding infinite potions
- Distinction between "unique items" and "stack slots" is important (1 gold stack of 100 ≠ 100 gold stacks)

**Alternatives Considered**:
- **Unlimited inventory**: Rejected per spec assumption; removes inventory management gameplay.
- **Weight-based inventory**: Would need weight property on all items; adds complexity beyond current spec.
- **Dynamic limits per player level**: Rejected because out of scope for MVP; stable MVP constraints better than future capability uncertainty.

---

## 7. Character Integration

### Decision: Separate Inventory and Equipment Aggregates Referenced by Character

**Architecture**:
```
Character (entity)
├── InventoryId (reference to Inventory aggregate root)
├── EquipmentId (reference to CharacterEquipment aggregate root)
└── [character-specific properties: Name, Level, Experience, etc.]
```

**Rationale**:
- Character remains focused on character properties (stats, level, experience)
- Inventory and equipment are separate concerns with independent lifecycles
- Supports future scenarios: dropping inventory mid-adventure, sharing inventory, etc.
- Cleaner testing: can test inventory/equipment independently from character stats
- Mirrors DDD: character references aggregates, doesn't own them outright

**Stat Calculation**:
- CharacterService.GetTotalStats(character) → fetch character base stats + fetch equipment → calculate modifiers → return total stats
- Caching: CharacterService caches results for 1 second per character (typical turn-based RPG update frequency)

**Alternatives Considered**:
- **Inventory as value object within Character**: Would make character very large; inventory changes would dirty character aggregate unnecessarily.
- **Character owns Inventory**: Natural but violates aggregate boundaries; inventory needs independent persistence.

---

## 8. Database Schema Approach

### Decision: Entity Framework Core with Table-per-Hierarchy (TPH) for Items

**Implementation**:
- Single `Items` table with discriminator column (ItemType: "Stackable" | "Unique")
- `StackableItems` has optional Quantity column (NULL for unique items)
- `UniqueItems` has optional Durability, Enchantments columns (NULL for stackable)
- Separate `Inventories` table (aggregate root)
- Separate `LootTables` and `LootTableEntries` tables
- Foreign keys enforce referential integrity

**Rationale**:
- TPH is EF Core default and simplest for inheritance; no complex joins
- Single table for items allows efficient "all items in inventory" queries
- Constraint triggers or application logic prevent invalid NULL combinations
- Migrations auto-generated by EF Core

**Alternatives Considered**:
- **Table-per-type (TPT)**: Requires joins for every item query; rejected for performance.
- **Table-per-concrete-type (TPC)**: Breaks referential integrity; rejected.

---

## 9. API Design Approach

### Decision: Restful Endpoints with Resource Hierarchy

**Endpoints**:
```
POST   /api/inventories/{characterId}/items           # Add item
DELETE /api/inventories/{characterId}/items/{itemId}  # Remove item
GET    /api/inventories/{characterId}                 # View inventory
PUT    /api/equipment/{characterId}/slots/{slotType}  # Equip item
DELETE /api/equipment/{characterId}/slots/{slotType}  # Unequip item
GET    /api/equipment/{characterId}                   # View equipped items
POST   /api/loot-tables/{tableId}/generate            # Generate loot
GET    /api/loot-tables                               # List tables
```

**Rationale**:
- Hierarchical structure (/inventories/{characterId}/items) shows resource relationships
- POST for creation, DELETE for removal, PUT for updates (standard REST semantics)
- Consistent with Constitution principle I (RESTful Design)

---

## Conclusions & Next Steps

All researched areas reaffirm the technical context decisions made in the plan:

1. **Architecture**: Clean Architecture with DDD aggregates is appropriate
2. **Item model**: Inheritance hierarchy (Item → StackableItem/UniqueItem) is sound
3. **Inventory logic**: Stack merging and capacity constraints are straightforward
4. **Equipment**: Dedicated slots with type validation prevent invalid states
5. **Loot**: Weighted selection algorithm is simple and sufficient
6. **Effects**: Value object modifiers with stacking is testable and extensible
7. **Database**: EF Core TPH approach is efficient and maintainable
8. **API**: RESTful design follows Constitution principles

Ready to proceed to Phase 1: Design & Contracts.

