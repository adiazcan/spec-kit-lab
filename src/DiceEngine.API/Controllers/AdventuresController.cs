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

    /// <summary>
    /// Submit a player command/action to the game engine.
    /// </summary>
    /// <param name="id">Adventure unique identifier</param>
    /// <param name="request">Request containing the command string</param>
    /// <returns>Command result with narrative messages</returns>
    [HttpPost("{id}/actions")]
    [ProducesResponseType(typeof(CommandResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommandResult>> SubmitCommand(
        Guid id,
        [FromBody] CommandRequest request)
    {
        var adventure = await _adventureService.GetAsync(id);
        if (adventure == null)
            return NotFound();

        // Process command and generate response
        var result = ProcessCommand(request.Command, adventure);
        return Ok(result);
    }

    /// <summary>
    /// Process a player command and return the result.
    /// This is a simplified implementation - can be expanded with a full command parser.
    /// </summary>
    private CommandResult ProcessCommand(string? command, AdventureDto adventure)
    {
        var cmd = (command ?? "").Trim().ToLowerInvariant();
        
        return cmd switch
        {
            "help" => new CommandResult
            {
                Success = true,
                Message = "Available commands:\n• look - Examine your surroundings\n• inventory - Check your belongings\n• status - View your character status\n• go [direction] - Move in a direction\n• take [item] - Pick up an item\n• use [item] - Use an item\n• talk [character] - Talk to someone\n• attack [target] - Attack a target\n• help - Show this help message"
            },
            "look" => new CommandResult
            {
                Success = true,
                Message = $"You are in {adventure.CurrentSceneId}. The area stretches before you, full of possibilities and hidden dangers."
            },
            "inventory" => new CommandResult
            {
                Success = true,
                Message = "Your inventory is currently empty. Find items to collect on your adventure!"
            },
            "status" => new CommandResult
            {
                Success = true,
                Message = "You feel healthy and ready for adventure. HP: 10/10"
            },
            _ when cmd.StartsWith("go ") => new CommandResult
            {
                Success = true,
                Message = $"You head {cmd[3..]}. The path leads you onward..."
            },
            _ when cmd.StartsWith("take ") => new CommandResult
            {
                Success = true,
                Message = $"You attempt to take the {cmd[5..]}."
            },
            _ when cmd.StartsWith("use ") => new CommandResult
            {
                Success = true,
                Message = $"You use the {cmd[4..]}."
            },
            _ when cmd.StartsWith("talk ") => new CommandResult
            {
                Success = true,
                Message = $"You approach {cmd[5..]} and attempt to start a conversation."
            },
            _ when cmd.StartsWith("attack ") => new CommandResult
            {
                Success = true,
                Message = $"You ready your weapon and attack {cmd[7..]}!"
            },
            "" => new CommandResult
            {
                Success = false,
                Message = "Please enter a command. Type 'help' for available commands."
            },
            _ => new CommandResult
            {
                Success = true,
                Message = $"You try to '{command}'. The world responds to your action..."
            }
        };
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

/// <summary>
/// Request for submitting a player command.
/// </summary>
public class CommandRequest
{
    public string? Command { get; set; }
}

/// <summary>
/// Result of processing a player command.
/// </summary>
public class CommandResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public AdventureDto? AdventureState { get; set; }
    public List<NarrativeMessage>? NarrativeMessages { get; set; }
}

/// <summary>
/// A narrative message generated by the game engine.
/// </summary>
public class NarrativeMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = "narration";
    public string Content { get; set; } = string.Empty;
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
}
