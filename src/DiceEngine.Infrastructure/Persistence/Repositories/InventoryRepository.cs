using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for inventory data access using EF Core.
/// </summary>
public class InventoryRepository : IInventoryRepository
{
    private readonly DiceEngineDbContext _context;

    public InventoryRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<InventoryEntry?> GetEntryByIdAsync(Guid entryId)
    {
        return await _context.InventoryEntries
            .FirstOrDefaultAsync(e => e.Id == entryId);
    }

    public async Task<InventoryEntry?> GetEntryByIdWithItemAsync(Guid entryId)
    {
        return await _context.InventoryEntries
            .Include(e => e.Item)
            .FirstOrDefaultAsync(e => e.Id == entryId);
    }

    public async Task<InventoryEntry?> GetEntryByAdventureAndItemAsync(Guid adventureId, Guid itemId)
    {
        return await _context.InventoryEntries
            .FirstOrDefaultAsync(e => e.AdventureId == adventureId && e.ItemId == itemId);
    }

    public async Task<(IEnumerable<InventoryEntry> Entries, int TotalCount)> GetEntriesByAdventureAsync(
        Guid adventureId, int limit, int offset)
    {
        var query = _context.InventoryEntries
            .Include(e => e.Item)
            .Where(e => e.AdventureId == adventureId)
            .OrderBy(e => e.AddedAt);

        var totalCount = await query.CountAsync();

        var entries = await query
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return (entries, totalCount);
    }

    public async Task<int> GetEntryCountAsync(Guid adventureId)
    {
        return await _context.InventoryEntries
            .CountAsync(e => e.AdventureId == adventureId);
    }

    public async Task AddEntryAsync(InventoryEntry entry)
    {
        await _context.InventoryEntries.AddAsync(entry);
    }

    public void RemoveEntry(InventoryEntry entry)
    {
        _context.InventoryEntries.Remove(entry);
    }

    public async Task<Item?> GetItemByIdAsync(Guid itemId)
    {
        return await _context.Items.FindAsync(itemId);
    }

    public async Task<bool> AdventureExistsAsync(Guid adventureId)
    {
        return await _context.Adventures.AnyAsync(a => a.Id == adventureId);
    }

    public async Task<int> SaveAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
