using System.ComponentModel.DataAnnotations;

namespace DiceEngine.Application.Models;

/// <summary>
/// Request model for updating character attributes with optimistic locking.
/// </summary>
public class UpdateCharacterRequest
{
    [StringLength(255, MinimumLength = 1)]
    public string? Name { get; set; }

    [Range(3, 18)]
    public int? StrBase { get; set; }

    [Range(3, 18)]
    public int? DexBase { get; set; }

    [Range(3, 18)]
    public int? IntBase { get; set; }

    [Range(3, 18)]
    public int? ConBase { get; set; }

    [Range(3, 18)]
    public int? ChaBase { get; set; }

    [Required]
    [Range(1, uint.MaxValue)]
    public uint Version { get; set; }
}
