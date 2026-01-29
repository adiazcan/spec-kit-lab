using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for item data access using EF Core.
/// </summary>
public class ItemRepository : IItemRepository
{
    private readonly DiceEngineDbContext _context;

    public ItemRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Item?> GetItemByIdAsync(Guid itemId)
    {
        return await _context.Items.FindAsync(itemId);
    }

    public async Task<(IEnumerable<Item> Items, int TotalCount)> GetItemsAsync(
        string? itemType, ItemRarity? rarity, int limit, int offset)
    {
        IQueryable<Item> query = _context.Items;

        // Filter by item type
        if (!string.IsNullOrEmpty(itemType))
        {
            query = itemType.ToLowerInvariant() switch
            {
                "stackable" => _context.StackableItems,
                "unique" => _context.UniqueItems,
                _ => query
            };
        }

        // Filter by rarity
        if (rarity.HasValue)
        {
            query = query.Where(i => i.Rarity == rarity.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(i => i.Name)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task AddStackableItemAsync(StackableItem item)
    {
        await _context.StackableItems.AddAsync(item);
    }

    public async Task AddUniqueItemAsync(UniqueItem item)
    {
        await _context.UniqueItems.AddAsync(item);
    }

    public void RemoveItem(Item item)
    {
        _context.Items.Remove(item);
    }

    public async Task<int> SaveAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
