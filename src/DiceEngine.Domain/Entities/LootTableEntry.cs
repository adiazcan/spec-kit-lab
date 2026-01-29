using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents an entry in a loot table with a weight for probability.
/// </summary>
public class LootTableEntry
{
    public Guid Id { get; private set; }
    public Guid LootTableId { get; private set; }
    public LootTable LootTable { get; private set; } = null!;
    public Guid ItemId { get; private set; }
    public Item Item { get; private set; } = null!;
    public int Weight { get; private set; }
    public int Quantity { get; private set; } = 1;

    private LootTableEntry() { } // EF Core constructor

    /// <summary>
    /// Factory method for creating a new loot table entry.
    /// </summary>
    public static LootTableEntry Create(
        Guid lootTableId,
        Guid itemId,
        int weight,
        int quantity = 1)
    {
        if (weight <= 0)
            throw new ArgumentException("Weight must be positive", nameof(weight));
        if (quantity < 1)
            throw new ArgumentException("Quantity must be at least 1", nameof(quantity));

        return new LootTableEntry
        {
            Id = Guid.NewGuid(),
            LootTableId = lootTableId,
            ItemId = itemId,
            Weight = weight,
            Quantity = quantity
        };
    }
}
