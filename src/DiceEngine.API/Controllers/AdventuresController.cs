using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdventuresController : ControllerBase
{
    private readonly IAdventureService _adventureService;

    public AdventuresController(IAdventureService adventureService)
    {
        _adventureService = adventureService;
    }

    /// <summary>
    /// Create a new adventure with initial scene and game state.
    /// </summary>
    /// <param name="request">Request containing initial scene ID and optional game state</param>
    /// <returns>Created adventure with generated ID and timestamps</returns>
    [HttpPost]
    [ProducesResponseType(typeof(AdventureDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdventureDto>> CreateAdventure(
        [FromBody] CreateAdventureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.InitialSceneId))
            return BadRequest("InitialSceneId is required");

        var adventure = await _adventureService.CreateAsync(request);
        return CreatedAtAction(nameof(GetAdventure), new { id = adventure.Id }, adventure);
    }

    /// <summary>
    /// Retrieve a specific adventure by ID.
    /// </summary>
    /// <param name="id">Adventure unique identifier</param>
    /// <returns>Adventure with all state information</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdventureDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdventureDto>> GetAdventure(Guid id)
    {
        var adventure = await _adventureService.GetAsync(id);
        if (adventure == null)
            return NotFound();

        return Ok(adventure);
    }

    /// <summary>
    /// List all adventures with pagination.
    /// </summary>
    /// <param name="page">Page number (1-indexed, default 1)</param>
    /// <param name="limit">Number of adventures per page (default 20, max 100)</param>
    /// <returns>Paginated list of adventures with metadata</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedAdventureResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedAdventureResponse>> ListAdventures(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        if (page < 1)
            return BadRequest("Page must be >= 1");

        if (limit < 1 || limit > 100)
            return BadRequest("Limit must be between 1 and 100");

        var adventures = await _adventureService.ListAsync(page, limit);
        var total = await _adventureService.GetTotalCountAsync();
        var hasMore = (page * limit) < total;

        return Ok(new PagedAdventureResponse
        {
            Adventures = adventures.ToList(),
            Total = total,
            Page = page,
            Limit = limit,
            HasMore = hasMore
        });
    }

    /// <summary>
    /// Update an adventure's current scene and game state.
    /// </summary>
    /// <param name="id">Adventure unique identifier</param>
    /// <param name="request">Request containing updated scene ID and game state</param>
    /// <returns>Updated adventure with new timestamp</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AdventureDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdventureDto>> UpdateAdventure(
        Guid id,
        [FromBody] UpdateAdventureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentSceneId))
            return BadRequest("CurrentSceneId is required");

        var adventure = await _adventureService.UpdateAsync(id, request);
        if (adventure == null)
            return NotFound();

        return Ok(adventure);
    }

    /// <summary>
    /// Delete an adventure by ID.
    /// </summary>
    /// <param name="id">Adventure unique identifier</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteAdventure(Guid id)
    {
        var success = await _adventureService.DeleteAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }
}

/// <summary>
/// Response wrapper for paginated adventure lists.
/// </summary>
public class PagedAdventureResponse
{
    public List<AdventureDto> Adventures { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public bool HasMore { get; set; }
}
