using DiceEngine.API.Models;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Enemy template management endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EnemiesController : ControllerBase
{
    private readonly IEnemyRepository _enemyRepository;

    public EnemiesController(IEnemyRepository enemyRepository)
    {
        _enemyRepository = enemyRepository ?? throw new ArgumentNullException(nameof(enemyRepository));
    }

    /// <summary>
    /// Create a new enemy template
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<EnemyResponse>> CreateEnemy(
        [FromBody] CreateEnemyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "Name is required" });

        if (request.Name.Length > 100)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "Name must be 1-100 characters" });

        if (request.MaxHealth <= 0)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "MaxHealth must be positive" });

        if (request.ArmorClass < 10)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "ArmorClass must be >= 10" });

        // Validate attributes
        var attributes = new[] { request.Strength, request.Dexterity, request.Intelligence, request.Constitution, request.Charisma };
        if (attributes.Any(a => a < 3 || a > 18))
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "All attributes must be in range 3-18" });

        try
        {
            var enemy = Enemy.Create(
                request.Name,
                request.Strength,
                request.Dexterity,
                request.Intelligence,
                request.Constitution,
                request.Charisma,
                request.MaxHealth,
                request.ArmorClass,
                request.EquippedWeapon,
                request.FleeHealthThreshold);

        await _enemyRepository.AddEnemyAsync(enemy);
        await _enemyRepository.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEnemy), new { id = enemy.Id }, MapEnemyToResponse(enemy));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = ex.Message });
            }
    }

    /// <summary>
    /// Get an enemy template by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<EnemyResponse>> GetEnemy(Guid id)
    {
        var enemy = await _enemyRepository.GetEnemyByIdAsync(id);
        if (enemy == null)
            return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = "Enemy not found" });

        return Ok(MapEnemyToResponse(enemy));
    }

    /// <summary>
    /// List all enemy templates with pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<EnemyListResponse>> ListEnemies(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "Page must be >= 1" });

        if (pageSize < 1 || pageSize > 100)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "PageSize must be between 1 and 100" });

        var enemies = await _enemyRepository.GetEnemiesAsync(page, pageSize);
        var totalCount = await _enemyRepository.GetEnemiesCountAsync();

        var response = new EnemyListResponse
        {
            Enemies = enemies.Select(MapEnemyToResponse).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(response);
    }

    /// <summary>
    /// Update an existing enemy template
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<EnemyResponse>> UpdateEnemy(
        Guid id,
        [FromBody] CreateEnemyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "Name is required" });

        var enemy = await _enemyRepository.GetEnemyByIdAsync(id);
        if (enemy == null)
            return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = "Enemy not found" });

        // Validate attributes
        var attributes = new[] { request.Strength, request.Dexterity, request.Intelligence, request.Constitution, request.Charisma };
        if (attributes.Any(a => a < 3 || a > 18))
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "All attributes must be in range 3-18" });

        try
        {
            var updatedEnemy = Enemy.Create(
                request.Name,
                request.Strength,
                request.Dexterity,
                request.Intelligence,
                request.Constitution,
                request.Charisma,
                request.MaxHealth,
                request.ArmorClass,
                request.EquippedWeapon,
                request.FleeHealthThreshold);

            await _enemyRepository.UpdateEnemyAsync(updatedEnemy);
        await _enemyRepository.SaveChangesAsync();

            return Ok(MapEnemyToResponse(updatedEnemy));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = ex.Message });
        }
    }

    /// <summary>
    /// Delete an enemy template
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEnemy(Guid id)
    {
        var enemy = await _enemyRepository.GetEnemyByIdAsync(id);
        if (enemy == null)
            return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = "Enemy not found" });

        _enemyRepository.RemoveEnemy(enemy);
        await _enemyRepository.SaveChangesAsync();

        return NoContent();
    }

    private static EnemyResponse MapEnemyToResponse(Enemy enemy)
    {
        return new EnemyResponse
        {
            Id = enemy.Id,
            Name = enemy.Name,
            Description = enemy.Description,
            Strength = enemy.StrBase,
            Dexterity = enemy.DexBase,
            Intelligence = enemy.IntBase,
            Constitution = enemy.ConBase,
            Charisma = enemy.ChaBase,
            StrModifier = enemy.StrModifier,
            DexModifier = enemy.DexModifier,
            IntModifier = enemy.IntModifier,
            ConModifier = enemy.ConModifier,
            ChaModifier = enemy.ChaModifier,
            MaxHealth = enemy.MaxHealth,
            CurrentHealth = enemy.CurrentHealth,
            ArmorClass = enemy.ArmorClass,
            CurrentAIState = enemy.CurrentAIState.ToString(),
            EquippedWeapon = enemy.EquippedWeaponInfo,
            FleeHealthThreshold = enemy.FleeHealthThreshold,
            CreatedAt = enemy.CreatedAt,
            LastModifiedAt = enemy.LastModifiedAt
        };
    }
}
