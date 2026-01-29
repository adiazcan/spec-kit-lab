using System;
using System.Collections.Generic;

namespace DiceEngine.API.Models;

/// <summary>
/// Response for listing loot tables.
/// </summary>
public class LootTableListResponse
{
    public List<LootTableSummaryDto> LootTables { get; set; } = new();
    public int TotalCount { get; set; }
    public int Limit { get; set; }
    public int Offset { get; set; }
}

/// <summary>
/// Summary DTO for loot table (list view).
/// </summary>
public class LootTableSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EntryCount { get; set; }
}
