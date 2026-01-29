using System;
using System.ComponentModel.DataAnnotations;

namespace DiceEngine.API.Models;

/// <summary>
/// Request to generate loot from a loot table.
/// </summary>
public class GenerateLootRequest
{
    [Required]
    public Guid AdventureId { get; set; }

    [Range(1, 20, ErrorMessage = "Count must be between 1 and 20")]
    public int Count { get; set; } = 1;
}
