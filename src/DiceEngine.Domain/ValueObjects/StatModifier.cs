using System;

namespace DiceEngine.Domain.ValueObjects;

/// <summary>
/// Represents a single stat modification applied by an item (e.g., +2 Defense, +1 Attack).
/// Value object - immutable and equality based on properties.
/// </summary>
public record StatModifier
{
    public string StatName { get; init; } = string.Empty;
    public int Value { get; init; }

    public StatModifier() { } // EF Core

    public StatModifier(string statName, int value)
    {
        if (string.IsNullOrWhiteSpace(statName))
            throw new ArgumentException("StatName is required", nameof(statName));

        StatName = statName;
        Value = value;
    }
}
