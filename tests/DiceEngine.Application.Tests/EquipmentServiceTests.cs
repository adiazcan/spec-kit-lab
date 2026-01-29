using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;
using Moq;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Tests for EquipmentService.
/// T083: Test stat modifier calculation with multiple equipped items.
/// T084: Verify stat modifiers are removed when items unequipped.
/// </summary>
public class EquipmentServiceTests
{
    private readonly Mock<IEquipmentRepository> _mockRepository;
    private readonly Mock<IInventoryService> _mockInventoryService;
    private readonly EquipmentService _service;
    private readonly Guid _characterId = Guid.NewGuid();
    private readonly Guid _adventureId = Guid.NewGuid();

    public EquipmentServiceTests()
    {
        _mockRepository = new Mock<IEquipmentRepository>();
        _mockInventoryService = new Mock<IInventoryService>();
        _service = new EquipmentService(_mockRepository.Object, _mockInventoryService.Object);

        // Default setup: character exists
        _mockRepository.Setup(r => r.CharacterExistsAsync(_characterId))
            .ReturnsAsync(true);
    }

    // T083: Test stat modifier calculation with multiple equipped items

    [Fact]
    public async Task GetEquipmentAsync_MultipleEquippedItems_CalculatesTotalModifiers()
    {
        // Arrange - Create multiple equipped items with stat modifiers
        var helmet = UniqueItem.Create(
            Guid.NewGuid(),
            "Iron Helmet",
            "Protective headgear",
            ItemRarity.Common,
            SlotType.Head,
            new List<StatModifier> { new("Defense", 1), new("Perception", -1) });

        var armor = UniqueItem.Create(
            Guid.NewGuid(),
            "Steel Breastplate",
            "Heavy armor",
            ItemRarity.Uncommon,
            SlotType.Chest,
            new List<StatModifier> { new("Defense", 3), new("Agility", -2) });

        var sword = UniqueItem.Create(
            Guid.NewGuid(),
            "Magic Longsword",
            "Enchanted blade",
            ItemRarity.Rare,
            SlotType.MainHand,
            new List<StatModifier> { new("Attack", 4), new("Defense", 1) });

        // Create slots with equipped items
        var headSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Head);
        headSlot.Equip(helmet, out _);

