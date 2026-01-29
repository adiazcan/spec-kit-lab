namespace DiceEngine.Application.Models;

/// <summary>
/// Reward information.
/// </summary>
public class RewardDto
{
    public Guid RewardId { get; set; }
    public string Type { get; set; } = string.Empty;
    public int Amount { get; set; }
    public string? ItemId { get; set; }
    public string? ItemName { get; set; }
    public string? Description { get; set; }
}
