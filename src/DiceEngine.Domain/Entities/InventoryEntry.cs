using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents an item entry in an adventure's inventory.
/// Links items to adventures and tracks quantity for stackable items.
/// </summary>
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

    private InventoryEntry() { } // EF Core constructor

    /// <summary>
    /// Factory method for creating a new inventory entry.
    /// </summary>
    public static InventoryEntry Create(
        Guid adventureId,
        Guid itemId,
        int quantity = 1,
        int? slotPosition = null)
    {
        if (quantity < 1)
            throw new ArgumentException("Quantity must be at least 1", nameof(quantity));

        return new InventoryEntry
        {
            Id = Guid.NewGuid(),
            AdventureId = adventureId,
            ItemId = itemId,
            Quantity = quantity,
            SlotPosition = slotPosition,
            AddedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Adds quantity to this entry, respecting the maximum stack size.
    /// </summary>
    public void AddQuantity(int amount, int maxStackSize = 100)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive", nameof(amount));

        Quantity = Math.Min(Quantity + amount, maxStackSize);
    }

    /// <summary>
    /// Removes quantity from this entry.
    /// </summary>
    public void RemoveQuantity(int amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive", nameof(amount));

        if (amount > Quantity)
            throw new InvalidOperationException("Cannot remove more than current quantity");

        Quantity -= amount;
    }

    /// <summary>
    /// Returns true if the quantity is zero (entry should be deleted).
    /// </summary>
    public bool IsEmpty() => Quantity <= 0;
}
