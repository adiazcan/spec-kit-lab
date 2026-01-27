using System.Collections.Generic;

namespace DiceEngine.Application.Models;

/// <summary>
/// Request to create a new adventure.
/// </summary>
public class CreateAdventureRequest
{
    public string InitialSceneId { get; set; } = "scene_start";
    public Dictionary<string, object>? InitialGameState { get; set; }
}
