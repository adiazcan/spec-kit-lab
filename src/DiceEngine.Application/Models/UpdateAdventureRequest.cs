using System.Collections.Generic;

namespace DiceEngine.Application.Models;

/// <summary>
/// Request to update an adventure's scene and state.
/// </summary>
public class UpdateAdventureRequest
{
    public string CurrentSceneId { get; set; } = string.Empty;
    public Dictionary<string, object>? GameState { get; set; }
}
