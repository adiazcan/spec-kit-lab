using System.ComponentModel.DataAnnotations;

namespace DiceEngine.Application.Models;

/// <summary>
/// Request model for creating a new character.
/// </summary>
public class CreateCharacterRequest
{
    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Range(3, 18)]
    public int StrBase { get; set; }

    [Required]
    [Range(3, 18)]
    public int DexBase { get; set; }

    [Required]
    [Range(3, 18)]
    public int IntBase { get; set; }

    [Required]
    [Range(3, 18)]
    public int ConBase { get; set; }

    [Required]
    [Range(3, 18)]
    public int ChaBase { get; set; }
}
