namespace DiceEngine.Domain.ValueObjects;

public sealed record RollMetadata(double ExecutionTimeMs = 0, string RngAlgorithm = "RandomNumberGenerator", bool IsCached = false);
