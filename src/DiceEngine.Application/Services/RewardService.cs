using DiceEngine.Application.Models;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for granting quest rewards.
/// </summary>
public class RewardService : IRewardService
{
    private readonly IInventoryService? _inventoryService;
    private readonly ICharacterService? _characterService;

    public RewardService(
        IInventoryService? inventoryService = null,
        ICharacterService? characterService = null)
    {
        _inventoryService = inventoryService;
        _characterService = characterService;
    }

    public async Task<List<RewardDto>> GrantRewardsAsync(
        Guid playerId,
        IEnumerable<RewardDto> rewards,
        CancellationToken cancellationToken = default)
    {
        var grantedRewards = new List<RewardDto>();

        foreach (var reward in rewards)
        {
            switch (reward.Type)
            {
                case "Experience":
                    // Add experience to character (if character service available)
                    if (_characterService != null)
                    {
                        // Note: This would require adding an AddExperience method to ICharacterService
                        // For now, we'll just track that the reward was granted
                    }
                    grantedRewards.Add(reward);
                    break;

                case "Item":
                    // Add item to inventory (if inventory service available)
                    if (_inventoryService != null && !string.IsNullOrEmpty(reward.ItemId))
                    {
                        // Note: This would require adapting inventory service API for quest rewards
                        // For now, we'll just track that the reward was granted
                    }
                    grantedRewards.Add(reward);
                    break;

                case "Currency":
                    // Add currency to player (would need player/economy service)
                    grantedRewards.Add(reward);
                    break;

                case "Achievement":
                    // Grant achievement (would need achievement service)
                    grantedRewards.Add(reward);
                    break;

                default:
                    throw new InvalidOperationException($"Unknown reward type: {reward.Type}");
            }
        }

        return grantedRewards;
    }

    public async Task<(bool CanGrant, string? Reason)> ValidateRewardsAsync(
        Guid playerId,
        IEnumerable<RewardDto> rewards,
        CancellationToken cancellationToken = default)
    {
        // Check if player has inventory space for items
        var itemRewards = rewards.Where(r => r.Type == "Item").ToList();
        if (itemRewards.Any() && _inventoryService != null)
        {
            // Note: Would need to check inventory capacity
            // For now, assume rewards can always be granted
        }

        return await Task.FromResult((true, null as string));
    }
}
