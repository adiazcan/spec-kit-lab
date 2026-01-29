using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Interface for inventory management operations.
/// </summary>
public interface IInventoryService
{
    Task<Result<AddItemResult>> AddItemAsync(Guid adventureId, Guid itemId, int quantity);
    Task<InventoryResult> GetInventoryAsync(Guid adventureId, int limit, int offset);
    Task<Result> RemoveItemAsync(Guid adventureId, Guid entryId, int quantity);
}

/// <summary>
/// Result of adding an item to inventory.
/// </summary>
public class AddItemResult
{
    public Guid EntryId { get; set; }
    public Guid ItemId { get; set; }
    public int Quantity { get; set; }
    public bool Merged { get; set; }
}

/// <summary>
/// Result of retrieving inventory contents.
/// </summary>
public class InventoryResult
{
    public Guid AdventureId { get; set; }
    public List<InventoryEntryResult> Entries { get; set; } = new();
    public int TotalEntries { get; set; }
}

/// <summary>
/// A single inventory entry result.
/// </summary>
public class InventoryEntryResult
{
    public Guid Id { get; set; }
    public ItemResult Item { get; set; } = null!;
    public int Quantity { get; set; }
    public DateTime AddedAt { get; set; }
}

/// <summary>
/// Generic item result (base class).
/// </summary>
public abstract class ItemResult
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
}

/// <summary>
/// Stackable item result.
/// </summary>
public class StackableItemResult : ItemResult
{
    public int MaxStackSize { get; set; }

    public StackableItemResult()
    {
        ItemType = "Stackable";
    }
}

/// <summary>
/// Unique item result.
/// </summary>
public class UniqueItemResult : ItemResult
{
    public string? SlotType { get; set; }
    public List<StatModifierResult> Modifiers { get; set; } = new();

    public UniqueItemResult()
    {
        ItemType = "Unique";
    }
}

/// <summary>
/// Stat modifier result.
/// </summary>
public class StatModifierResult
{
    public string StatName { get; set; } = string.Empty;
    public int Value { get; set; }
}
