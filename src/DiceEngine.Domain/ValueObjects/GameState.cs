using System.Collections.Generic;

namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Represents the flexible game state of an adventure.
/// Stored as JSONB in the database but treated as an immutable value object in the domain.
/// </summary>
public class GameState
{
    public Dictionary<string, object> Data { get; }

    public GameState(Dictionary<string, object>? data = null)
    {
        Data = data ?? new Dictionary<string, object>();
    }

    public object? GetValue(string key) =>
        Data.ContainsKey(key) ? Data[key] : null;

    public void SetValue(string key, object value) =>
        Data[key] = value;
}
