namespace DiceEngine.Domain.ValueObjects;

public sealed record DiceRoll
{
    public DiceRoll(int numberOfDice, int sidesPerDie, int modifier = 0)
    {
        if (numberOfDice < 1 || numberOfDice > 1000)
        {
            throw new ArgumentOutOfRangeException(nameof(numberOfDice), "Number of dice must be between 1 and 1000.");
        }

        if (sidesPerDie < 1 || sidesPerDie > 1000)
        {
            throw new ArgumentOutOfRangeException(nameof(sidesPerDie), "Sides per die must be between 1 and 1000.");
        }

        if (modifier < -1000 || modifier > 1000)
        {
            throw new ArgumentOutOfRangeException(nameof(modifier), "Modifier must be between -1000 and 1000.");
        }

        NumberOfDice = numberOfDice;
        SidesPerDie = sidesPerDie;
        Modifier = modifier;
    }

    public int NumberOfDice { get; }

    public int SidesPerDie { get; }

    public int Modifier { get; }

    public int MinimumRoll => NumberOfDice + Modifier;
    public int MaximumRoll => (NumberOfDice * SidesPerDie) + Modifier;
}
