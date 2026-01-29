using System;
using System.ComponentModel.DataAnnotations;

namespace DiceEngine.API.Models;

/// <summary>
/// Request to equip an item to a character slot.
/// </summary>
public class EquipItemRequest
{
    [Required]
    public Guid ItemId { get; set; }

    [Required]
    public Guid AdventureId { get; set; }
}
