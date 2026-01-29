using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for equipment data access using EF Core.
/// </summary>
public class EquipmentRepository : IEquipmentRepository
{
    private readonly DiceEngineDbContext _context;

    public EquipmentRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<EquipmentSlot?> GetSlotAsync(Guid characterId, SlotType slotType)
    {
        return await _context.EquipmentSlots
            .FirstOrDefaultAsync(s => s.CharacterId == characterId && s.SlotType == slotType);
    }

    public async Task<EquipmentSlot?> GetSlotWithItemAsync(Guid characterId, SlotType slotType)
    {
        return await _context.EquipmentSlots
            .Include(s => s.EquippedItem)
            .FirstOrDefaultAsync(s => s.CharacterId == characterId && s.SlotType == slotType);
    }

    public async Task<IEnumerable<EquipmentSlot>> GetSlotsAsync(Guid characterId)
    {
        return await _context.EquipmentSlots
            .Where(s => s.CharacterId == characterId)
            .ToListAsync();
    }

    public async Task<IEnumerable<EquipmentSlot>> GetSlotsWithItemsAsync(Guid characterId)
    {
        return await _context.EquipmentSlots
            .Include(s => s.EquippedItem)
            .Where(s => s.CharacterId == characterId)
            .ToListAsync();
    }

    public async Task AddSlotAsync(EquipmentSlot slot)
    {
        await _context.EquipmentSlots.AddAsync(slot);
    }

    public async Task AddSlotsAsync(IEnumerable<EquipmentSlot> slots)
    {
        await _context.EquipmentSlots.AddRangeAsync(slots);
    }

    public async Task<int> GetSlotsCountAsync(Guid characterId)
    {
        return await _context.EquipmentSlots
            .CountAsync(s => s.CharacterId == characterId);
    }

    public async Task<UniqueItem?> GetUniqueItemByIdAsync(Guid itemId)
    {
        return await _context.UniqueItems.FindAsync(itemId);
    }

    public async Task<bool> CharacterExistsAsync(Guid characterId)
    {
        return await _context.Characters.AnyAsync(c => c.Id == characterId);
    }

    public async Task<InventoryEntry?> GetInventoryEntryWithItemAsync(Guid adventureId, Guid itemId)
    {
        return await _context.InventoryEntries
            .Include(e => e.Item)
            .FirstOrDefaultAsync(e => e.AdventureId == adventureId && e.ItemId == itemId);
    }

    public void RemoveInventoryEntry(InventoryEntry entry)
    {
        _context.InventoryEntries.Remove(entry);
    }

    public async Task<int> SaveAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
