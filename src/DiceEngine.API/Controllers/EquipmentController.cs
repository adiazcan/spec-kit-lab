using System;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Controller for character equipment management.
/// </summary>
[ApiController]
[Route("api/characters/{characterId}/equipment")]
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;

    public EquipmentController(IEquipmentService equipmentService)
    {
        _equipmentService = equipmentService ?? throw new ArgumentNullException(nameof(equipmentService));
    }

    /// <summary>
    /// Get all equipment slots for a character.
    /// Returns all 7 slots with equipped items and total stat modifiers.
    /// </summary>
    /// <param name="characterId">The character ID</param>
    /// <returns>Equipment slots with items and calculated modifier totals</returns>
    /// <response code="200">Equipment slot details</response>
    /// <response code="404">Character not found</response>
    [HttpGet]
    [ProducesResponseType(typeof(EquipmentResult), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> GetEquipment(Guid characterId)
    {
        var result = await _equipmentService.GetEquipmentAsync(characterId);

        if (result.IsFailure)
            return NotFound(new ErrorResponse
            {
                Code = "NOT_FOUND",
                Message = result.Error ?? "Character not found"
            });

        return Ok(result.Value);
    }

    /// <summary>
    /// Equip an item from inventory to a character's equipment slot.
    /// If slot already has an item, the previous item is returned to inventory.
    /// </summary>
    /// <param name="characterId">The character ID</param>
    /// <param name="slotType">Equipment slot (Head, Chest, Legs, Feet, Hands, MainHand, OffHand)</param>
    /// <param name="request">Equip request with item ID and adventure ID</param>
    /// <returns>Updated slot with equipped item</returns>
    /// <response code="200">Item successfully equipped</response>
    /// <response code="400">Invalid request (item not equippable, wrong slot type, not in inventory)</response>
    /// <response code="404">Character or item not found</response>
    [HttpPut("{slotType}")]
    [ProducesResponseType(typeof(EquipItemResult), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> EquipItem(
        Guid characterId,
        string slotType,
        [FromBody] EquipItemRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse
            {
                Code = "VALIDATION_FAILED",
                Message = "Validation failed"
            });

        var result = await _equipmentService.EquipItemAsync(
            characterId, slotType, request.ItemId, request.AdventureId);

        if (result.IsFailure)
        {
            if (result.Error?.Contains("not found") == true)
                return NotFound(new ErrorResponse
                {
                    Code = "NOT_FOUND",
                    Message = result.Error
                });

            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = result.Error ?? "Failed to equip item"
            });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Unequip an item from a character's equipment slot.
    /// The item is returned to the adventure's inventory.
    /// </summary>
    /// <param name="characterId">The character ID</param>
    /// <param name="slotType">Equipment slot to clear</param>
    /// <param name="adventureId">Adventure ID to return item to inventory</param>
    /// <returns>Details of unequipped item</returns>
    /// <response code="200">Item successfully unequipped (or slot was already empty)</response>
    /// <response code="400">Invalid slot type</response>
    [HttpDelete("{slotType}")]
    [ProducesResponseType(typeof(UnequipItemResult), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<IActionResult> UnequipItem(
        Guid characterId,
        string slotType,
        [FromQuery] Guid adventureId)
    {
        var result = await _equipmentService.UnequipItemAsync(characterId, slotType, adventureId);

        if (result.IsFailure)
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = result.Error ?? "Failed to unequip item"
            });

        return Ok(result.Value);
    }
}
