# Quickstart Guide: Inventory Management System

**Feature**: Inventory Management System  
**Date**: 2026-01-29  
**Purpose**: Rapid onboarding for developers implementing the inventory feature

---

## Overview

The Inventory Management System enables adventures to store items, characters to equip gear, and loot tables to generate random rewards. This guide walks through core workflows from API consumer and developer perspectives.

---

## Prerequisites

- **Existing Infrastructure**: Adventure and Character entities already implemented (features 001-003)
- **DiceService**: Available for weighted loot generation
- **PostgreSQL Database**: Accessible via EF Core DbContext
- **Development Tools**: .NET 10 SDK, Entity Framework CLI

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  InventoryController | EquipmentController | LootController │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   Application Layer                         │
│  InventoryService | EquipmentService | LootGeneratorService │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Domain Layer                             │
│   Item (abstract) → StackableItem, UniqueItem               │
│   InventoryEntry | EquipmentSlot | LootTable                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                Infrastructure Layer                         │
│      GameDbContext (EF Core) → PostgreSQL                   │
└─────────────────────────────────────────────────────────────┘
```

---

## API Workflows

### 1. Add Items to Inventory

**Use Case**: Player picks up loot during adventure

**Endpoint**: `POST /api/adventures/{adventureId}/inventory`

**Request**:
```json
{
  "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quantity": 5
}
```

**Response** (201 Created):
```json
{
  "entryId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quantity": 5,
  "merged": false
}
```

**Behavior**:
- **Stackable items**: Automatically merge with existing stacks (up to maxStackSize, default 100)
- **Unique items**: Always create new entry (quantity ignored, set to 1)
- **Capacity**: Max 100 unique inventory entries per adventure (returns 409 if full)

**Example with Stack Merging**:
```bash
# Pick up 5 potions
curl -X POST http://localhost:5000/api/adventures/{id}/inventory \
  -H "Content-Type: application/json" \
  -d '{"itemId": "potion-id", "quantity": 5}'
# Response: {"quantity": 5, "merged": false}

# Pick up 3 more potions
curl -X POST http://localhost:5000/api/adventures/{id}/inventory \
  -H "Content-Type: application/json" \
  -d '{"itemId": "potion-id", "quantity": 3}'
