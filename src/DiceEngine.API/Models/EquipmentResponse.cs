using System;
using System.Collections.Generic;

namespace DiceEngine.API.Models;

/// <summary>
/// Response containing character equipment status.
/// </summary>
public class EquipmentResponse
{
    public Guid CharacterId { get; set; }
    public List<EquipmentSlotDto> Slots { get; set; } = new();
    public Dictionary<string, int> TotalModifiers { get; set; } = new();
}

/// <summary>
/// DTO for equipment slot information.
/// </summary>
public class EquipmentSlotDto
{
    public string SlotType { get; set; } = string.Empty;
    public UniqueItemDto? EquippedItem { get; set; }
    public DateTime? EquippedAt { get; set; }
}
