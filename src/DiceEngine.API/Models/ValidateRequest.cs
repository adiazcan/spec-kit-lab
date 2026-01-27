using System.ComponentModel.DataAnnotations;

namespace DiceEngine.API.Models;

public sealed class ValidateRequest
{
    [Required]
    [StringLength(255, MinimumLength = 3)]
    public string Expression { get; init; } = string.Empty;
}