        var chestSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Chest);
        chestSlot.Equip(armor, out _);

        var mainHandSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.MainHand);
        mainHandSlot.Equip(sword, out _);

        // Empty slots
        var handsSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Hands);
        var legsSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Legs);
        var feetSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Feet);
        var offHandSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.OffHand);

        var allSlots = new List<EquipmentSlot>
        {
            headSlot, chestSlot, mainHandSlot, handsSlot, legsSlot, feetSlot, offHandSlot
        };

        _mockRepository.Setup(r => r.GetSlotsWithItemsAsync(_characterId))
            .ReturnsAsync(allSlots);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.GetEquipmentAsync(_characterId);

        // Assert
        Assert.True(result.IsSuccess);
        var equipment = result.Value;

        // Verify total modifiers are correctly aggregated
        // Defense: 1 (helmet) + 3 (armor) + 1 (sword) = 5
        Assert.True(equipment.TotalModifiers.ContainsKey("Defense"));
        Assert.Equal(5, equipment.TotalModifiers["Defense"]);

        // Attack: 4 (sword only)
        Assert.True(equipment.TotalModifiers.ContainsKey("Attack"));
        Assert.Equal(4, equipment.TotalModifiers["Attack"]);

        // Perception: -1 (helmet only)
        Assert.True(equipment.TotalModifiers.ContainsKey("Perception"));
        Assert.Equal(-1, equipment.TotalModifiers["Perception"]);

        // Agility: -2 (armor only)
        Assert.True(equipment.TotalModifiers.ContainsKey("Agility"));
        Assert.Equal(-2, equipment.TotalModifiers["Agility"]);
    }

    [Fact]
    public async Task GetEquipmentAsync_NoEquippedItems_ReturnsEmptyModifiers()
    {
        // Arrange - All empty slots
        var emptySlots = new List<EquipmentSlot>
        {
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Head),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Chest),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Hands),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Legs),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Feet),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.MainHand),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.OffHand)
        };

        _mockRepository.Setup(r => r.GetSlotsWithItemsAsync(_characterId))
            .ReturnsAsync(emptySlots);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.GetEquipmentAsync(_characterId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value.TotalModifiers);
    }

    // T084: Verify stat modifiers are removed when items unequipped (recalculate totalModifiers)

    [Fact]
    public async Task UnequipItemAsync_RemovesItemFromSlot_ModifiersRecalculatedOnNextGet()
    {
        // Arrange - Equipment with one item equipped
        var sword = UniqueItem.Create(
            Guid.NewGuid(),
            "Magic Sword",
            "Enchanted",
            ItemRarity.Rare,
            SlotType.MainHand,
            new List<StatModifier> { new("Attack", 5) });

        var mainHandSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.MainHand);
        mainHandSlot.Equip(sword, out _);

        _mockRepository.Setup(r => r.GetSlotWithItemAsync(_characterId, SlotType.MainHand))
            .ReturnsAsync(mainHandSlot);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);
        _mockInventoryService.Setup(s => s.AddItemAsync(_adventureId, sword.Id, 1))
            .ReturnsAsync(Result<AddItemResult>.Success(new AddItemResult
            {
                EntryId = Guid.NewGuid(),
                ItemId = sword.Id,
                Quantity = 1,
                Merged = false
            }));

        // Act - Unequip the item
        var unequipResult = await _service.UnequipItemAsync(_characterId, "MainHand", _adventureId);

        // Assert - Unequip succeeded
        Assert.True(unequipResult.IsSuccess);
        Assert.NotNull(unequipResult.Value.UnequippedItem);
        Assert.Equal("Magic Sword", unequipResult.Value.UnequippedItem.Name);
        Assert.True(unequipResult.Value.ReturnedToInventory);

        // Verify the slot is now empty
        Assert.True(mainHandSlot.IsEmpty());
    }

    [Fact]
    public async Task GetEquipmentAsync_AfterUnequip_TotalModifiersDoNotIncludeUnequippedItem()
    {
        // This test demonstrates that totalModifiers are recalculated each time
        // and don't include items that have been unequipped

        // Arrange - Start with equipped armor
        var armor = UniqueItem.Create(
            Guid.NewGuid(),
            "Iron Armor",
            "Basic protection",
            ItemRarity.Common,
            SlotType.Chest,
            new List<StatModifier> { new("Defense", 3) });

        var chestSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Chest);
        chestSlot.Equip(armor, out _);

        // Create all other empty slots
        var allSlots = new List<EquipmentSlot>
        {
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Head),
            chestSlot,
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Hands),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Legs),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Feet),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.MainHand),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.OffHand)
        };

        _mockRepository.Setup(r => r.GetSlotsWithItemsAsync(_characterId))
            .ReturnsAsync(allSlots);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act - Get equipment BEFORE unequip
        var resultBefore = await _service.GetEquipmentAsync(_characterId);

        // Assert - Should have Defense modifier
        Assert.True(resultBefore.IsSuccess);
        Assert.True(resultBefore.Value.TotalModifiers.ContainsKey("Defense"));
        Assert.Equal(3, resultBefore.Value.TotalModifiers["Defense"]);

        // Now simulate unequip by clearing the slot
        chestSlot.Unequip();

        // Act - Get equipment AFTER unequip
        var resultAfter = await _service.GetEquipmentAsync(_characterId);

        // Assert - Defense modifier should be gone (or not present)
        Assert.True(resultAfter.IsSuccess);
        Assert.False(resultAfter.Value.TotalModifiers.ContainsKey("Defense"));
    }

    [Fact]
    public async Task GetEquipmentAsync_PartialUnequip_OnlyRemainingModifiersCalculated()
    {
        // Arrange - Two items equipped, then one is unequipped
        var helmet = UniqueItem.Create(
            Guid.NewGuid(),
            "Iron Helmet",
            "Head protection",
            ItemRarity.Common,
            SlotType.Head,
            new List<StatModifier> { new("Defense", 2) });

        var armor = UniqueItem.Create(
            Guid.NewGuid(),
            "Steel Armor",
            "Body protection",
            ItemRarity.Uncommon,
            SlotType.Chest,
            new List<StatModifier> { new("Defense", 4), new("Speed", -1) });

        var headSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Head);
        headSlot.Equip(helmet, out _);

        var chestSlot = EquipmentSlot.CreateEmpty(_characterId, SlotType.Chest);
        chestSlot.Equip(armor, out _);

        var allSlots = new List<EquipmentSlot>
        {
            headSlot,
            chestSlot,
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Hands),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Legs),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.Feet),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.MainHand),
            EquipmentSlot.CreateEmpty(_characterId, SlotType.OffHand)
        };

        _mockRepository.Setup(r => r.GetSlotsWithItemsAsync(_characterId))
            .ReturnsAsync(allSlots);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act - Initial state: both items equipped
        var resultBefore = await _service.GetEquipmentAsync(_characterId);

        // Assert - Total Defense: 2 + 4 = 6, Speed: -1
        Assert.Equal(6, resultBefore.Value.TotalModifiers["Defense"]);
        Assert.Equal(-1, resultBefore.Value.TotalModifiers["Speed"]);

        // Simulate unequip chest armor
        chestSlot.Unequip();

        // Act - After unequip: only helmet remains
        var resultAfter = await _service.GetEquipmentAsync(_characterId);

        // Assert - Only helmet Defense: 2, no Speed modifier
        Assert.Equal(2, resultAfter.Value.TotalModifiers["Defense"]);
        Assert.False(resultAfter.Value.TotalModifiers.ContainsKey("Speed"));
    }
}