# Response: {"quantity": 8, "merged": true}
```

---

### 2. View Inventory

**Use Case**: Display player's current items

**Endpoint**: `GET /api/adventures/{adventureId}/inventory?limit=50&offset=0`

**Response** (200 OK):
```json
{
  "adventureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "entries": [
    {
      "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "item": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Healing Potion",
        "description": "Restores 50 HP",
        "rarity": "Common",
        "itemType": "Stackable",
        "maxStackSize": 100
      },
      "quantity": 8,
      "addedAt": "2026-01-29T10:30:00Z"
    },
    {
      "id": "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
      "item": {
        "id": "b2c3d4e5-f678-90ab-cdef-123456789012",
        "name": "Iron Longsword",
        "description": "A sturdy blade",
        "rarity": "Uncommon",
        "itemType": "Unique",
        "slotType": "MainHand",
        "modifiers": [
          {"statName": "Attack", "value": 2}
        ]
      },
      "quantity": 1,
      "addedAt": "2026-01-29T11:00:00Z"
    }
  ],
  "totalEntries": 2,
  "limit": 50,
  "offset": 0
}
```

**Pagination**: Use `limit` and `offset` for large inventories

---

### 3. Remove Items from Inventory

**Use Case**: Consume potion, drop item

**Endpoint**: `DELETE /api/adventures/{adventureId}/inventory/{entryId}?quantity=2`

**Response** (204 No Content)

**Behavior**:
- **Stackable items**: Decrements quantity by specified amount
  - If quantity reaches 0 → Entry deleted
- **Unique items**: Entry deleted (quantity parameter ignored)

---

### 4. Equip Item to Slot

**Use Case**: Player equips armor or weapon

**Endpoint**: `PUT /api/characters/{characterId}/equipment/{slotType}`

**Request**:
```json
{
  "itemId": "b2c3d4e5-f678-90ab-cdef-123456789012",
  "adventureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response** (200 OK):
```json
{
  "slotType": "MainHand",
  "equippedItem": {
    "id": "b2c3d4e5-f678-90ab-cdef-123456789012",
    "name": "Iron Longsword",
    "description": "A sturdy blade",
    "rarity": "Uncommon",
    "slotType": "MainHand",
    "modifiers": [
      {"statName": "Attack", "value": 2}
    ]
  },
  "equippedAt": "2026-01-29T14:00:00Z",
  "previousItem": null
}
```

**Validation**:
- Item must exist in adventure inventory
- Item must be UniqueItem (stackable items cannot be equipped)
- Item's `slotType` must match endpoint `slotType` parameter
- If slot already occupied → previous item unequipped and returned to inventory

**Example Error** (400 Bad Request):
```json
{
  "message": "Item cannot be equipped to MainHand slot",
  "errors": ["Item slotType is Chest, expected MainHand"]
}
```

---

### 5. View Character Equipment

**Use Case**: Display equipped gear and total stat modifiers

**Endpoint**: `GET /api/characters/{characterId}/equipment`

**Response** (200 OK):
```json
{
  "characterId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
  "slots": [
    {
      "slotType": "Head",
      "equippedItem": null,
      "equippedAt": null
    },
    {
      "slotType": "Chest",
      "equippedItem": {
        "id": "c3d4e5f6-7890-abcd-ef12-345678901234",
        "name": "Iron Breastplate",
        "rarity": "Uncommon",
        "slotType": "Chest",
        "modifiers": [{"statName": "Defense", "value": 3}]
      },
      "equippedAt": "2026-01-29T12:00:00Z"
    },
    {
      "slotType": "MainHand",
      "equippedItem": {
        "id": "b2c3d4e5-f678-90ab-cdef-123456789012",
        "name": "Iron Longsword",
        "rarity": "Uncommon",
        "slotType": "MainHand",
        "modifiers": [{"statName": "Attack", "value": 2}]
      },
      "equippedAt": "2026-01-29T11:30:00Z"
    },
    { "slotType": "Hands", "equippedItem": null, "equippedAt": null },
    { "slotType": "Legs", "equippedItem": null, "equippedAt": null },
    { "slotType": "Feet", "equippedItem": null, "equippedAt": null },
    { "slotType": "OffHand", "equippedItem": null, "equippedAt": null }
  ],
  "totalModifiers": {
    "Attack": 2,
    "Defense": 3
  }
}
```

**Seven Slots**: Every character has exactly 7 slots (some may be empty)

---

### 6. Unequip Item from Slot

**Use Case**: Remove equipped item, return to inventory

**Endpoint**: `DELETE /api/characters/{characterId}/equipment/{slotType}?adventureId={adventureId}`

**Response** (200 OK):
```json
{
  "slotType": "MainHand",
  "unequippedItem": {
    "id": "b2c3d4e5-f678-90ab-cdef-123456789012",
    "name": "Iron Longsword",
    "rarity": "Uncommon",
    "slotType": "MainHand",
    "modifiers": [{"statName": "Attack", "value": 2}]
  },
  "returnedToInventory": true
}
```

**Behavior**:
- Item removed from slot
- Item added back to adventure inventory as InventoryEntry

---

### 7. Generate Loot from Table

**Use Case**: Defeat enemy, open treasure chest

**Endpoint**: `POST /api/loot-tables/{lootTableId}/generate`

**Request**:
```json
{
  "adventureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "count": 1
}
```

**Response** (200 OK):
```json
{
  "lootTableId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
  "adventureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "generatedItems": [
    {
      "item": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Healing Potion",
        "rarity": "Common",
        "itemType": "Stackable",
        "maxStackSize": 100
      },
      "quantity": 2,
      "rollResult": 45,
      "weight": 60
    }
  ],
  "addedToInventory": true
}
```

**Behavior**:
- Uses DiceService to roll `1d{totalWeight}` (e.g., `1d100` for total weight 100)
- Selects item based on cumulative weight ranges
- Automatically adds generated items to adventure inventory (respects stack merging)
- `count` parameter generates multiple items (useful for treasure chests)

**Weighted Selection Example**:
```
Loot Table: "Goblin Loot"
  - Gold Coins: weight 60 (range 1-60)
  - Healing Potion: weight 30 (range 61-90)
  - Iron Dagger: weight 10 (range 91-100)

Roll 1d100 → 45 → Selects "Gold Coins"
Roll 1d100 → 78 → Selects "Healing Potion"
Roll 1d100 → 95 → Selects "Iron Dagger"
```

---

## Developer Implementation Guide

### Step 1: Database Migration

**Create migration** for inventory tables:

```bash
cd src/DiceEngine.Infrastructure
dotnet ef migrations add AddInventorySystem --project ../DiceEngine.API
```

**Tables created**:
- `items` (TPH: stackable and unique items)
- `inventory_entries` (junction: adventure ↔ items)
- `equipment_slots` (character equipment)
- `loot_tables` (loot definitions)
- `loot_table_entries` (loot table items with weights)

**Apply migration**:
```bash
dotnet ef database update --project ../DiceEngine.API
```

---

### Step 2: Seed Sample Data (Optional)

**Create sample items and loot table**:

```csharp
// In GameDbContext or seed script
public void SeedInventoryData()
{
    // Stackable items
    var healingPotion = new StackableItem
    {
        Id = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
        Name = "Healing Potion",
        Description = "Restores 50 HP",
        Rarity = ItemRarity.Common,
        MaxStackSize = 100
    };
    
    var goldCoins = new StackableItem
    {
        Id = Guid.Parse("d4e5f678-90ab-cdef-1234-567890123456"),
        Name = "Gold Coins",
        Description = "Currency",
        Rarity = ItemRarity.Common,
        MaxStackSize = 100
    };
    
    // Unique items
    var ironSword = new UniqueItem
    {
        Id = Guid.Parse("b2c3d4e5-f678-90ab-cdef-123456789012"),
        Name = "Iron Longsword",
        Description = "A sturdy blade",
        Rarity = ItemRarity.Uncommon,
        SlotType = SlotType.MainHand,
        Modifiers = new List<StatModifier>
        {
            new StatModifier("Attack", 2)
        }
    };
    
    // Loot table
    var goblinLoot = new LootTable
    {
        Id = Guid.Parse("5fa85f64-5717-4562-b3fc-2c963f66afa8"),
        Name = "Goblin Loot",
        Description = "Common enemy drops"
    };
    
    goblinLoot.AddEntry(new LootTableEntry
    {
        Id = Guid.NewGuid(),
        LootTableId = goblinLoot.Id,
        ItemId = goldCoins.Id,
        Weight = 60,
        Quantity = 10
    });
    
    goblinLoot.AddEntry(new LootTableEntry
    {
        Id = Guid.NewGuid(),
        LootTableId = goblinLoot.Id,
        ItemId = healingPotion.Id,
        Weight = 30,
        Quantity = 2
    });
    
    goblinLoot.AddEntry(new LootTableEntry
    {
        Id = Guid.NewGuid(),
        LootTableId = goblinLoot.Id,
        ItemId = ironSword.Id,
        Weight = 10,
        Quantity = 1
    });
    
    Items.AddRange(healingPotion, goldCoins, ironSword);
    LootTables.Add(goblinLoot);
    SaveChanges();
}
```

---

### Step 3: Service Layer Implementation

**InventoryService Example**:

```csharp
public class InventoryService
{
    private readonly GameDbContext _context;
    
    public async Task<Result<AddItemResponse>> AddItemAsync(
        Guid adventureId, 
        Guid itemId, 
        int quantity)
    {
        // 1. Validate adventure exists
        var adventure = await _context.Adventures.FindAsync(adventureId);
        if (adventure == null)
            return Result<AddItemResponse>.Failure("Adventure not found");
        
        // 2. Validate item exists
        var item = await _context.Items.FindAsync(itemId);
        if (item == null)
            return Result<AddItemResponse>.Failure("Item not found");
        
        // 3. Check inventory capacity
        var currentEntryCount = await _context.InventoryEntries
            .CountAsync(e => e.AdventureId == adventureId);
        
        if (currentEntryCount >= 100)
            return Result<AddItemResponse>.Failure("Inventory full");
        
        // 4. Handle stackable vs unique
        if (item is StackableItem stackable)
        {
            // Try to merge with existing stack
            var existingEntry = await _context.InventoryEntries
                .Include(e => e.Item)
                .FirstOrDefaultAsync(e => 
                    e.AdventureId == adventureId && 
                    e.ItemId == itemId);
            
            if (existingEntry != null)
            {
                // Merge (cap at maxStackSize)
                existingEntry.AddQuantity(quantity, stackable.MaxStackSize);
                await _context.SaveChangesAsync();
                
                return Result<AddItemResponse>.Success(new AddItemResponse
                {
                    EntryId = existingEntry.Id,
                    ItemId = itemId,
                    Quantity = existingEntry.Quantity,
                    Merged = true
                });
            }
        }
        
        // 5. Create new entry
        var newEntry = InventoryEntry.Create(adventureId, itemId, quantity);
        if (newEntry.IsFailure)
            return Result<AddItemResponse>.Failure(newEntry.Error);
        
        _context.InventoryEntries.Add(newEntry.Value);
        await _context.SaveChangesAsync();
        
        return Result<AddItemResponse>.Success(new AddItemResponse
        {
            EntryId = newEntry.Value.Id,
            ItemId = itemId,
            Quantity = quantity,
            Merged = false
        });
    }
}
```

---

### Step 4: Controller Implementation

**InventoryController Example**:

```csharp
[ApiController]
[Route("api/adventures/{adventureId}/inventory")]
public class InventoryController : ControllerBase
{
    private readonly InventoryService _inventoryService;
    
    public InventoryController(InventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }
    
    [HttpPost]
    [ProducesResponseType(typeof(AddItemResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddItem(
        [FromRoute] Guid adventureId,
        [FromBody] AddItemRequest request)
    {
        var result = await _inventoryService.AddItemAsync(
            adventureId, 
            request.ItemId, 
            request.Quantity);
        
        if (result.IsFailure)
        {
            if (result.Error.Contains("full"))
                return Conflict(new ErrorResponse { Message = result.Error });
            
            if (result.Error.Contains("not found"))
                return NotFound(new ErrorResponse { Message = result.Error });
            
            return BadRequest(new ErrorResponse { Message = result.Error });
        }
        
        return CreatedAtAction(
            nameof(GetInventory), 
            new { adventureId }, 
            result.Value);
    }
    
    [HttpGet]
    [ProducesResponseType(typeof(InventoryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInventory(
        [FromRoute] Guid adventureId,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        var result = await _inventoryService.GetInventoryAsync(
            adventureId, limit, offset);
        
        return Ok(result);
    }
}
```

---

### Step 5: Testing

**Unit Test Example** (InventoryService):

```csharp
public class InventoryServiceTests
{
    [Fact]
    public async Task AddStackableItem_IdenticalItemExists_MergesStacks()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<GameDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb")
            .Options;
        
        using var context = new GameDbContext(options);
        var service = new InventoryService(context);
        
        var adventure = Adventure.Create("scene1");
        context.Adventures.Add(adventure);
        
        var potion = StackableItem.Create(
            "Healing Potion", "", ItemRarity.Common, 100).Value;
        context.Items.Add(potion);
        
        var existingEntry = InventoryEntry.Create(
            adventure.Id, potion.Id, 5).Value;
        context.InventoryEntries.Add(existingEntry);
        await context.SaveChangesAsync();
        
        // Act
        var result = await service.AddItemAsync(adventure.Id, potion.Id, 3);
        
        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(8, result.Value.Quantity);
        Assert.True(result.Value.Merged);
        
        var entry = await context.InventoryEntries.FindAsync(existingEntry.Id);
        Assert.Equal(8, entry.Quantity);
    }
    
    [Fact]
    public async Task AddItem_InventoryFull_ReturnsFailure()
    {
        // Arrange: Create 100 inventory entries
        // Act: Try to add 101st item
        // Assert: Returns failure with "Inventory full" message
    }
}
```

---

## Common Patterns

### Pattern 1: Stack Merging Logic

**When**: Adding stackable items to inventory

**Steps**:
1. Query for existing InventoryEntry with same itemId
2. If exists → `entry.AddQuantity(amount, maxStackSize)`
3. If not exists → Create new InventoryEntry
4. Always respect maxStackSize cap (default 100)

### Pattern 2: Equipment Slot Validation

**When**: Equipping items to character slots

**Checks**:
1. Item is UniqueItem (not stackable)
2. Item has SlotType property set
3. Item's SlotType matches target slot
4. Item exists in adventure inventory (not equipped elsewhere)

### Pattern 3: Loot Generation with Dice

**When**: Generating random loot

**Algorithm**:
```
1. Load loot table with entries
2. Calculate totalWeight = Sum(entry.Weight for all entries)
3. Call DiceService.RollAsync($"1d{totalWeight}")
4. Iterate entries with cumulative weight:
   cumulative = 0
   for each entry:
     cumulative += entry.Weight
     if roll <= cumulative:
       return entry.Item
5. Add generated item to inventory (respects stacking)
```

### Pattern 4: Stat Modifier Application

**When**: Displaying character stats with equipment bonuses

**Calculation**:
```csharp
var baseStats = character.GetBaseStats();
var equippedItems = await _context.EquipmentSlots
    .Where(s => s.CharacterId == characterId && s.EquippedItemId != null)
    .Include(s => s.EquippedItem)
    .ToListAsync();

var modifiers = new Dictionary<string, int>();
foreach (var slot in equippedItems)
{
    foreach (var modifier in slot.EquippedItem.Modifiers)
    {
        if (!modifiers.ContainsKey(modifier.StatName))
            modifiers[modifier.StatName] = 0;
        
        modifiers[modifier.StatName] += modifier.Value;
    }
}

return new CharacterStatsDto
{
    StrBase = baseStats.Str,
    StrTotal = baseStats.Str + modifiers.GetValueOrDefault("STR", 0),
    // ... repeat for other stats
};
```

---

## Performance Considerations

### Indexes (Already Defined in Migrations)

```sql
-- Inventory queries
CREATE INDEX idx_inventory_adventure ON inventory_entries(adventure_id);
CREATE INDEX idx_inventory_adventure_item ON inventory_entries(adventure_id, item_id);

-- Equipment queries
CREATE INDEX idx_equipment_character ON equipment_slots(character_id);
CREATE UNIQUE INDEX idx_equipment_character_slot ON equipment_slots(character_id, slot_type);

-- Loot generation queries
CREATE INDEX idx_loot_entries_table ON loot_table_entries(loot_table_id);
```

### Query Optimization

**Always use `.Include()` for related entities**:
```csharp
// ❌ Bad: N+1 query problem
var entries = await _context.InventoryEntries
    .Where(e => e.AdventureId == adventureId)
    .ToListAsync();
// Each entry.Item access triggers separate query

// ✅ Good: Single query with JOIN
var entries = await _context.InventoryEntries
    .Include(e => e.Item)
    .Where(e => e.AdventureId == adventureId)
    .ToListAsync();
```

**Paginate large collections**:
```csharp
var entries = await _context.InventoryEntries
    .Include(e => e.Item)
    .Where(e => e.AdventureId == adventureId)
    .OrderBy(e => e.AddedAt)
    .Skip(offset)
    .Take(limit)
    .ToListAsync();
```

---

## Troubleshooting

### Issue: "Inventory full" when adding 50th item

**Cause**: Counting unique entries incorrectly (counting total quantity instead of unique itemIds)

**Fix**: Query distinct InventoryEntry records, not sum of quantities
```csharp
var entryCount = await _context.InventoryEntries
    .CountAsync(e => e.AdventureId == adventureId);
// Correct: Counts 100 entries (not 500 total items across stacks)
```

---

### Issue: Equipment slot validation fails for valid item

**Cause**: SlotType enum mismatch (string vs enum comparison)

**Fix**: Ensure SlotType stored as string in database, compared correctly
```csharp
// ❌ Bad
if (item.SlotType.ToString() == slotType)

// ✅ Good
if (item.SlotType == slotTypeEnum)
```

---

### Issue: Loot generation always returns same item

**Cause**: DiceService not properly integrated or total weight calculation incorrect

**Fix**: Verify total weight calculation and dice expression
```csharp
var totalWeight = lootTable.Entries.Sum(e => e.Weight);
var roll = await _diceService.RollAsync($"1d{totalWeight}");
// Ensure totalWeight > 0 and roll range is [1, totalWeight]
```

---

## Next Steps

1. **Implement Domain Entities**: Create Item, StackableItem, UniqueItem, InventoryEntry, EquipmentSlot, LootTable, LootTableEntry
2. **EF Core Configuration**: Configure TPH inheritance, relationships, indexes
3. **Create Migration**: Generate and apply database migration
4. **Service Layer**: Implement InventoryService, EquipmentService, LootGeneratorService
5. **API Controllers**: Create InventoryController, EquipmentController, LootTablesController
6. **Unit Tests**: Test stack merging, slot validation, loot generation
7. **Integration Tests**: Test full API workflows with database

Refer to [data-model.md](data-model.md) for detailed entity specifications and [contracts/openapi.yaml](contracts/openapi.yaml) for complete API documentation.
