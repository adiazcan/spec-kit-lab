using System;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Immutable point-in-time capture of a character's state (game save).
/// </summary>
public class CharacterSnapshot
{
    public Guid Id { get; private set; }
    public Guid CharacterId { get; private set; }
    public string Label { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    // Captured attribute state
    public int StrBase { get; private set; }
    public int DexBase { get; private set; }
    public int IntBase { get; private set; }
    public int ConBase { get; private set; }
    public int ChaBase { get; private set; }

    // Captured modifiers for historical reference
    public int StrModifier { get; private set; }
    public int DexModifier { get; private set; }
    public int IntModifier { get; private set; }
    public int ConModifier { get; private set; }
    public int ChaModifier { get; private set; }

    // Navigation
    public virtual Character Character { get; private set; } = null!;

    // EF Core constructor
    private CharacterSnapshot() { }

    /// <summary>
    /// Factory method to capture character state at current moment.
    /// </summary>
    public static CharacterSnapshot CreateFromCharacter(Character character, string? label = null)
    {
        if (character == null)
            throw new ArgumentNullException(nameof(character));

        return new CharacterSnapshot
        {
            Id = Guid.NewGuid(),
            CharacterId = character.Id,
            Label = label?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            StrBase = character.StrBase,
            DexBase = character.DexBase,
            IntBase = character.IntBase,
            ConBase = character.ConBase,
            ChaBase = character.ChaBase,
            StrModifier = character.StrModifier,
            DexModifier = character.DexModifier,
            IntModifier = character.IntModifier,
            ConModifier = character.ConModifier,
            ChaModifier = character.ChaModifier
        };
    }
}
