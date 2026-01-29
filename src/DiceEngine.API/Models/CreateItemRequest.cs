using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DiceEngine.API.Models;

/// <summary>
/// Request to create a new stackable item.
/// </summary>
public class CreateStackableItemRequest
{
    [Required]
    public string ItemType { get; set; } = "Stackable";

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Rarity { get; set; } = "Common";

    [Range(1, int.MaxValue)]
    public int MaxStackSize { get; set; } = 100;
}

/// <summary>
/// Request to create a new unique item.
/// </summary>
public class CreateUniqueItemRequest
{
    [Required]
    public string ItemType { get; set; } = "Unique";

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Rarity { get; set; } = "Common";

    public string? SlotType { get; set; }

    public List<StatModifierDto> Modifiers { get; set; } = new();
}

/// <summary>
/// Response for listing items.
/// </summary>
public class ItemListResponse
{
    public List<ItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Limit { get; set; }
    public int Offset { get; set; }
}
