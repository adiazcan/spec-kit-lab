using System;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Controller for adventure inventory management.
/// </summary>
[ApiController]
[Route("api/adventures/{adventureId}/inventory")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
    }

    /// <summary>
    /// Get all items in an adventure's inventory.
    /// </summary>
    /// <param name="adventureId">The adventure ID</param>
    /// <param name="limit">Maximum number of entries to return (default: 50, max: 100)</param>
    /// <param name="offset">Number of entries to skip (default: 0)</param>
    /// <returns>Paginated list of inventory items</returns>
    /// <response code="200">Inventory contents</response>
    [HttpGet]
    [ProducesResponseType(typeof(InventoryResult), 200)]
    public async Task<IActionResult> GetInventory(
        Guid adventureId,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        if (limit < 1 || limit > 100)
            limit = 50;
        if (offset < 0)
            offset = 0;

        var result = await _inventoryService.GetInventoryAsync(adventureId, limit, offset);
        return Ok(result);
    }

    /// <summary>
    /// Add an item to the adventure's inventory.
    /// Stackable items will merge with existing stacks up to max stack size.
    /// </summary>
    /// <param name="adventureId">The adventure ID</param>
    /// <param name="request">Add item request with item ID and quantity</param>
    /// <returns>Result of item addition with entry details</returns>
    /// <response code="201">Item successfully added to inventory</response>
    /// <response code="400">Invalid request (item not found, quantity invalid, or stack overflow)</response>
    /// <response code="404">Adventure not found</response>
    [HttpPost]
    [ProducesResponseType(typeof(AddItemResult), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> AddItem(
        Guid adventureId,
        [FromBody] AddItemRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse
            {
                Code = "VALIDATION_FAILED",
                Message = "Validation failed"
            });

        var result = await _inventoryService.AddItemAsync(adventureId, request.ItemId, request.Quantity);

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
                Message = result.Error ?? "Failed to add item"
            });
        }

        return CreatedAtAction(nameof(GetInventory), new { adventureId }, result.Value);
    }

    /// <summary>
    /// Remove quantity from an inventory entry.
    /// Entry is deleted when quantity reaches zero.
    /// </summary>
    /// <param name="adventureId">The adventure ID</param>
    /// <param name="entryId">The inventory entry ID</param>
    /// <param name="quantity">Quantity to remove (default: removes entire entry)</param>
    /// <returns>No content on success</returns>
    /// <response code="204">Item quantity removed (or entry deleted)</response>
    /// <response code="400">Invalid quantity or insufficient stock</response>
    /// <response code="404">Inventory entry not found</response>
    [HttpDelete("{entryId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> RemoveItem(
        Guid adventureId,
        Guid entryId,
        [FromQuery] int quantity = 1)
    {
        var result = await _inventoryService.RemoveItemAsync(adventureId, entryId, quantity);

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
                Message = result.Error ?? "Failed to remove item"
            });
        }

        return NoContent();
    }
}
