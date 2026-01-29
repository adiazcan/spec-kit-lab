using System;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for managing adventure inventory operations.
/// </summary>
public class InventoryService : IInventoryService
{
    private readonly IInventoryRepository _repository;
    private const int MaxInventoryEntries = 100;

    public InventoryService(IInventoryRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    /// <summary>
    /// Adds an item to the adventure's inventory.
    /// Stackable items will merge with existing stacks.
    /// </summary>
    public async Task<Result<AddItemResult>> AddItemAsync(Guid adventureId, Guid itemId, int quantity)
    {
        // Validate adventure exists
        var adventureExists = await _repository.AdventureExistsAsync(adventureId);
        if (!adventureExists)
            return Result<AddItemResult>.Failure("Adventure not found");

        // Validate item exists
        var item = await _repository.GetItemByIdAsync(itemId);
        if (item == null)
            return Result<AddItemResult>.Failure("Item not found");

        if (quantity < 1)
            return Result<AddItemResult>.Failure("Quantity must be at least 1");

        // Check inventory capacity
        var currentEntryCount = await _repository.GetEntryCountAsync(adventureId);

        // Handle stackable items
        if (item is StackableItem stackable)
        {
            // Try to find existing stack
            var existingEntry = await _repository.GetEntryByAdventureAndItemAsync(adventureId, itemId);

            if (existingEntry != null)
            {
                // Merge with existing stack
                existingEntry.AddQuantity(quantity, stackable.MaxStackSize);
                await _repository.SaveAsync();

                return Result<AddItemResult>.Success(new AddItemResult
                {
                    EntryId = existingEntry.Id,
                    ItemId = itemId,
                    Quantity = existingEntry.Quantity,
                    Merged = true
                });
            }
        }

        // Check capacity for new entry
        if (currentEntryCount >= MaxInventoryEntries)
            return Result<AddItemResult>.Failure("Inventory full: maximum 100 unique items reached");

        // For unique items, quantity is always 1
        var finalQuantity = item is UniqueItem ? 1 : quantity;

        // Create new entry
        var newEntry = InventoryEntry.Create(adventureId, itemId, finalQuantity);
        await _repository.AddEntryAsync(newEntry);
        await _repository.SaveAsync();

        return Result<AddItemResult>.Success(new AddItemResult
        {
            EntryId = newEntry.Id,
            ItemId = itemId,
            Quantity = finalQuantity,
            Merged = false
        });
    }

    /// <summary>
    /// Gets the inventory contents for an adventure.
    /// </summary>
    public async Task<InventoryResult> GetInventoryAsync(Guid adventureId, int limit, int offset)
    {
        var (entries, totalEntries) = await _repository.GetEntriesByAdventureAsync(adventureId, limit, offset);

        return new InventoryResult
        {
            AdventureId = adventureId,
            TotalEntries = totalEntries,
            Entries = entries.Select(e => new InventoryEntryResult
            {
                Id = e.Id,
                Quantity = e.Quantity,
                AddedAt = e.AddedAt,
                Item = MapToItemResult(e.Item)
            }).ToList()
        };
    }

    /// <summary>
    /// Removes quantity from an inventory entry.
    /// Entry is deleted when quantity reaches zero.
    /// </summary>
    public async Task<Result> RemoveItemAsync(Guid adventureId, Guid entryId, int quantity)
    {
        var entry = await _repository.GetEntryByIdWithItemAsync(entryId);

        if (entry == null || entry.AdventureId != adventureId)
            return Result.Failure("Inventory entry not found");

        if (quantity < 1)
            return Result.Failure("Quantity must be at least 1");

        // For unique items, always remove the entire entry
        if (entry.Item is UniqueItem)
        {
            _repository.RemoveEntry(entry);
            await _repository.SaveAsync();
            return Result.Success();
        }

        // For stackable items, decrement quantity
        if (quantity >= entry.Quantity)
        {
            _repository.RemoveEntry(entry);
        }
        else
        {
            entry.RemoveQuantity(quantity);
        }

        await _repository.SaveAsync();
        return Result.Success();
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
