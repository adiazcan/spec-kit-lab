using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for loot table data access using EF Core.
/// </summary>
public class LootRepository : ILootRepository
{
    private readonly DiceEngineDbContext _context;

    public LootRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<LootTable?> GetLootTableByIdAsync(Guid lootTableId)
    {
        return await _context.LootTables.FindAsync(lootTableId);
    }

    public async Task<LootTable?> GetLootTableWithEntriesAsync(Guid lootTableId)
    {
        return await _context.LootTables
            .Include(t => t.Entries)
            .ThenInclude(e => e.Item)
            .FirstOrDefaultAsync(t => t.Id == lootTableId);
    }

    public async Task<(IEnumerable<LootTable> LootTables, int TotalCount)> GetLootTablesAsync(int limit, int offset)
    {
        var query = _context.LootTables
            .Include(t => t.Entries)
            .OrderBy(t => t.Name);

        var totalCount = await query.CountAsync();

        var lootTables = await query
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return (lootTables, totalCount);
    }

    public async Task<bool> AdventureExistsAsync(Guid adventureId)
    {
        return await _context.Adventures.AnyAsync(a => a.Id == adventureId);
    }

    public async Task AddLootTableAsync(LootTable lootTable)
    {
        await _context.LootTables.AddAsync(lootTable);
    }

    public void RemoveLootTable(LootTable lootTable)
    {
        _context.LootTables.Remove(lootTable);
    }

    public async Task<int> SaveAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
