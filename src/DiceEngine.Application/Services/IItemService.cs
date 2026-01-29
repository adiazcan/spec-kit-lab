using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Interface for item catalog management (admin operations).
/// </summary>
public interface IItemService
{
    Task<Result<ItemResult>> CreateStackableItemAsync(
        string name, string description, string rarity, int maxStackSize);
    Task<Result<ItemResult>> CreateUniqueItemAsync(
        string name, string description, string rarity, string? slotType,
        List<StatModifierRequest>? modifiers);
    Task<ItemListResult> GetItemsAsync(string? itemType, string? rarity, int limit, int offset);
}

/// <summary>
/// Request for creating a stat modifier.
/// </summary>
public class StatModifierRequest
{
    public string StatName { get; set; } = string.Empty;
    public int Value { get; set; }
}

/// <summary>
/// Result of listing items.
/// </summary>
public class ItemListResult
{
    public List<ItemResult> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
