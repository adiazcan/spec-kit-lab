using System;
using System.ComponentModel.DataAnnotations;

namespace DiceEngine.API.Models;

/// <summary>
/// Request to add an item to adventure inventory.
/// </summary>
public class AddItemRequest
{
    [Required]
    public Guid ItemId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; } = 1;
}
