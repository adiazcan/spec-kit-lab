using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Repository interface for loot table data access operations.
/// </summary>
public interface ILootRepository
{
    Task<LootTable?> GetLootTableByIdAsync(Guid lootTableId);
    Task<LootTable?> GetLootTableWithEntriesAsync(Guid lootTableId);
    Task<(IEnumerable<LootTable> LootTables, int TotalCount)> GetLootTablesAsync(int limit, int offset);
    Task<bool> AdventureExistsAsync(Guid adventureId);
    Task AddLootTableAsync(LootTable lootTable);
    void RemoveLootTable(LootTable lootTable);
    Task<int> SaveAsync();
}
