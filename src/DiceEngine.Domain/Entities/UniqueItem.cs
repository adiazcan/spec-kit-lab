using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Equipment slot types for unique items.
/// </summary>
public enum SlotType
{
    Head,
    Chest,
    Hands,
    Legs,
    Feet,
    MainHand,
    OffHand,
    Accessory
}

/// <summary>
/// Represents unique equipment items like weapons and armor.
/// Each instance is stored separately with its own identity.
/// </summary>
public class UniqueItem : Item
{
    public SlotType? SlotType { get; private set; }
    public List<StatModifier> Modifiers { get; private set; } = new();

    private UniqueItem() { } // EF Core constructor

    /// <summary>
    /// Factory method for creating a new unique item.
    /// </summary>
    public static UniqueItem Create(
        string name,
        string? description,
        ItemRarity rarity,
        SlotType? slotType,
        List<StatModifier>? modifiers = null)
    {
        return Create(Guid.NewGuid(), name, description, rarity, slotType, modifiers);
    }

    /// <summary>
    /// Factory method for creating a unique item with a specific ID (for seeding).
    /// </summary>
    public static UniqueItem Create(
        Guid id,
        string name,
        string? description,
        ItemRarity rarity,
        SlotType? slotType,
        List<StatModifier>? modifiers = null)
    {
        ValidateName(name);
        ValidateDescription(description);

        return new UniqueItem
        {
            Id = id,
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Rarity = rarity,
            SlotType = slotType,
            Modifiers = modifiers ?? new List<StatModifier>()
        };
    }

    /// <summary>
    /// Returns true if this item can be equipped.
    /// </summary>
    public bool IsEquippable() => SlotType.HasValue;

    /// <summary>
    /// Gets the total modifier value for a specific stat.
    /// </summary>
    public int GetModifierForStat(string statName)
    {
        return Modifiers.Where(m => m.StatName == statName).Sum(m => m.Value);
    }
}
