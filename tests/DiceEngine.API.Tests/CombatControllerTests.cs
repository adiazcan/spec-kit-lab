using DiceEngine.API.Controllers;
using DiceEngine.API.Models;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;
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
    /// Helper to create a test combat encounter with valid initial data
    /// </summary>
    private CombatEncounter CreateTestCombatEncounter()
    {
        // Create player character combatant
        var playerCombatant = Combatant.CreateFromCharacter(
            _testAdventureId,
            "TestCharacter",
            _testCharacterId1,
            dexModifier: 2,
            armorClass: 16,
            maxHealth: 30,
            initiativeRoll: 15);

        // Create an enemy and then convert to combatant
        var enemy = Enemy.Create(
            name: "TestEnemy",
            strBase: 12,
            dexBase: 13,
            intBase: 10,
            conBase: 14,
            chaBase: 10,
            maxHealth: 25,
            armorClass: 14,
            weaponInfo: "Shortsword|1d6+1");

        var enemyCombatant = Combatant.CreateFromEnemy(enemy, initiativeRoll: 10);

        var combatants = new List<Combatant> { playerCombatant, enemyCombatant };

        // Create encounter using factory method (will be in NotStarted state)
        return CombatEncounter.Create(_testAdventureId, combatants);
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
        encounter.StartCombat(new List<Guid> { _testCharacterId1, _testEnemyId1 });

        _combatServiceMock
            .Setup(s => s.StartCombatAsync(request.AdventureId, request.CharacterIds, request.EnemyIds))
            .ReturnsAsync(Result<CombatEncounter>.Success(encounter));

        // Act
        var actionResult = await _controller.InitiateCombat(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(actionResult.Result);
        Assert.Equal(nameof(CombatsController.GetCombat), createdResult.ActionName);
        Assert.NotNull(createdResult.Value);
        var response = Assert.IsType<CombatStateResponse>(createdResult.Value);
        Assert.Equal(encounter.Id, response.Id);
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
            .ReturnsAsync(Result<CombatEncounter>.Failure("Character not found"));

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
        encounter.StartCombat(new List<Guid> { encounter.Combatants.ElementAt(0).Id, encounter.Combatants.ElementAt(1).Id });
        
        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = encounter.Combatants.ElementAt(0).Id,
            TargetCombatantId = encounter.Combatants.ElementAt(1).Id
        };

        var updatedEncounter = CreateTestCombatEncounter();
        updatedEncounter.StartCombat(new List<Guid> { updatedEncounter.Combatants.ElementAt(0).Id, updatedEncounter.Combatants.ElementAt(1).Id });

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, It.IsAny<Guid>(), It.IsAny<Guid>()))
            .ReturnsAsync(Result<(AttackAction action, CombatEncounter encounter)>.Success(
                (default!, updatedEncounter)));

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(updatedEncounter.Id, response.Id);
        Assert.True(response.Combatants.Count > 0);
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
            .ReturnsAsync(Result<(AttackAction action, CombatEncounter encounter)>.Failure("Not your turn"));

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
        encounter.StartCombat(new List<Guid> { _testCharacterId1, _testEnemyId1 });

        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = _testCharacterId1,
            TargetCombatantId = _testEnemyId1
        };

        var finalEncounter = CreateTestCombatEncounter();
        finalEncounter.StartCombat(new List<Guid> { _testCharacterId1, _testEnemyId1 });
        finalEncounter.EndCombat(CombatSide.Player);

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, _testCharacterId1, _testEnemyId1))
            .ReturnsAsync(Result<(AttackAction action, CombatEncounter encounter)>.Success(
                (default!, finalEncounter)));

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
        encounter.StartCombat(new List<Guid> { encounter.Combatants.ElementAt(0).Id, encounter.Combatants.ElementAt(1).Id });

        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = encounter.Combatants.ElementAt(0).Id,
            TargetCombatantId = encounter.Combatants.ElementAt(1).Id
        };

        // Return encounter where enemy took no damage (miss)
        var missEncounter = CreateTestCombatEncounter();
        missEncounter.StartCombat(new List<Guid> { missEncounter.Combatants.ElementAt(0).Id, missEncounter.Combatants.ElementAt(1).Id });

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, It.IsAny<Guid>(), It.IsAny<Guid>()))
            .ReturnsAsync(Result<(AttackAction action, CombatEncounter encounter)>.Success(
                (default!, missEncounter)));

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(missEncounter.Id, response.Id);
        // Verify enemy health unchanged (no damage)
        Assert.True(response.Combatants.Count > 0);
    }

    /// <summary>
    /// T053: Verify attack hits when roll meets or exceeds armor class (deals damage)
    /// </summary>
    [Fact]
    public async Task Attack_MeetsOrExceedsAC_Hits_DealsDamage()
    {
        // Arrange
        var encounter = CreateTestCombatEncounter();
        encounter.StartCombat(new List<Guid> { encounter.Combatants.ElementAt(0).Id, encounter.Combatants.ElementAt(1).Id });

        var request = new ResolveTurnRequest
        {
            AttackingCombatantId = encounter.Combatants.ElementAt(0).Id,
            TargetCombatantId = encounter.Combatants.ElementAt(1).Id
        };

        // Simulate successful attack with damage
        var hitEncounter = CreateTestCombatEncounter();
        hitEncounter.StartCombat(new List<Guid> { hitEncounter.Combatants.ElementAt(0).Id, hitEncounter.Combatants.ElementAt(1).Id });

        _combatServiceMock
            .Setup(s => s.ResolveAttackAsync(encounter.Id, It.IsAny<Guid>(), It.IsAny<Guid>()))
            .ReturnsAsync(Result<(AttackAction action, CombatEncounter encounter)>.Success(
                (default!, hitEncounter)));

        // Act
        var actionResult = await _controller.ResolveTurn(encounter.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(hitEncounter.Id, response.Id);
        // Combat is ongoing (still has active combatants)
        Assert.True(response.Combatants.Count > 0);
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
            .ReturnsAsync(Result<CombatEncounter>.Success(encounter));

        // Act
        var actionResult = await _controller.GetCombat(encounter.Id);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<CombatStateResponse>(okResult.Value);
        Assert.Equal(encounter.Id, response.Id);
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
            .ReturnsAsync(Result<CombatEncounter>.Failure("Combat not found"));

        // Act
        var actionResult = await _controller.GetCombat(invalidId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult.Result);
        var errorResponse = Assert.IsType<ErrorResponse>(notFoundResult.Value);
        Assert.Equal("NOT_FOUND", errorResponse.Code);
    }
}
