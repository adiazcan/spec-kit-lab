namespace DiceEngine.API.Models;

public sealed class ValidateResponse
{
    public bool IsValid { get; init; }
    public string OriginalExpression { get; init; } = string.Empty;
    public ParsedComponents? ParsedComponents { get; init; }
    public int? ExpectedMinimum { get; init; }
    public int? ExpectedMaximum { get; init; }
    public string? Message { get; init; }
}

public sealed class ParsedComponents
{
    public List<DiceRollComponent> DiceRolls { get; init; } = new();
    public int GlobalModifier { get; init; }
    public bool HasAdvantage { get; init; }
    public bool HasDisadvantage { get; init; }
}

public sealed class DiceRollComponent
{
    public int NumberOfDice { get; init; }
    public int SidesPerDie { get; init; }
    public int Modifier { get; init; }
}
