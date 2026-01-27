namespace DiceEngine.API.Models;

public sealed class StatsResponse
{
    public string Expression { get; init; } = string.Empty;
    public int Minimum { get; init; }
    public int Maximum { get; init; }
    public double Mean { get; init; }
    public double StandardDeviation { get; init; }
    public int? Mode { get; init; }
    public int? Median { get; init; }
}
