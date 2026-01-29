using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for granting quest rewards.
/// </summary>
public interface IRewardService
{
    /// <summary>
    /// Grants rewards to a player upon completion.
    /// </summary>
    Task<List<RewardDto>> GrantRewardsAsync(
        Guid playerId,
        IEnumerable<RewardDto> rewards,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates that rewards can be granted (e.g., inventory space).
    /// </summary>
    Task<(bool CanGrant, string? Reason)> ValidateRewardsAsync(
        Guid playerId,
        IEnumerable<RewardDto> rewards,
        CancellationToken cancellationToken = default);
}
