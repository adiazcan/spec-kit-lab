using System;

namespace DiceEngine.API.Models;

/// <summary>
/// Response after unequipping an item.
/// </summary>
public class UnequipItemResponse
{
    public string SlotType { get; set; } = string.Empty;
    public UniqueItemDto? UnequippedItem { get; set; }
    public bool ReturnedToInventory { get; set; }
}
