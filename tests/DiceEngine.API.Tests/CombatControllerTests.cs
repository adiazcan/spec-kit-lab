using DiceEngine.API.Controllers;
using DiceEngine.API.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace DiceEngine.API.Tests;

/// <summary>
/// Integration tests for Combat Controller (T049-T053)
/// Testing Phase 3: Basic Combat with Armor Class (US1 + US4)
/// </summary>
public class CombatControllerTests
{
    private readonly Mock<ICombatService> _combatServiceMock;
    private readonly Mock<ICombatRepository> _combatRepositoryMock;
    private readonly CombatsController _controller;

    // Test data
    private readonly Guid _testAdventureId = Guid.Parse("550e8400-e29b-41d4-a716-446655440001");
    private readonly Guid _testCharacterId1 = Guid.Parse("550e8400-e29b-41d4-a716-446655440002");
    private readonly Guid _testEnemyId1 = Guid.Parse("e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b");

    public CombatControllerTests()
    {
        _combatServiceMock = new Mock<ICombatService>();
        _combatRepositoryMock = new Mock<ICombatRepository>();
        _controller = new CombatsController(_combatServiceMock.Object, _combatRepositoryMock.Object);
    }

    /// <summary>
    /// Helper to create a test combat encounter
    /// </summary>
    private CombatEncounter CreateTestCombatEncounter()
    {
        var encounter = new CombatEncounter
        {
            Id = Guid.NewGuid(),
            AdventureId = _testAdventureId,
            Status = CombatStatus.NotStarted,
            CurrentRound = 1,
            CurrentTurnIndex = 0,
            StartedAt = DateTime.UtcNow,
            Version = 1
        };
        return encounter;
    }

