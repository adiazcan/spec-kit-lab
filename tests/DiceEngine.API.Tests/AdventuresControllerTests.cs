using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.API.Controllers;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace DiceEngine.API.Tests;

public class AdventuresControllerTests
{
    private readonly Mock<IAdventureService> _serviceMock;
    private readonly AdventuresController _controller;

    public AdventuresControllerTests()
    {
        _serviceMock = new Mock<IAdventureService>();
        _controller = new AdventuresController(_serviceMock.Object);
    }

    #region Create Tests

    [Fact]
    public async Task CreateAdventure_WithValidRequest_Returns201Created()
    {
        // Arrange
        var request = new CreateAdventureRequest
        {
            InitialSceneId = "scene_start",
            InitialGameState = new Dictionary<string, object> { { "level", 1 } }
        };

        var adventureDto = new AdventureDto
        {
            Id = Guid.NewGuid(),
            CurrentSceneId = "scene_start",
            GameState = request.InitialGameState,
            CreatedAt = DateTime.UtcNow,
            LastUpdatedAt = DateTime.UtcNow
        };

        _serviceMock.Setup(s => s.CreateAsync(request)).ReturnsAsync(adventureDto);

        // Act
        var result = await _controller.CreateAdventure(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(AdventuresController.GetAdventure), createdResult.ActionName);
        Assert.Equal(adventureDto.Id, ((AdventureDto)createdResult.Value!).Id);
        Assert.Equal(201, createdResult.StatusCode);
    }

    [Fact]
    public async Task CreateAdventure_WithEmptySceneId_Returns400BadRequest()
    {
        // Arrange
        var request = new CreateAdventureRequest { InitialSceneId = "" };

        // Act
        var result = await _controller.CreateAdventure(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(400, badRequestResult.StatusCode);
        _serviceMock.Verify(s => s.CreateAsync(It.IsAny<CreateAdventureRequest>()), Times.Never);
    }

    [Fact]
    public async Task CreateAdventure_WithNullSceneId_Returns400BadRequest()
    {
        // Arrange
        var request = new CreateAdventureRequest { InitialSceneId = null! };

        // Act
        var result = await _controller.CreateAdventure(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }

    #endregion

    #region Get Tests

    [Fact]
    public async Task GetAdventure_WithValidId_Returns200Ok()
    {
        // Arrange
        var id = Guid.NewGuid();
        var adventureDto = new AdventureDto
        {
            Id = id,
            CurrentSceneId = "scene_start",
            GameState = new Dictionary<string, object>(),
            CreatedAt = DateTime.UtcNow,
            LastUpdatedAt = DateTime.UtcNow
        };

        _serviceMock.Setup(s => s.GetAsync(id)).ReturnsAsync(adventureDto);

        // Act
        var result = await _controller.GetAdventure(id);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(200, okResult.StatusCode);
        Assert.Equal(adventureDto.Id, ((AdventureDto)okResult.Value!).Id);
    }

    [Fact]
    public async Task GetAdventure_WithInvalidId_Returns404NotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.GetAsync(id)).ReturnsAsync((AdventureDto?)null);

        // Act
        var result = await _controller.GetAdventure(id);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundResult>(result.Result);
        Assert.Equal(404, notFoundResult.StatusCode);
    }

    #endregion

    #region List Tests

    [Fact]
    public async Task ListAdventures_WithValidPage_Returns200Ok()
    {
        // Arrange
        var adventures = new List<AdventureDto>
        {
            new() { Id = Guid.NewGuid(), CurrentSceneId = "scene_1" },
            new() { Id = Guid.NewGuid(), CurrentSceneId = "scene_2" }
        };

        _serviceMock.Setup(s => s.ListAsync(1, 20)).ReturnsAsync(adventures);
        _serviceMock.Setup(s => s.GetTotalCountAsync()).ReturnsAsync(2);

        // Act
        var result = await _controller.ListAdventures(1, 20);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(200, okResult.StatusCode);
        var response = (PagedAdventureResponse)okResult.Value!;
        Assert.Equal(2, response.Adventures.Count);
        Assert.Equal(2, response.Total);
        Assert.False(response.HasMore);
    }

    [Fact]
    public async Task ListAdventures_WithInvalidPage_Returns400BadRequest()
    {
        // Act
        var result = await _controller.ListAdventures(0, 20);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(400, badRequestResult.StatusCode);
        _serviceMock.Verify(s => s.ListAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task ListAdventures_WithInvalidLimit_Returns400BadRequest()
    {
        // Act
        var result = await _controller.ListAdventures(1, 101);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }

    #endregion

    #region Update Tests

    [Fact]
    public async Task UpdateAdventure_WithValidRequest_Returns200Ok()
    {
        // Arrange
        var id = Guid.NewGuid();
        var request = new UpdateAdventureRequest
        {
            CurrentSceneId = "scene_new",
            GameState = new Dictionary<string, object> { { "health", 95 } }
        };

        var updatedAdventure = new AdventureDto
        {
            Id = id,
            CurrentSceneId = "scene_new",
            GameState = request.GameState,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            LastUpdatedAt = DateTime.UtcNow
        };

        _serviceMock.Setup(s => s.UpdateAsync(id, request)).ReturnsAsync(updatedAdventure);

        // Act
        var result = await _controller.UpdateAdventure(id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(200, okResult.StatusCode);
        Assert.Equal(updatedAdventure.CurrentSceneId, ((AdventureDto)okResult.Value!).CurrentSceneId);
    }

    [Fact]
    public async Task UpdateAdventure_WithEmptySceneId_Returns400BadRequest()
    {
        // Arrange
        var id = Guid.NewGuid();
        var request = new UpdateAdventureRequest { CurrentSceneId = "" };

        // Act
        var result = await _controller.UpdateAdventure(id, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }

    [Fact]
    public async Task UpdateAdventure_WithInvalidId_Returns404NotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        var request = new UpdateAdventureRequest { CurrentSceneId = "scene_new" };
        _serviceMock.Setup(s => s.UpdateAsync(id, request)).ReturnsAsync((AdventureDto?)null);

        // Act
        var result = await _controller.UpdateAdventure(id, request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundResult>(result.Result);
        Assert.Equal(404, notFoundResult.StatusCode);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public async Task DeleteAdventure_WithValidId_Returns204NoContent()
    {
        // Arrange
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.DeleteAsync(id)).ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteAdventure(id);

        // Assert
        var noContentResult = Assert.IsType<NoContentResult>(result);
        Assert.Equal(204, noContentResult.StatusCode);
    }

    [Fact]
    public async Task DeleteAdventure_WithInvalidId_Returns404NotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.DeleteAsync(id)).ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteAdventure(id);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundResult>(result);
        Assert.Equal(404, notFoundResult.StatusCode);
    }

    #endregion
}
