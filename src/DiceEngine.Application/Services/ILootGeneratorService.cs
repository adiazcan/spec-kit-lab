using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Interface for loot generation operations.
/// </summary>
public interface ILootGeneratorService
{
    Task<Result<GenerateLootResult>> GenerateAsync(Guid lootTableId, Guid adventureId, int count);
    Task<LootTableListResult> GetLootTablesAsync(int limit, int offset);
    Task<Result<LootTableDetailsResult>> GetLootTableAsync(Guid lootTableId);
}

/// <summary>
/// Result of generating loot.
/// </summary>
public class GenerateLootResult
{
    public Guid LootTableId { get; set; }
    public Guid AdventureId { get; set; }
    public List<GeneratedItem> GeneratedItems { get; set; } = new();
    public bool AddedToInventory { get; set; }
}

/// <summary>
/// A single generated item with roll details.
/// </summary>
public class GeneratedItem
{
    public ItemResult Item { get; set; } = null!;
    public int Quantity { get; set; }
    public int RollResult { get; set; }
    public int Weight { get; set; }
}

/// <summary>
/// Result of listing loot tables.
/// </summary>
public class LootTableListResult
{
    public List<LootTableSummary> LootTables { get; set; } = new();
    public int TotalCount { get; set; }
}

/// <summary>
/// Summary of a loot table.
/// </summary>
public class LootTableSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EntryCount { get; set; }
}

/// <summary>
/// Detailed loot table result.
/// </summary>
public class LootTableDetailsResult
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<LootTableEntryResult> Entries { get; set; } = new();
    public int TotalWeight { get; set; }
}

/// <summary>
/// A single loot table entry.
/// </summary>
public class LootTableEntryResult
{
    public Guid Id { get; set; }
    public ItemResult Item { get; set; } = null!;
    public int Weight { get; set; }
    public int Quantity { get; set; }
}
