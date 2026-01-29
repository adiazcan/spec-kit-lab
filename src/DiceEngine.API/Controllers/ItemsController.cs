using System;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Controller for item catalog management (admin operations).
/// </summary>
[ApiController]
[Route("api/items")]
public class ItemsController : ControllerBase
{
    private readonly IItemService _itemService;

    public ItemsController(IItemService itemService)
    {
        _itemService = itemService ?? throw new ArgumentNullException(nameof(itemService));
    }

    /// <summary>
    /// List all items in the catalog with optional filtering.
    /// </summary>
    /// <param name="type">Filter by item type (stackable, unique)</param>
    /// <param name="rarity">Filter by rarity (Common, Uncommon, Rare, Epic, Legendary)</param>
    /// <param name="limit">Maximum number of items to return (default: 50)</param>
    /// <param name="offset">Number of items to skip (default: 0)</param>
    /// <returns>Paginated list of items</returns>
    /// <response code="200">List of items</response>
    [HttpGet]
    [ProducesResponseType(typeof(ItemListResult), 200)]
    public async Task<IActionResult> GetItems(
        [FromQuery] string? type = null,
        [FromQuery] string? rarity = null,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        if (limit < 1 || limit > 100)
            limit = 50;
        if (offset < 0)
            offset = 0;

        var result = await _itemService.GetItemsAsync(type, rarity, limit, offset);
        return Ok(result);
    }

    /// <summary>
    /// Create a new stackable item in the catalog.
    /// Stackable items can be stacked in inventory up to MaxStackSize.
    /// </summary>
    /// <param name="request">Stackable item creation request</param>
    /// <returns>Created stackable item</returns>
    /// <response code="201">Stackable item created successfully</response>
    /// <response code="400">Invalid request (validation failure)</response>
    [HttpPost("stackable")]
    [ProducesResponseType(typeof(StackableItemResult), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<IActionResult> CreateStackableItem(
        [FromBody] CreateStackableItemRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse
            {
                Code = "VALIDATION_FAILED",
                Message = "Validation failed"
            });

        var result = await _itemService.CreateStackableItemAsync(
            request.Name, request.Description, request.Rarity, request.MaxStackSize);

        if (result.IsFailure)
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = result.Error ?? "Failed to create item"
            });

        return CreatedAtAction(nameof(GetItems), null, result.Value);
    }

    /// <summary>
    /// Create a new unique item in the catalog.
    /// Unique items can have equipment slots and stat modifiers.
    /// </summary>
    /// <param name="request">Unique item creation request</param>
    /// <returns>Created unique item</returns>
    /// <response code="201">Unique item created successfully</response>
    /// <response code="400">Invalid request (validation failure)</response>
    [HttpPost("unique")]
    [ProducesResponseType(typeof(UniqueItemResult), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    public async Task<IActionResult> CreateUniqueItem(
        [FromBody] CreateUniqueItemRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse
            {
                Code = "VALIDATION_FAILED",
                Message = "Validation failed"
            });

        // Map API DTOs to Application models
        var modifiers = request.Modifiers?
            .Select(m => new StatModifierRequest
            {
                StatName = m.StatName,
                Value = m.Value
            })
            .ToList();

        var result = await _itemService.CreateUniqueItemAsync(
            request.Name, request.Description, request.Rarity, request.SlotType, modifiers);

        if (result.IsFailure)
            return BadRequest(new ErrorResponse
            {
                Code = "INVALID_REQUEST",
                Message = result.Error ?? "Failed to create item"
            });

        return CreatedAtAction(nameof(GetItems), null, result.Value);
    }
}
