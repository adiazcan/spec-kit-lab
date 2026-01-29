using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Repository interface for equipment data access operations.
/// </summary>
public interface IEquipmentRepository
{
    Task<EquipmentSlot?> GetSlotAsync(Guid characterId, SlotType slotType);
    Task<EquipmentSlot?> GetSlotWithItemAsync(Guid characterId, SlotType slotType);
    Task<IEnumerable<EquipmentSlot>> GetSlotsAsync(Guid characterId);
    Task<IEnumerable<EquipmentSlot>> GetSlotsWithItemsAsync(Guid characterId);
    Task AddSlotAsync(EquipmentSlot slot);
    Task AddSlotsAsync(IEnumerable<EquipmentSlot> slots);
    Task<int> GetSlotsCountAsync(Guid characterId);

    Task<UniqueItem?> GetUniqueItemByIdAsync(Guid itemId);
    Task<bool> CharacterExistsAsync(Guid characterId);
    Task<InventoryEntry?> GetInventoryEntryWithItemAsync(Guid adventureId, Guid itemId);
    void RemoveInventoryEntry(InventoryEntry entry);
    Task<int> SaveAsync();
}
