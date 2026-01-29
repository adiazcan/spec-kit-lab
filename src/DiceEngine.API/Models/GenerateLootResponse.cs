using System;
using System.Collections.Generic;

namespace DiceEngine.API.Models;

/// <summary>
/// Response after generating loot.
/// </summary>
public class GenerateLootResponse
{
    public Guid LootTableId { get; set; }
    public Guid AdventureId { get; set; }
    public List<GeneratedItemDto> GeneratedItems { get; set; } = new();
    public bool AddedToInventory { get; set; }
}

/// <summary>
/// DTO for a generated item with roll details.
/// </summary>
public class GeneratedItemDto
{
    public ItemDto Item { get; set; } = null!;
    public int Quantity { get; set; }
    public int RollResult { get; set; }
    public int Weight { get; set; }
}
