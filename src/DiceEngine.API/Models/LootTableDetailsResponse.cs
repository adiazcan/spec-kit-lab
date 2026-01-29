using System;
using System.Collections.Generic;

namespace DiceEngine.API.Models;

/// <summary>
/// Detailed response for a single loot table.
/// </summary>
public class LootTableDetailsResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<LootTableEntryDto> Entries { get; set; } = new();
    public int TotalWeight { get; set; }
}

/// <summary>
/// DTO for a loot table entry.
/// </summary>
public class LootTableEntryDto
{
    public Guid Id { get; set; }
    public ItemDto Item { get; set; } = null!;
    public int Weight { get; set; }
    public int Quantity { get; set; }
}
