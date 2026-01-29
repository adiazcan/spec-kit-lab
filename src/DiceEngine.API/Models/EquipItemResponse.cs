using System;

namespace DiceEngine.API.Models;

/// <summary>
/// Response after equipping an item.
/// </summary>
public class EquipItemResponse
{
    public string SlotType { get; set; } = string.Empty;
    public UniqueItemDto EquippedItem { get; set; } = null!;
    public DateTime EquippedAt { get; set; }
    public UniqueItemDto? PreviousItem { get; set; }
}
