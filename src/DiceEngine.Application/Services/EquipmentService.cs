using System;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for managing character equipment.
/// </summary>
public class EquipmentService : IEquipmentService
{
    private readonly IEquipmentRepository _repository;
    private readonly IInventoryService _inventoryService;

    public EquipmentService(IEquipmentRepository repository, IInventoryService inventoryService)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
    }

    /// <summary>
    /// Equips an item from inventory to a character slot.
    /// </summary>
    public async Task<Result<EquipItemResult>> EquipItemAsync(
        Guid characterId, string slotType, Guid itemId, Guid adventureId)
    {
        // Validate slot type
        if (!Enum.TryParse<SlotType>(slotType, true, out var slot))
            return Result<EquipItemResult>.Failure($"Invalid slot type: {slotType}");

        // Validate character exists
        var characterExists = await _repository.CharacterExistsAsync(characterId);
        if (!characterExists)
            return Result<EquipItemResult>.Failure("Character not found");

        // Validate item exists in inventory
        var inventoryEntry = await _repository.GetInventoryEntryWithItemAsync(adventureId, itemId);

        if (inventoryEntry == null)
            return Result<EquipItemResult>.Failure("Item not found in adventure inventory");

        // Validate item is unique and equippable
        if (inventoryEntry.Item is not UniqueItem uniqueItem)
            return Result<EquipItemResult>.Failure("Only unique items can be equipped");

        if (!uniqueItem.IsEquippable())
            return Result<EquipItemResult>.Failure("Item is not equippable");

        if (uniqueItem.SlotType != slot)
            return Result<EquipItemResult>.Failure(
                $"Item cannot be equipped to {slotType} slot (item requires {uniqueItem.SlotType})");

        // Get or create equipment slot
        var equipmentSlot = await _repository.GetSlotWithItemAsync(characterId, slot);

        if (equipmentSlot == null)
        {
            equipmentSlot = EquipmentSlot.CreateEmpty(characterId, slot);
            await _repository.AddSlotAsync(equipmentSlot);
        }

        // Handle previous item
        UniqueItemResult? previousItemResult = null;
        if (!equipmentSlot.IsEmpty() && equipmentSlot.EquippedItem != null)
        {
            var previousItem = equipmentSlot.EquippedItem;
            previousItemResult = MapToUniqueItemResult(previousItem);

            // Return previous item to inventory
            equipmentSlot.Unequip();
            await _inventoryService.AddItemAsync(adventureId, previousItem.Id, 1);
        }

        // Equip new item
        if (!equipmentSlot.Equip(uniqueItem, out var errorMessage))
            return Result<EquipItemResult>.Failure(errorMessage!);

        // Remove item from inventory
        _repository.RemoveInventoryEntry(inventoryEntry);

        await _repository.SaveAsync();

        return Result<EquipItemResult>.Success(new EquipItemResult
        {
            SlotType = slotType,
            EquippedItem = MapToUniqueItemResult(uniqueItem),
            EquippedAt = equipmentSlot.EquippedAt!.Value,
            PreviousItem = previousItemResult
        });
    }

    /// <summary>
    /// Unequips an item from a character slot and returns it to inventory.
    /// </summary>
    public async Task<Result<UnequipItemResult>> UnequipItemAsync(
        Guid characterId, string slotType, Guid adventureId)
    {
        // Validate slot type
        if (!Enum.TryParse<SlotType>(slotType, true, out var slot))
            return Result<UnequipItemResult>.Failure($"Invalid slot type: {slotType}");

        // Get equipment slot
        var equipmentSlot = await _repository.GetSlotWithItemAsync(characterId, slot);

        if (equipmentSlot == null || equipmentSlot.IsEmpty())
            return Result<UnequipItemResult>.Success(new UnequipItemResult
            {
                SlotType = slotType,
                UnequippedItem = null,
                ReturnedToInventory = false
            });

        var unequippedItem = equipmentSlot.EquippedItem!;
        var itemResult = MapToUniqueItemResult(unequippedItem);

        equipmentSlot.Unequip();

        // Return to inventory
        var addResult = await _inventoryService.AddItemAsync(adventureId, unequippedItem.Id, 1);
        var returnedToInventory = addResult.IsSuccess;

        await _repository.SaveAsync();

        return Result<UnequipItemResult>.Success(new UnequipItemResult
        {
            SlotType = slotType,
            UnequippedItem = itemResult,
            ReturnedToInventory = returnedToInventory
        });
    }

    /// <summary>
    /// Gets all equipment slots for a character with total modifiers.
    /// </summary>
    public async Task<Result<EquipmentResult>> GetEquipmentAsync(Guid characterId)
    {
        // Validate character exists
        var characterExists = await _repository.CharacterExistsAsync(characterId);
        if (!characterExists)
            return Result<EquipmentResult>.Failure("Character not found");

        // Get all equipment slots
        var slots = (await _repository.GetSlotsWithItemsAsync(characterId)).ToList();

        // Ensure all 7 slots exist
        var allSlotTypes = Enum.GetValues<SlotType>();
        var existingSlotTypes = slots.Select(s => s.SlotType).ToHashSet();
        
        foreach (var slotType in allSlotTypes)
        {
            if (!existingSlotTypes.Contains(slotType))
            {
                var newSlot = EquipmentSlot.CreateEmpty(characterId, slotType);
                await _repository.AddSlotAsync(newSlot);
                slots.Add(newSlot);
            }
        }

        await _repository.SaveAsync();

        // Calculate total modifiers
        var totalModifiers = new System.Collections.Generic.Dictionary<string, int>();
        foreach (var slot in slots.Where(s => s.EquippedItem != null))
        {
            foreach (var modifier in slot.EquippedItem!.Modifiers)
            {
                if (!totalModifiers.ContainsKey(modifier.StatName))
                    totalModifiers[modifier.StatName] = 0;
                totalModifiers[modifier.StatName] += modifier.Value;
            }
        }

        return Result<EquipmentResult>.Success(new EquipmentResult
        {
            CharacterId = characterId,
            Slots = slots.OrderBy(s => s.SlotType).Select(s => new EquipmentSlotResult
            {
                SlotType = s.SlotType.ToString(),
                EquippedItem = s.EquippedItem != null ? MapToUniqueItemResult(s.EquippedItem) : null,
                EquippedAt = s.EquippedAt
            }).ToList(),
            TotalModifiers = totalModifiers
        });
    }

    /// <summary>
    /// Initializes all 7 equipment slots for a new character.
    /// </summary>
    public async Task<Result> InitializeEquipmentSlotsAsync(Guid characterId)
    {
        var characterExists = await _repository.CharacterExistsAsync(characterId);
        if (!characterExists)
            return Result.Failure("Character not found");

        // Check if slots already exist
        var existingSlots = await _repository.GetSlotsCountAsync(characterId);

        if (existingSlots > 0)
            return Result.Success(); // Already initialized

        // Create all 7 slots
        var slots = Enum.GetValues<SlotType>()
            .Select(slotType => EquipmentSlot.CreateEmpty(characterId, slotType))
            .ToList();

        await _repository.AddSlotsAsync(slots);
        await _repository.SaveAsync();
        return Result.Success();
    }

    private static UniqueItemResult MapToUniqueItemResult(UniqueItem item)
    {
        return new UniqueItemResult
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
        };
    }
}
