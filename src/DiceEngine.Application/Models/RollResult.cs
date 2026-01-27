using System;
using System.Collections.Generic;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Models;

public sealed class RollResult
{
    public string Expression { get; init; } = string.Empty;
    public IReadOnlyList<int> IndividualRolls { get; init; } = Array.Empty<int>();
    public IReadOnlyDictionary<string, int[]> RollsByGroup { get; init; } = new Dictionary<string, int[]>();
    public IReadOnlyDictionary<string, int> SubtotalsByGroup { get; init; } = new Dictionary<string, int>();
    public int TotalModifier { get; init; }
    public int FinalTotal { get; init; }
    public bool IsAdvantage { get; init; }
    public bool IsDisadvantage { get; init; }
    public IReadOnlyList<RollResult>? AdvantageRollResults { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public RollMetadata? Metadata { get; init; }
}
