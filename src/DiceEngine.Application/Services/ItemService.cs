using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for managing item catalog (admin operations).
/// </summary>
public class ItemService : IItemService
{
    private readonly IItemRepository _repository;

    public ItemService(IItemRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    /// <summary>
    /// Creates a new stackable item.
    /// </summary>
    public async Task<Result<ItemResult>> CreateStackableItemAsync(
        string name, string description, string rarity, int maxStackSize)
    {
        if (!Enum.TryParse<ItemRarity>(rarity, true, out var itemRarity))
            return Result<ItemResult>.Failure($"Invalid rarity: {rarity}");

        try
        {
            var item = StackableItem.Create(name, description, itemRarity, maxStackSize);
            await _repository.AddStackableItemAsync(item);
            await _repository.SaveAsync();

            return Result<ItemResult>.Success(new StackableItemResult
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                Rarity = item.Rarity.ToString(),
                MaxStackSize = item.MaxStackSize
            });
        }
        catch (ArgumentException ex)
        {
            return Result<ItemResult>.Failure(ex.Message);
        }
    }

    /// <summary>
    /// Creates a new unique item.
    /// </summary>
    public async Task<Result<ItemResult>> CreateUniqueItemAsync(
        string name, string description, string rarity, string? slotType,
        List<StatModifierRequest>? modifiers)
    {
        if (!Enum.TryParse<ItemRarity>(rarity, true, out var itemRarity))
            return Result<ItemResult>.Failure($"Invalid rarity: {rarity}");

        SlotType? slot = null;
        if (!string.IsNullOrEmpty(slotType))
        {
            if (!Enum.TryParse<SlotType>(slotType, true, out var parsedSlot))
                return Result<ItemResult>.Failure($"Invalid slot type: {slotType}");
            slot = parsedSlot;
        }

        var statModifiers = modifiers?.Select(m => new StatModifier(m.StatName, m.Value)).ToList();

        try
        {
            var item = UniqueItem.Create(name, description, itemRarity, slot, statModifiers);
            await _repository.AddUniqueItemAsync(item);
            await _repository.SaveAsync();

            return Result<ItemResult>.Success(new UniqueItemResult
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                Rarity = item.Rarity.ToString(),
                SlotType = item.SlotType?.ToString(),
                Modifiers = item.Modifiers.Select(m => new StatModifierResult
                {
                    StatName = m.StatName,
                    Value = m.Value
                }).ToList()
            });
        }
        catch (ArgumentException ex)
        {
            return Result<ItemResult>.Failure(ex.Message);
        }
    }

    /// <summary>
    /// Gets a paginated list of items with optional filtering.
    /// </summary>
    public async Task<ItemListResult> GetItemsAsync(
        string? itemType, string? rarity, int limit, int offset)
    {
        ItemRarity? rarityFilter = null;
        if (!string.IsNullOrEmpty(rarity) && Enum.TryParse<ItemRarity>(rarity, true, out var parsedRarity))
        {
            rarityFilter = parsedRarity;
        }

        var (items, totalCount) = await _repository.GetItemsAsync(itemType, rarityFilter, limit, offset);

        return new ItemListResult
        {
            TotalCount = totalCount,
            Items = items.Select(MapToItemResult).ToList()
        };
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
