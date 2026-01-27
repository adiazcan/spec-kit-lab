using System;
using System.Collections.Generic;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents a text adventure instance and serves as the aggregate root for adventure state management.
/// </summary>
public class Adventure
{
    public Guid Id { get; private set; }
    public string CurrentSceneId { get; private set; } = string.Empty;
    public Dictionary<string, object> GameState { get; private set; } = new();
    public DateTime CreatedAt { get; private set; }
    public DateTime LastUpdatedAt { get; private set; }

    // Constructor for EF Core (parameterless)
    public Adventure() { }

    /// <summary>
    /// Factory method for creating new adventures with default initialization.
    /// </summary>
    public static Adventure Create(
        string initialSceneId,
        Dictionary<string, object>? initialGameState = null)
    {
        if (string.IsNullOrWhiteSpace(initialSceneId))
            throw new ArgumentException("Scene ID required", nameof(initialSceneId));

        var now = DateTime.UtcNow;
        return new Adventure
        {
            Id = Guid.NewGuid(),
            CurrentSceneId = initialSceneId,
            GameState = initialGameState ?? new Dictionary<string, object>(),
            CreatedAt = now,
            LastUpdatedAt = now
        };
    }

    /// <summary>
    /// Updates the scene and game state with a new timestamp.
    /// </summary>
    public void UpdateState(string sceneId, Dictionary<string, object> gameState)
    {
        if (string.IsNullOrWhiteSpace(sceneId))
            throw new ArgumentException("Scene ID required", nameof(sceneId));

        CurrentSceneId = sceneId;
        GameState = gameState ?? new Dictionary<string, object>();
        LastUpdatedAt = DateTime.UtcNow;
    }
}
