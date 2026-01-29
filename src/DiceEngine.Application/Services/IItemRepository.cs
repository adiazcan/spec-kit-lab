using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Repository interface for item data access operations.
/// </summary>
public interface IItemRepository
{
    Task<Item?> GetItemByIdAsync(Guid itemId);
    Task<(IEnumerable<Item> Items, int TotalCount)> GetItemsAsync(string? itemType, ItemRarity? rarity, int limit, int offset);
    Task AddStackableItemAsync(StackableItem item);
    Task AddUniqueItemAsync(UniqueItem item);
    void RemoveItem(Item item);
    Task<int> SaveAsync();
}
