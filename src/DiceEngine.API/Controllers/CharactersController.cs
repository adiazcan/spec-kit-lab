using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Controller for character management operations.
/// </summary>
[ApiController]
[Route("api/adventures/{adventureId}/characters")]
public class CharactersController : ControllerBase
{
    private readonly ICharacterService _characterService;

    public CharactersController(ICharacterService characterService)
    {
        _characterService = characterService ?? throw new ArgumentNullException(nameof(characterService));
    }

    /// <summary>
    /// Create a new character for an adventure.
    /// </summary>
    /// <param name="adventureId">The adventure ID to create character in</param>
    /// <param name="request">Character creation request with name and attributes</param>
    /// <returns>The created character with calculated modifiers</returns>
    /// <response code="201">Character successfully created</response>
    /// <response code="400">Invalid request (validation failure)</response>
    /// <response code="404">Adventure not found</response>
    [HttpPost]
    [ProducesResponseType(typeof(CharacterDto), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> CreateCharacter(
        Guid adventureId, [FromBody] CreateCharacterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse
            {
                Code = "VALIDATION_FAILED",
                Message = "Validation failed"
            });

        try
        {
            var character = await _characterService.CreateAsync(adventureId, request);
            return CreatedAtAction(nameof(GetCharacter),
                new { adventureId, characterId = character.Id }, character);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = ex.Message
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// List all characters for an adventure with pagination.
    /// </summary>
    /// <param name="adventureId">The adventure ID to list characters for</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 20, max: 100)</param>
    /// <returns>Paginated list of characters</returns>
    /// <response code="200">List of characters for the adventure</response>
    [HttpGet]
    [ProducesResponseType(typeof(CharacterListResponse), 200)]
    public async Task<IActionResult> ListCharacters(
        Guid adventureId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var response = await _characterService.ListAsync(adventureId, page, pageSize);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Retrieve a specific character with all attributes and modifiers.
    /// </summary>
    /// <param name="adventureId">The adventure ID</param>
    /// <param name="characterId">The character ID</param>
    /// <returns>Character details with calculated modifiers</returns>
    /// <response code="200">Character details</response>
    /// <response code="404">Character or adventure not found</response>
    [HttpGet("{characterId}")]
    [ProducesResponseType(typeof(CharacterDto), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> GetCharacter(Guid adventureId, Guid characterId)
    {
        try
        {
            var character = await _characterService.GetAsync(characterId);
            if (character.AdventureId != adventureId)
                return NotFound(new ErrorResponse
                {
                    Code = "NOT_FOUND",
                    Message = "Character not found in this adventure."
                });

            return Ok(character);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Update character attributes with automatic modifier recalculation.
    /// </summary>
    /// <param name="adventureId">The adventure ID</param>
    /// <param name="characterId">The character ID</param>
    /// <param name="request">Update request with optional name and attributes, plus version for optimistic locking</param>
    /// <returns>Updated character with recalculated modifiers</returns>
    /// <response code="200">Character successfully updated</response>
    /// <response code="400">Invalid request or validation failure</response>
    /// <response code="404">Character not found</response>
    /// <response code="409">Conflict - character has been modified (version mismatch)</response>
    [HttpPut("{characterId}")]
    [ProducesResponseType(typeof(CharacterDto), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 409)]
    public async Task<IActionResult> UpdateCharacter(
        Guid adventureId, Guid characterId, [FromBody] UpdateCharacterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse
            {
                Code = "VALIDATION_FAILED",
                Message = "Validation failed"
            });

        try
        {
            var updated = await _characterService.UpdateAsync(characterId, request);
            if (updated.AdventureId != adventureId)
                return NotFound(new ErrorResponse
                {
                    Code = "NOT_FOUND",
                    Message = "Character not found in this adventure."
                });

            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = ex.Message
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("modified"))
        {
            return Conflict(new ErrorResponse
            {
                Code = "CONFLICT",
                Message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Delete a character and all associated snapshots.
    /// </summary>
    /// <param name="adventureId">The adventure ID</param>
    /// <param name="characterId">The character ID</param>
    /// <returns>No content on success</returns>
    /// <response code="204">Character successfully deleted</response>
    /// <response code="404">Character not found</response>
    [HttpDelete("{characterId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> DeleteCharacter(Guid adventureId, Guid characterId)
    {
        try
        {
            await _characterService.DeleteAsync(characterId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Create a character snapshot (save point) capturing current state.
    /// </summary>
    /// <param name="characterId">The character ID</param>
    /// <param name="request">Snapshot creation request with optional label</param>
    /// <returns>Created snapshot with captured attributes and modifiers</returns>
    /// <response code="201">Snapshot successfully created</response>
    /// <response code="404">Character not found</response>
    [HttpPost("/api/characters/{characterId}/snapshots")]
    [ProducesResponseType(typeof(CharacterSnapshotDto), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> CreateSnapshot(
        Guid characterId, [FromBody] CreateSnapshotRequest request)
    {
        try
        {
            var snapshot = await _characterService.CreateSnapshotAsync(characterId, request?.Label);
            return CreatedAtAction(nameof(GetSnapshot),
                new { characterId, snapshotId = snapshot.Id }, snapshot);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// List character snapshots in reverse chronological order.
    /// </summary>
    /// <param name="characterId">The character ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 50, max: 100)</param>
    /// <returns>Paginated list of snapshots</returns>
    /// <response code="200">List of character snapshots</response>
    [HttpGet("/api/characters/{characterId}/snapshots")]
    [ProducesResponseType(typeof(SnapshotListResponse), 200)]
    public async Task<IActionResult> ListSnapshots(
        Guid characterId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var response = await _characterService.ListSnapshotsAsync(characterId, page, pageSize);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Retrieve a specific snapshot by ID.
    /// </summary>
    /// <param name="characterId">The character ID</param>
    /// <param name="snapshotId">The snapshot ID</param>
    /// <returns>Snapshot details with captured state</returns>
    /// <response code="200">Snapshot details</response>
    /// <response code="404">Snapshot or character not found</response>
    [HttpGet("/api/characters/{characterId}/snapshots/{snapshotId}")]
    [ProducesResponseType(typeof(CharacterSnapshotDto), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> GetSnapshot(Guid characterId, Guid snapshotId)
    {
        try
        {
            var snapshot = await _characterService.GetSnapshotAsync(characterId, snapshotId);
            return Ok(snapshot);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = ex.Message
            });
        }
    }
}
