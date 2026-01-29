using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Interface for equipment management operations.
/// </summary>
public interface IEquipmentService
{
    Task<Result<EquipItemResult>> EquipItemAsync(Guid characterId, string slotType, Guid itemId, Guid adventureId);
    Task<Result<UnequipItemResult>> UnequipItemAsync(Guid characterId, string slotType, Guid adventureId);
    Task<Result<EquipmentResult>> GetEquipmentAsync(Guid characterId);
    Task<Result> InitializeEquipmentSlotsAsync(Guid characterId);
}

/// <summary>
/// Result of equipping an item.
/// </summary>
public class EquipItemResult
{
    public string SlotType { get; set; } = string.Empty;
    public UniqueItemResult EquippedItem { get; set; } = null!;
    public DateTime EquippedAt { get; set; }
    public UniqueItemResult? PreviousItem { get; set; }
}

/// <summary>
/// Result of unequipping an item.
/// </summary>
public class UnequipItemResult
{
    public string SlotType { get; set; } = string.Empty;
    public UniqueItemResult? UnequippedItem { get; set; }
    public bool ReturnedToInventory { get; set; }
}

/// <summary>
/// Result of retrieving equipment.
/// </summary>
public class EquipmentResult
{
    public Guid CharacterId { get; set; }
    public List<EquipmentSlotResult> Slots { get; set; } = new();
    public Dictionary<string, int> TotalModifiers { get; set; } = new();
}

/// <summary>
/// A single equipment slot result.
/// </summary>
public class EquipmentSlotResult
{
    public string SlotType { get; set; } = string.Empty;
    public UniqueItemResult? EquippedItem { get; set; }
    public DateTime? EquippedAt { get; set; }
}
