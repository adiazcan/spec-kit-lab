using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Moq;
using Xunit;

namespace DiceEngine.Application.Tests;

public class AdventureServiceTests
{
    private readonly Mock<IAdventureRepository> _repositoryMock;
    private readonly IAdventureService _service;

    public AdventureServiceTests()
    {
        _repositoryMock = new Mock<IAdventureRepository>();
        _service = new AdventureService(_repositoryMock.Object);
    }

    #region Create Tests

    [Fact]
    public async Task CreateAsync_WithValidRequest_ReturnsAdventure()
    {
        // Arrange
        var request = new CreateAdventureRequest
        {
            InitialSceneId = "scene_start",
            InitialGameState = new Dictionary<string, object> { { "level", 1 } }
        };

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("scene_start", result.CurrentSceneId);
        Assert.Contains("level", result.GameState.Keys);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Adventure>()), Times.Once);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithoutGameState_CreatesWithEmptyState()
    {
        // Arrange
        var request = new CreateAdventureRequest
        {
            InitialSceneId = "scene_tavern"
        };

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.GameState);
        Assert.Equal("scene_tavern", result.CurrentSceneId);
    }

    [Fact]
    public async Task CreateAsync_SetsCreatedAndLastUpdatedAtTimestamps()
    {
        // Arrange
        var request = new CreateAdventureRequest { InitialSceneId = "scene_test" };
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = await _service.CreateAsync(request);
        var afterCreation = DateTime.UtcNow;

        // Assert
        Assert.True(result.CreatedAt >= beforeCreation && result.CreatedAt <= afterCreation);
        Assert.Equal(result.CreatedAt, result.LastUpdatedAt);
    }

    #endregion

    #region Get Tests

    [Fact]
    public async Task GetAsync_WithValidId_ReturnsAdventure()
    {
        // Arrange
        var id = Guid.NewGuid();
        var adventure = Adventure.Create("scene_start");
        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(adventure);

        // Act
        var result = await _service.GetAsync(id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(adventure.Id, result.Id);
        Assert.Equal(adventure.CurrentSceneId, result.CurrentSceneId);
    }

    [Fact]
    public async Task GetAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Adventure?)null);

        // Act
        var result = await _service.GetAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region List Tests

    [Fact]
    public async Task ListAsync_WithValidPage_ReturnsPaginatedAdventures()
    {
        // Arrange
        var adventures = new List<Adventure>
        {
            Adventure.Create("scene_1"),
            Adventure.Create("scene_2")
        };
        _repositoryMock.Setup(r => r.GetPagedAsync(1, 20)).ReturnsAsync(adventures);

        // Act
        var result = await _service.ListAsync(1, 20);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
        _repositoryMock.Verify(r => r.GetPagedAsync(1, 20), Times.Once);
    }

    [Fact]
    public async Task ListAsync_DefaultParameters_UsesPage1Limit20()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetPagedAsync(1, 20)).ReturnsAsync(new List<Adventure>());

        // Act
        await _service.ListAsync();

        // Assert
        _repositoryMock.Verify(r => r.GetPagedAsync(1, 20), Times.Once);
    }

    [Fact]
    public async Task GetTotalCountAsync_ReturnsCorrectCount()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetCountAsync()).ReturnsAsync(42);

        // Act
        var result = await _service.GetTotalCountAsync();

        // Assert
        Assert.Equal(42, result);
    }

    #endregion

    #region Update Tests

    [Fact]
    public async Task UpdateAsync_WithValidId_UpdatesStateAndTimestamp()
    {
        // Arrange
        var id = Guid.NewGuid();
        var adventure = Adventure.Create("scene_old");
        var originalCreatedAt = adventure.CreatedAt;
        var originalLastUpdatedAt = adventure.LastUpdatedAt;
        var newGameState = new Dictionary<string, object> { { "health", 95 } };

        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(adventure);

        var request = new UpdateAdventureRequest
        {
            CurrentSceneId = "scene_new",
            GameState = newGameState
        };

        // Act
        var result = await _service.UpdateAsync(id, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("scene_new", result.CurrentSceneId);
        Assert.Equal(newGameState["health"], result.GameState["health"]);
        Assert.Equal(originalCreatedAt, result.CreatedAt); // CreatedAt should not change
        Assert.True(result.LastUpdatedAt >= originalLastUpdatedAt); // LastUpdatedAt should be newer
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Adventure?)null);
        var request = new UpdateAdventureRequest { CurrentSceneId = "scene_new" };

        // Act
        var result = await _service.UpdateAsync(Guid.NewGuid(), request);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public async Task DeleteAsync_WithValidId_ReturnsTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.DeleteAsync(id)).ReturnsAsync(true);

        // Act
        var result = await _service.DeleteAsync(id);

        // Assert
        Assert.True(result);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ReturnsFalse()
    {
        // Arrange
        _repositoryMock.Setup(r => r.DeleteAsync(It.IsAny<Guid>())).ReturnsAsync(false);

        // Act
        var result = await _service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    #endregion
}
