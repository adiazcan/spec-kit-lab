using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents a character's equipment slot.
/// Each character has 7 slots (Head, Chest, Hands, Legs, Feet, MainHand, OffHand).
/// </summary>
public class EquipmentSlot
{
    public Guid Id { get; private set; }
    public Guid CharacterId { get; private set; }
    public Character Character { get; private set; } = null!;
    public SlotType SlotType { get; private set; }
    public Guid? EquippedItemId { get; private set; }
    public UniqueItem? EquippedItem { get; private set; }
    public DateTime? EquippedAt { get; private set; }

    private EquipmentSlot() { } // EF Core constructor

    /// <summary>
    /// Creates an empty equipment slot for a character.
    /// </summary>
    public static EquipmentSlot CreateEmpty(Guid characterId, SlotType slotType)
    {
        return new EquipmentSlot
        {
            Id = Guid.NewGuid(),
            CharacterId = characterId,
            SlotType = slotType,
            EquippedItemId = null,
            EquippedAt = null
        };
    }

    /// <summary>
    /// Equips an item to this slot.
    /// </summary>
    /// <returns>True if equip was successful, false if validation failed.</returns>
    public bool Equip(UniqueItem item, out string? errorMessage)
    {
        if (!item.IsEquippable())
        {
            errorMessage = "Item is not equippable";
            return false;
        }

        if (item.SlotType != SlotType)
        {
            errorMessage = $"Item cannot be equipped to {SlotType} slot (item requires {item.SlotType})";
            return false;
        }

        EquippedItemId = item.Id;
        EquippedItem = item;
        EquippedAt = DateTime.UtcNow;
        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Unequips the item from this slot.
    /// </summary>
    /// <returns>The previously equipped item, or null if slot was empty.</returns>
    public UniqueItem? Unequip()
    {
        var previousItem = EquippedItem;
        EquippedItemId = null;
        EquippedItem = null;
        EquippedAt = null;
        return previousItem;
    }

    /// <summary>
    /// Returns true if no item is equipped in this slot.
    /// </summary>
    public bool IsEmpty() => EquippedItemId == null;
}
