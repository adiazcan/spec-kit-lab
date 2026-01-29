using System;
using System.Collections.Generic;

namespace DiceEngine.API.Models;

/// <summary>
/// Response containing adventure inventory contents.
/// </summary>
public class InventoryResponse
{
    public Guid AdventureId { get; set; }
    public List<InventoryEntryDto> Entries { get; set; } = new();
    public int TotalEntries { get; set; }
    public int Limit { get; set; }
    public int Offset { get; set; }
}
