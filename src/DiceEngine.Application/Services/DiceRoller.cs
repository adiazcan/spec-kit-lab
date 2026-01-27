using System.Diagnostics;
using System.Security.Cryptography;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

public class DiceRoller : IDiceRoller
{
    private readonly RandomNumberGenerator _rng;

    public DiceRoller(RandomNumberGenerator? rng = null)
    {
        _rng = rng ?? RandomNumberGenerator.Create();
    }

    public RollResult Roll(DiceExpression expression)
    {
        // T091: Dispatch to advantage/disadvantage methods based on flags
        if (expression.HasAdvantage)
        {
            return RollAdvantage(expression);
        }

        if (expression.HasDisadvantage)
        {
            return RollDisadvantage(expression);
        }

        return RollCore(expression, isAdvantage: false, isDisadvantage: false);
    }

    public RollResult RollAdvantage(DiceExpression expression)
    {
        // T089: Roll twice, select higher, store both in AdvantageRollResults
        var roll1 = RollCore(expression, isAdvantage: false, isDisadvantage: false);
        var roll2 = RollCore(expression, isAdvantage: false, isDisadvantage: false);

        // Select the roll with the higher final total
        var selectedRoll = roll1.FinalTotal >= roll2.FinalTotal ? roll1 : roll2;

        // Return a new result with advantage flag and both rolls stored
        return new RollResult
        {
            Expression = selectedRoll.Expression,
            IndividualRolls = selectedRoll.IndividualRolls,
            RollsByGroup = selectedRoll.RollsByGroup,
            SubtotalsByGroup = selectedRoll.SubtotalsByGroup,
            TotalModifier = selectedRoll.TotalModifier,
            FinalTotal = selectedRoll.FinalTotal,
            IsAdvantage = true,
            IsDisadvantage = false,
            AdvantageRollResults = new[] { roll1, roll2 },
            Timestamp = DateTime.UtcNow,
            Metadata = selectedRoll.Metadata
        };
    }

    public RollResult RollDisadvantage(DiceExpression expression)
    {
        // T090: Roll twice, select lower, store both in AdvantageRollResults
        var roll1 = RollCore(expression, isAdvantage: false, isDisadvantage: false);
        var roll2 = RollCore(expression, isAdvantage: false, isDisadvantage: false);

        // Select the roll with the lower final total
        var selectedRoll = roll1.FinalTotal <= roll2.FinalTotal ? roll1 : roll2;

        // Return a new result with disadvantage flag and both rolls stored
        return new RollResult
        {
            Expression = selectedRoll.Expression,
            IndividualRolls = selectedRoll.IndividualRolls,
            RollsByGroup = selectedRoll.RollsByGroup,
            SubtotalsByGroup = selectedRoll.SubtotalsByGroup,
            TotalModifier = selectedRoll.TotalModifier,
            FinalTotal = selectedRoll.FinalTotal,
            IsAdvantage = false,
            IsDisadvantage = true,
            AdvantageRollResults = new[] { roll1, roll2 },
            Timestamp = DateTime.UtcNow,
            Metadata = selectedRoll.Metadata
        };
    }

    private RollResult RollCore(DiceExpression expression, bool isAdvantage, bool isDisadvantage)
    {
        var stopwatch = Stopwatch.StartNew();

        var rollsByGroup = new Dictionary<string, int[]>();
        var subtotalsByGroup = new Dictionary<string, int>();
        var individualRolls = new List<int>();

        foreach (var diceRoll in expression.DiceRolls)
        {
            var groupKey = $"{diceRoll.NumberOfDice}d{diceRoll.SidesPerDie}";
            var groupRolls = new int[diceRoll.NumberOfDice];
            var subtotal = 0;

            for (var i = 0; i < diceRoll.NumberOfDice; i++)
            {
                var roll = NextRoll(diceRoll.SidesPerDie);
                groupRolls[i] = roll;
                individualRolls.Add(roll);
                subtotal += roll;
            }

            rollsByGroup[groupKey] = groupRolls;
            subtotalsByGroup[groupKey] = subtotal;
        }

        var totalModifier = expression.TotalModifier;
        var finalTotal = subtotalsByGroup.Values.Sum() + totalModifier;

        stopwatch.Stop();

        return new RollResult
        {
            Expression = expression.OriginalExpression,
            IndividualRolls = individualRolls,
            RollsByGroup = rollsByGroup,
            SubtotalsByGroup = subtotalsByGroup,
            TotalModifier = totalModifier,
            FinalTotal = finalTotal,
            IsAdvantage = isAdvantage,
            IsDisadvantage = isDisadvantage,
            AdvantageRollResults = null,
            Timestamp = DateTime.UtcNow,
            Metadata = new RollMetadata(stopwatch.Elapsed.TotalMilliseconds, _rng.GetType().Name, false)
        };
    }

    private int NextRoll(int sides)
    {
        Span<byte> buffer = stackalloc byte[4];
        _rng.GetBytes(buffer);
        var value = BitConverter.ToUInt32(buffer);
        return (int)(value % (uint)sides) + 1;
    }
}
