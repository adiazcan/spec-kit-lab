using System.ComponentModel.DataAnnotations;

namespace DiceEngine.API.Models;

public sealed class RollRequest
{
    [Required]
    public string Expression { get; init; } = string.Empty;
}
