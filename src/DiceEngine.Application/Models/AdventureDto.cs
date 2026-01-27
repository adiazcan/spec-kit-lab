using System;
using System.Collections.Generic;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Models;

/// <summary>
/// Data transfer object for Adventure API responses.
/// </summary>
public class AdventureDto
{
    public Guid Id { get; set; }
    public string CurrentSceneId { get; set; } = string.Empty;
    public Dictionary<string, object> GameState { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime LastUpdatedAt { get; set; }

    public static AdventureDto FromEntity(Adventure adventure) => new()
    {
        Id = adventure.Id,
        CurrentSceneId = adventure.CurrentSceneId,
        GameState = adventure.GameState,
        CreatedAt = adventure.CreatedAt,
        LastUpdatedAt = adventure.LastUpdatedAt
    };
}