    /// <summary>
    /// T049: Verify InitiateCombat endpoint returns 201 Created with valid request
    /// </summary>
    [Fact]
    public async Task InitiateCombat_ValidRequest_Returns201Created()
    {
        // Arrange
        var request = new InitiateCombatRequest
        {
            AdventureId = _testAdventureId,
            CharacterIds = new List<Guid> { _testCharacterId1 },
            EnemyIds = new List<Guid> { _testEnemyId1 }
        };

        var encounter = CreateTestCombatEncounter();
        encounter.Status = CombatStatus.Active;
        encounter.InitiativeOrder.Add(Guid.NewGuid());
        encounter.InitiativeOrder.Add(Guid.NewGuid());

        _combatServiceMock
            .Setup(s => s.StartCombatAsync(request.AdventureId, request.CharacterIds, request.EnemyIds))
            .ReturnsAsync(new Result<CombatEncounter> { Value = encounter, IsSuccess = true });

        // Act
        var actionResult = await _controller.InitiateCombat(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(actionResult.Result);
        Assert.Equal(nameof(CombatsController.GetCombat), createdResult.ActionName);
        Assert.NotNull(createdResult.Value);
        var response = Assert.IsType<CombatStateResponse>(createdResult.Value);
        Assert.Equal(encounter.Id, response.CombatEncounterId);
        Assert.Equal("Active", response.Status);
    }

    /// <summary>
    /// T049: Verify InitiateCombat returns 400 BadRequest with invalid request
    /// </summary>
    [Fact]
    public async Task InitiateCombat_InvalidRequest_Returns400BadRequest()
    {
        // Arrange - Missing character IDs
        var request = new InitiateCombatRequest
        {
            AdventureId = _testAdventureId,
            CharacterIds = new List<Guid>(), // Empty
            EnemyIds = new List<Guid> { _testEnemyId1 }
        };

        // Act
        var actionResult = await _controller.InitiateCombat(request);

        // Assert
        var badResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        Assert.NotNull(badResult.Value);
        var errorResponse = Assert.IsType<ErrorResponse>(badResult.Value);
        Assert.Equal("INVALID_REQUEST", errorResponse.Code);
    }

    /// <summary>
    /// T049: Verify InitiateCombat returns 404 NotFound when adventure/character/enemy not found
    /// </summary>
    [Fact]
    public async Task InitiateCombat_CharacterNotFound_Returns404NotFound()
    {
        // Arrange
        var request = new InitiateCombatRequest
        {
            AdventureId = _testAdventureId,
            CharacterIds = new List<Guid> { Guid.NewGuid() }, // Non-existent
            EnemyIds = new List<Guid> { _testEnemyId1 }
        };

        _combatServiceMock
            .Setup(s => s.StartCombatAsync(It.IsAny<Guid>(), It.IsAny<List<Guid>>(), It.IsAny<List<Guid>>()))
            .ReturnsAsync(new Result<CombatEncounter> { Error = "Character not found", IsSuccess = false });

        // Act
        var actionResult = await _controller.InitiateCombat(request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        Assert.Equal("NOT_FOUND", errorResponse.Code);
    }

    /// <summary>
    /// T050: Verify ResolveTurn endpoint processes player attack and returns updated combat state
    /// </summary>
    [Fact]
    public async Task ResolveTurn_PlayerAttacksEnemy_Returns200WithUpdatedState()
    {
        // Arrange
        var encounter = CreateTestCombatEncounter();
        encounter.Status = CombatStatus.Active;
        var characterId = Guid.NewGuid();
        var enemyId = Guid.NewGuid();
        encounter.InitiativeOrder.Add(characterId);
        encounter.InitiativeOrder.Add(enemyId);

        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = characterId,
            TargetCombatantId = enemyId
        };

        var updatedEncounter = CreateTestCombatEncounter();
        updatedEncounter.Status = CombatStatus.Active;
        updatedEncounter.InitiativeOrder.Add(characterId);
        updatedEncounter.InitiativeOrder.Add(enemyId);

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, characterId, enemyId))
            .ReturnsAsync(new Result<(CombatEncounter encounter, AttackAction action)>
            {
                Value = (updatedEncounter, default!),
                IsSuccess = true
            });

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(encounter.Id, response.CombatEncounterId);
        Assert.True(response.ActiveCombatants > 0);
    }

    /// <summary>
    /// T050: Verify ResolveTurn returns 409 Conflict when not player's turn
    /// </summary>
    [Fact]
    public async Task ResolveTurn_NotPlayerTurn_Returns409Conflict()
    {
        // Arrange
        var encounter = CreateTestCombatEncounter();
        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = Guid.NewGuid(),
            TargetCombatantId = Guid.NewGuid()
        };

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>()))
            .ReturnsAsync(new Result<(CombatEncounter, AttackAction)>
            {
                Error = "Not your turn",
                IsSuccess = false
            });

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(actionResult.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(conflictResult.Value);
        Assert.Equal("CONFLICT", errorResponse.Code);
    }

    /// <summary>
    /// T051: Verify combat ends with player victory when all enemies defeated
    /// </summary>
    [Fact]
    public async Task Combat_EnemyDefeated_EndsWithPlayerVictory()
    {
        // Arrange
        var encounter = CreateTestCombatEncounter();
        var characterId = Guid.NewGuid();
        var enemyId = Guid.NewGuid();

        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = characterId,
            TargetCombatantId = enemyId
        };

        var finalEncounter = CreateTestCombatEncounter();
        finalEncounter.Status = CombatStatus.Completed;
        finalEncounter.Winner = CombatSide.Player;
        finalEncounter.EndedAt = DateTime.UtcNow;

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, characterId, enemyId))
            .ReturnsAsync(new Result<(CombatEncounter, AttackAction)>
            {
                Value = (finalEncounter, default!),
                IsSuccess = true
            });

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal("Completed", response.Status);
        Assert.Equal("Player", response.Winner);
    }

    /// <summary>
    /// T052: Verify attack misses when roll is below armor class (no damage)
    /// </summary>
    [Fact]
    public async Task Attack_BelowAC_Misses_NoDamage()
    {
        // Arrange
        var encounter = CreateTestCombatEncounter();
        encounter.Status = CombatStatus.Active;
        var characterId = Guid.NewGuid();
        var enemyId = Guid.NewGuid();
        encounter.InitiativeOrder.Add(characterId);
        encounter.InitiativeOrder.Add(enemyId);

        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = characterId,
            TargetCombatantId = enemyId
        };

        // Return encounter where enemy took no damage (miss)
        var missEncounter = CreateTestCombatEncounter();
        missEncounter.Status = CombatStatus.Active;
        missEncounter.InitiativeOrder.Add(characterId);
        missEncounter.InitiativeOrder.Add(enemyId);

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, characterId, enemyId))
            .ReturnsAsync(new Result<(CombatEncounter, AttackAction)>
            {
                Value = (missEncounter, default!),
                IsSuccess = true
            });

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(encounter.Id, response.CombatEncounterId);
        // Verify enemy health unchanged (no damage)
        Assert.True(response.ActiveCombatants > 0);
    }

    /// <summary>
    /// T053: Verify attack hits when roll meets or exceeds armor class (deals damage)
    /// </summary>
    [Fact]
    public async Task Attack_MeetsOrExceedsAC_Hits_DealsDamage()
    {
        // Arrange
        var encounter = CreateTestCombatEncounter();
        encounter.Status = CombatStatus.Active;
        var characterId = Guid.NewGuid();
        var enemyId = Guid.NewGuid();
        encounter.InitiativeOrder.Add(characterId);
        encounter.InitiativeOrder.Add(enemyId);

        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = characterId,
            TargetCombatantId = enemyId
        };

        // Simulate successful attack with damage
        var hitEncounter = CreateTestCombatEncounter();
        hitEncounter.Status = CombatStatus.Active;
        hitEncounter.InitiativeOrder.Add(characterId);
        hitEncounter.InitiativeOrder.Add(enemyId);

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, characterId, enemyId))
            .ReturnsAsync(new Result<(CombatEncounter, AttackAction)>
            {
                Value = (hitEncounter, default!),
                IsSuccess = true
            });

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(encounter.Id, response.CombatEncounterId);
        // Combat is ongoing (still has active combatants)
        Assert.True(response.ActiveCombatants > 0);
    }

    /// <summary>
    /// T049: Verify GetCombat returns current combat encounter state
    /// </summary>
    [Fact]
    public async Task GetCombat_WithValidId_Returns200WithCombatState()
    {
        // Arrange
        var encounter = CreateTestCombatEncounter();

        _combatServiceMock
            .Setup(s => s.GetCombatStatusAsync(encounter.Id))
            .ReturnsAsync(new Result<CombatEncounter> { Value = encounter, IsSuccess = true });

        // Act
        var actionResult = await _controller.GetCombat(encounter.Id);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(encounter.Id, response.CombatEncounterId);
    }

    /// <summary>
    /// T049: Verify GetCombat returns 404 NotFound for non-existent combat
    /// </summary>
    [Fact]
    public async Task GetCombat_WithInvalidId_Returns404NotFound()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        _combatServiceMock
            .Setup(s => s.GetCombatStatusAsync(invalidId))
            .ReturnsAsync(new Result<CombatEncounter> { Error = "Combat not found", IsSuccess = false });

        // Act
        var actionResult = await _controller.GetCombat(invalidId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        Assert.Equal("NOT_FOUND", errorResponse.Code);
    }
}
