using System;
using System.Collections.Generic;

namespace DiceEngine.API.Models;

/// <summary>
/// DTO representing an inventory entry with item details.
/// </summary>
public class InventoryEntryDto
{
    public Guid Id { get; set; }
    public ItemDto Item { get; set; } = null!;
    public int Quantity { get; set; }
    public DateTime AddedAt { get; set; }
}

/// <summary>
/// Base item DTO with polymorphic type support.
/// </summary>
public abstract class ItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
}

/// <summary>
/// DTO for stackable item type.
/// </summary>
public class StackableItemDto : ItemDto
{
    public int MaxStackSize { get; set; }

    public StackableItemDto()
    {
        ItemType = "Stackable";
    }
}

/// <summary>
/// DTO for unique item type with equipment capabilities.
/// </summary>
public class UniqueItemDto : ItemDto
{
    public string? SlotType { get; set; }
    public List<StatModifierDto> Modifiers { get; set; } = new();

    public UniqueItemDto()
    {
        ItemType = "Unique";
    }
}

/// <summary>
/// DTO for stat modifier value object.
/// </summary>
public class StatModifierDto
{
    public string StatName { get; set; } = string.Empty;
    public int Value { get; set; }
}
