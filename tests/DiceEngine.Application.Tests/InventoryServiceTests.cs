using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;
using Moq;

namespace DiceEngine.Application.Tests;

/// <summary>
/// Tests for InventoryService.
/// T040: Verify UniqueItems do not stack in inventory.
/// </summary>
public class InventoryServiceTests
{
    private readonly Mock<IInventoryRepository> _mockRepository;
    private readonly InventoryService _service;
    private readonly Guid _adventureId = Guid.NewGuid();

    public InventoryServiceTests()
    {
        _mockRepository = new Mock<IInventoryRepository>();
        _service = new InventoryService(_mockRepository.Object);

        // Default setup: adventure exists
        _mockRepository.Setup(r => r.AdventureExistsAsync(_adventureId))
            .ReturnsAsync(true);
    }

    // T040: Test InventoryController endpoints with UniqueItems (verify no stacking occurs)

    [Fact]
    public async Task AddItemAsync_UniqueItem_CreatesNewEntryEveryTime()
    {
        // Arrange
        var swordId = Guid.NewGuid();
        var sword = UniqueItem.Create(
            swordId,
            "Iron Longsword",
            "A sturdy blade",
            ItemRarity.Common,
            SlotType.MainHand,
            new List<StatModifier> { new("Attack", 2) });

        _mockRepository.Setup(r => r.GetItemByIdAsync(swordId))
            .ReturnsAsync(sword);
        _mockRepository.Setup(r => r.GetEntryCountAsync(_adventureId))
            .ReturnsAsync(0);
        _mockRepository.Setup(r => r.AddEntryAsync(It.IsAny<InventoryEntry>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act - Add first sword
        var result1 = await _service.AddItemAsync(_adventureId, swordId, 1);

        // Assert - First sword creates new entry
        Assert.True(result1.IsSuccess);
        Assert.False(result1.Value.Merged);
        Assert.Equal(1, result1.Value.Quantity);

        // Verify AddEntryAsync was called (not merged)
        _mockRepository.Verify(r => r.AddEntryAsync(It.IsAny<InventoryEntry>()), Times.Once);
    }

    [Fact]
    public async Task AddItemAsync_UniqueItem_NeverMergesWithExisting()
    {
        // Arrange - Simulate adding second unique item
        var swordId = Guid.NewGuid();
        var sword = UniqueItem.Create(
            swordId,
            "Iron Longsword",
            "A sturdy blade",
            ItemRarity.Common,
            SlotType.MainHand,
            new List<StatModifier> { new("Attack", 2) });

        _mockRepository.Setup(r => r.GetItemByIdAsync(swordId))
            .ReturnsAsync(sword);
        _mockRepository.Setup(r => r.GetEntryCountAsync(_adventureId))
            .ReturnsAsync(1); // One item already exists
        _mockRepository.Setup(r => r.AddEntryAsync(It.IsAny<InventoryEntry>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act - Add another sword (should NOT merge even if same item type)
        var result = await _service.AddItemAsync(_adventureId, swordId, 1);

        // Assert - Should create new entry, not merge
        Assert.True(result.IsSuccess);
        Assert.False(result.Value.Merged);
        Assert.Equal(1, result.Value.Quantity);

        // Verify new entry was created (no merge attempted)
        _mockRepository.Verify(r => r.AddEntryAsync(It.IsAny<InventoryEntry>()), Times.Once);
        // Verify no attempt to get existing entry for merge (unique items skip this check)
        _mockRepository.Verify(r => r.GetEntryByAdventureAndItemAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task AddItemAsync_UniqueItem_QuantityAlwaysOne()
    {
        // Arrange
        var armorId = Guid.NewGuid();
        var armor = UniqueItem.Create(
            armorId,
            "Iron Breastplate",
            "Heavy armor",
            ItemRarity.Uncommon,
            SlotType.Chest,
            new List<StatModifier> { new("Defense", 3) });

        InventoryEntry? capturedEntry = null;
        _mockRepository.Setup(r => r.GetItemByIdAsync(armorId))
            .ReturnsAsync(armor);
        _mockRepository.Setup(r => r.GetEntryCountAsync(_adventureId))
            .ReturnsAsync(0);
        _mockRepository.Setup(r => r.AddEntryAsync(It.IsAny<InventoryEntry>()))
            .Callback<InventoryEntry>(e => capturedEntry = e)
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act - Try to add multiple unique items at once (should ignore quantity > 1)
        var result = await _service.AddItemAsync(_adventureId, armorId, 5);

        // Assert - Quantity should be 1 regardless of requested quantity
        Assert.True(result.IsSuccess);
        Assert.Equal(1, result.Value.Quantity);
        Assert.NotNull(capturedEntry);
        Assert.Equal(1, capturedEntry.Quantity);
    }

    [Fact]
    public async Task AddItemAsync_StackableItem_MergesWithExistingStack()
    {
        // Arrange - Stackable item comparison
        var potionId = Guid.NewGuid();
        var potion = StackableItem.Create(
            potionId,
            "Health Potion",
            "Restores health",
            ItemRarity.Common,
            maxStackSize: 10);

        var existingEntry = InventoryEntry.Create(_adventureId, potionId, 3);

        _mockRepository.Setup(r => r.GetItemByIdAsync(potionId))
            .ReturnsAsync(potion);
        _mockRepository.Setup(r => r.GetEntryByAdventureAndItemAsync(_adventureId, potionId))
            .ReturnsAsync(existingEntry);
        _mockRepository.Setup(r => r.SaveAsync())
            .ReturnsAsync(1);

        // Act - Add more potions
        var result = await _service.AddItemAsync(_adventureId, potionId, 2);

        // Assert - Should merge with existing stack
        Assert.True(result.IsSuccess);
        Assert.True(result.Value.Merged); // Key difference from unique items
        Assert.Equal(5, result.Value.Quantity); // 3 + 2 = 5
    }
}
