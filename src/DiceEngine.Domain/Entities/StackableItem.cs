using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents stackable items like potions, arrows, and gold.
/// Multiple identical stackable items merge into a single stack with quantity.
/// </summary>
public class StackableItem : Item
{
    public int MaxStackSize { get; private set; } = 100;

    private StackableItem() { } // EF Core constructor

    /// <summary>
    /// Factory method for creating a new stackable item.
    /// </summary>
    public static StackableItem Create(
        string name,
        string? description,
        ItemRarity rarity,
        int maxStackSize = 100)
    {
        return Create(Guid.NewGuid(), name, description, rarity, maxStackSize);
    }

    /// <summary>
    /// Factory method for creating a stackable item with a specific ID (for seeding).
    /// </summary>
    public static StackableItem Create(
        Guid id,
        string name,
        string? description,
        ItemRarity rarity,
        int maxStackSize = 100)
    {
        ValidateName(name);
        ValidateDescription(description);

        if (maxStackSize <= 0)
            throw new ArgumentException("MaxStackSize must be positive", nameof(maxStackSize));

        return new StackableItem
        {
            Id = id,
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Rarity = rarity,
            MaxStackSize = maxStackSize
        };
    }

    /// <summary>
    /// Determines if this item can stack with another item.
    /// </summary>
    public bool CanStackWith(StackableItem other)
    {
        return Id == other.Id; // Same item type = same ID
    }
}
