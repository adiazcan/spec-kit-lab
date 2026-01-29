using System;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Controller for loot table operations and random item generation.
/// </summary>
[ApiController]
[Route("api/loot-tables")]
public class LootTablesController : ControllerBase
{
    private readonly ILootGeneratorService _lootService;

    public LootTablesController(ILootGeneratorService lootService)
    {
        _lootService = lootService ?? throw new ArgumentNullException(nameof(lootService));
    }

    /// <summary>
    /// List all available loot tables.
    /// </summary>
    /// <param name="limit">Maximum number of tables to return (default: 50)</param>
    /// <param name="offset">Number of tables to skip (default: 0)</param>
    /// <returns>Paginated list of loot tables</returns>
    /// <response code="200">List of loot tables</response>
    [HttpGet]
    [ProducesResponseType(typeof(LootTableListResult), 200)]
    public async Task<IActionResult> GetLootTables(
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        if (limit < 1 || limit > 100)
            limit = 50;
        if (offset < 0)
            offset = 0;

        var result = await _lootService.GetLootTablesAsync(limit, offset);
        return Ok(result);
    }

    /// <summary>
    /// Get detailed information about a specific loot table.
    /// Includes all entries with items, weights, and quantities.
    /// </summary>
    /// <param name="lootTableId">The loot table ID</param>
    /// <returns>Loot table details with entries</returns>
    /// <response code="200">Loot table details</response>
    /// <response code="404">Loot table not found</response>
    [HttpGet("{lootTableId}")]
    [ProducesResponseType(typeof(LootTableDetailsResult), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> GetLootTable(Guid lootTableId)
    {
        var result = await _lootService.GetLootTableAsync(lootTableId);

        if (result.IsFailure)
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = result.Error ?? "Loot table not found"
            });

        return Ok(result.Value);
    }

    /// <summary>
    /// Generate random items from a loot table.
    /// Uses weighted random selection based on entry weights.
    /// Generated items are automatically added to adventure inventory.
    /// </summary>
    /// <param name="lootTableId">The loot table ID to generate from</param>
    /// <param name="request">Generation request with adventure ID and count</param>
    /// <returns>List of generated items with dice roll results</returns>
    /// <response code="200">Items generated successfully</response>
    /// <response code="400">Invalid request (count out of range)</response>
    /// <response code="404">Loot table or adventure not found, or table has no entries</response>
    [HttpPost("{lootTableId}/generate")]
    [ProducesResponseType(typeof(GenerateLootResult), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> GenerateLoot(
        Guid lootTableId,
        [FromBody] GenerateLootRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse
            {
                Code = "VALIDATION_FAILED",
                Message = "Validation failed"
            });

        if (request.Count < 1 || request.Count > 10)
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = "Count must be between 1 and 10"
            });

        var result = await _lootService.GenerateAsync(lootTableId, request.AdventureId, request.Count);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true || result.Error?.Contains("no entries") == true)
                return NotFound(new ErrorResponse
                {
                    Code = "NOT_FOUND",
                    Message = result.Error
                });

            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = result.Error ?? "Failed to generate loot"
            });
        }

        return Ok(result.Value);
    }
}
