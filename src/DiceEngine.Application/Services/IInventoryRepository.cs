using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Repository interface for inventory data access operations.
/// </summary>
public interface IInventoryRepository
{
    Task<InventoryEntry?> GetEntryByIdAsync(Guid entryId);
    Task<InventoryEntry?> GetEntryByIdWithItemAsync(Guid entryId);
    Task<InventoryEntry?> GetEntryByAdventureAndItemAsync(Guid adventureId, Guid itemId);
    Task<(IEnumerable<InventoryEntry> Entries, int TotalCount)> GetEntriesByAdventureAsync(Guid adventureId, int limit, int offset);
    Task<int> GetEntryCountAsync(Guid adventureId);
    Task AddEntryAsync(InventoryEntry entry);
    void RemoveEntry(InventoryEntry entry);

    Task<Item?> GetItemByIdAsync(Guid itemId);
    Task<bool> AdventureExistsAsync(Guid adventureId);
    Task<int> SaveAsync();
}
