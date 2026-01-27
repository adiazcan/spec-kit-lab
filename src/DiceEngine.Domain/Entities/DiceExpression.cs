using System;
using System.Collections.Generic;
using System.Linq;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

public sealed class DiceExpression
{
    public DiceExpression(
        string originalExpression,
        IReadOnlyList<DiceRoll> diceRolls,
        IReadOnlyList<int>? modifiers = null,
        bool hasAdvantage = false,
        bool hasDisadvantage = false)
    {
        if (string.IsNullOrWhiteSpace(originalExpression))
        {
            throw new ArgumentException("Expression cannot be empty.", nameof(originalExpression));
        }

        if (originalExpression.Length > 255)
        {
            throw new ArgumentOutOfRangeException(nameof(originalExpression), "Expression length cannot exceed 255 characters.");
        }

        DiceRolls = diceRolls ?? throw new ArgumentNullException(nameof(diceRolls));
        if (!DiceRolls.Any())
        {
            throw new ArgumentException("At least one dice roll is required.", nameof(diceRolls));
        }

        if (DiceRolls.Count > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(diceRolls), "Number of dice groups must be between 1 and 100.");
        }

        if (hasAdvantage && hasDisadvantage)
        {
            throw new ArgumentException("Cannot have both advantage and disadvantage enabled.");
        }

        OriginalExpression = originalExpression;
        Modifiers = modifiers?.ToArray() ?? Array.Empty<int>();
        HasAdvantage = hasAdvantage;
        HasDisadvantage = hasDisadvantage;

        // Ensure defensive copy for dice rolls to keep immutability expectations.
        DiceRolls = DiceRolls.ToArray();
    }

    public string OriginalExpression { get; }

    public IReadOnlyList<DiceRoll> DiceRolls { get; }

    public IReadOnlyList<int> Modifiers { get; }

    public bool HasAdvantage { get; }

    public bool HasDisadvantage { get; }

    public int TotalModifier => Modifiers.Sum() + DiceRolls.Sum(roll => roll.Modifier);
}
