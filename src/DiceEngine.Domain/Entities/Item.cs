using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Item rarity levels for the inventory system.
/// </summary>
public enum ItemRarity
{
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
}

/// <summary>
/// Abstract base class for all items in the game.
/// Uses Table-per-Hierarchy (TPH) inheritance in EF Core.
/// </summary>
public abstract class Item
{
    public Guid Id { get; protected set; }
    public string Name { get; protected set; } = string.Empty;
    public string Description { get; protected set; } = string.Empty;
    public ItemRarity Rarity { get; protected set; }

    protected Item() { } // EF Core constructor

    protected static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required", nameof(name));
        if (name.Length > 100)
            throw new ArgumentException("Name cannot exceed 100 characters", nameof(name));
    }

    protected static void ValidateDescription(string? description)
    {
        if (description != null && description.Length > 500)
            throw new ArgumentException("Description cannot exceed 500 characters", nameof(description));
    }
}
