using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for generating loot from weighted loot tables.
/// </summary>
public class LootGeneratorService : ILootGeneratorService
{
    private readonly ILootRepository _repository;
    private readonly IDiceService _diceService;
    private readonly IInventoryService _inventoryService;

    public LootGeneratorService(
        ILootRepository repository,
        IDiceService diceService,
        IInventoryService inventoryService)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
        _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
    }

    /// <summary>
    /// Generates items from a loot table using weighted random selection.
    /// </summary>
    public async Task<Result<GenerateLootResult>> GenerateAsync(Guid lootTableId, Guid adventureId, int count)
    {
        // Validate loot table exists
        var lootTable = await _repository.GetLootTableWithEntriesAsync(lootTableId);

        if (lootTable == null)
            return Result<GenerateLootResult>.Failure("Loot table not found");

        if (!lootTable.Entries.Any())
            return Result<GenerateLootResult>.Failure("Loot table has no entries");

        // Validate adventure exists
        var adventureExists = await _repository.AdventureExistsAsync(adventureId);
        if (!adventureExists)
            return Result<GenerateLootResult>.Failure("Adventure not found");

        var totalWeight = lootTable.GetTotalWeight();
        if (totalWeight <= 0)
            return Result<GenerateLootResult>.Failure("Loot table has no valid weights");

        var generatedItems = new List<GeneratedItem>();
        var allAddedSuccessfully = true;

        for (int i = 0; i < count; i++)
        {
            // Roll dice for weighted selection
            var rollResult = _diceService.Roll($"1d{totalWeight}");
            var roll = rollResult.FinalTotal;

            // Find entry based on cumulative weight
            var entry = SelectEntryByWeight(lootTable.Entries.ToList(), roll);
            if (entry == null)
                continue;

            generatedItems.Add(new GeneratedItem
            {
                Item = MapToItemResult(entry.Item),
                Quantity = entry.Quantity,
                RollResult = roll,
                Weight = entry.Weight
            });

            // Add to inventory
            var addResult = await _inventoryService.AddItemAsync(adventureId, entry.ItemId, entry.Quantity);
            if (addResult.IsFailure)
                allAddedSuccessfully = false;
        }

        return Result<GenerateLootResult>.Success(new GenerateLootResult
        {
            LootTableId = lootTableId,
            AdventureId = adventureId,
            GeneratedItems = generatedItems,
            AddedToInventory = allAddedSuccessfully
        });
    }

    /// <summary>
    /// Gets a paginated list of loot tables.
    /// </summary>
    public async Task<LootTableListResult> GetLootTablesAsync(int limit, int offset)
    {
        var (lootTables, totalCount) = await _repository.GetLootTablesAsync(limit, offset);

        return new LootTableListResult
        {
            TotalCount = totalCount,
            LootTables = lootTables.Select(t => new LootTableSummary
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                EntryCount = t.Entries.Count
            }).ToList()
        };
    }

    /// <summary>
    /// Gets detailed information about a loot table.
    /// </summary>
    public async Task<Result<LootTableDetailsResult>> GetLootTableAsync(Guid lootTableId)
    {
        var lootTable = await _repository.GetLootTableWithEntriesAsync(lootTableId);

        if (lootTable == null)
            return Result<LootTableDetailsResult>.Failure("Loot table not found");

        return Result<LootTableDetailsResult>.Success(new LootTableDetailsResult
        {
            Id = lootTable.Id,
            Name = lootTable.Name,
            Description = lootTable.Description,
            TotalWeight = lootTable.GetTotalWeight(),
            Entries = lootTable.Entries.Select(e => new LootTableEntryResult
            {
                Id = e.Id,
                Item = MapToItemResult(e.Item),
                Weight = e.Weight,
                Quantity = e.Quantity
            }).ToList()
        });
    }

    private static LootTableEntry? SelectEntryByWeight(List<LootTableEntry> entries, int roll)
    {
        int cumulative = 0;
        foreach (var entry in entries)
        {
            cumulative += entry.Weight;
            if (roll <= cumulative)
                return entry;
        }
        return entries.LastOrDefault();
    }

    private static ItemResult MapToItemResult(Item item)
    {
        return item switch
        {
            StackableItem stackable => new StackableItemResult
            {
                Id = stackable.Id,
                Name = stackable.Name,
                Description = stackable.Description,
                Rarity = stackable.Rarity.ToString(),
                MaxStackSize = stackable.MaxStackSize
            },
            UniqueItem unique => new UniqueItemResult
            {
                Id = unique.Id,
                Name = unique.Name,
                Description = unique.Description,
                Rarity = unique.Rarity.ToString(),
                SlotType = unique.SlotType?.ToString(),
                Modifiers = unique.Modifiers.Select(m => new StatModifierResult
                {
                    StatName = m.StatName,
                    Value = m.Value
                }).ToList()
            },
            _ => throw new InvalidOperationException($"Unknown item type: {item.GetType().Name}")
        };
    }
}
