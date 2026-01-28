using System;
using System.Collections.Generic;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Character aggregate root representing a playable/non-playable game character.
/// Contains attributes, calculated modifiers, and associated snapshots.
/// </summary>
public class Character
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public Guid AdventureId { get; private set; }

    // Attributes (base values)
    public int StrBase { get; private set; }
    public int DexBase { get; private set; }
    public int IntBase { get; private set; }
    public int ConBase { get; private set; }
    public int ChaBase { get; private set; }

    // Computed properties for modifiers
    public int StrModifier => CalculateModifier(StrBase);
    public int DexModifier => CalculateModifier(DexBase);
    public int IntModifier => CalculateModifier(IntBase);
    public int ConModifier => CalculateModifier(ConBase);
    public int ChaModifier => CalculateModifier(ChaBase);

    // Metadata
    public DateTime CreatedAt { get; private set; }
    public DateTime LastModifiedAt { get; private set; }
    public uint Version { get; private set; }

    // Navigation
    public virtual ICollection<CharacterSnapshot> Snapshots { get; private set; } = new List<CharacterSnapshot>();

    // EF Core constructor
    private Character() { }

    /// <summary>
    /// Factory method for creating a new character with validation.
    /// </summary>
    public static Character Create(
        string name, Guid adventureId,
        int str, int dex, int intel, int con, int cha)
    {
        ValidateName(name);
        ValidateAttributeValue(str, nameof(str));
        ValidateAttributeValue(dex, nameof(dex));
        ValidateAttributeValue(intel, nameof(intel));
        ValidateAttributeValue(con, nameof(con));
        ValidateAttributeValue(cha, nameof(cha));

        var now = DateTime.UtcNow;
        return new Character
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            AdventureId = adventureId,
            StrBase = str,
            DexBase = dex,
            IntBase = intel,
            ConBase = con,
            ChaBase = cha,
            CreatedAt = now,
            LastModifiedAt = now,
            Version = 1
        };
    }

    /// <summary>
    /// Update character attributes with optimistic locking.
    /// </summary>
    public void UpdateAttributes(
        string? name = null,
        int? str = null, int? dex = null, int? intel = null,
        int? con = null, int? cha = null)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            ValidateName(name);
            Name = name.Trim();
        }

        if (str.HasValue)
        {
            ValidateAttributeValue(str.Value, nameof(str));
            StrBase = str.Value;
        }
        if (dex.HasValue)
        {
            ValidateAttributeValue(dex.Value, nameof(dex));
            DexBase = dex.Value;
        }
        if (intel.HasValue)
        {
            ValidateAttributeValue(intel.Value, nameof(intel));
            IntBase = intel.Value;
        }
        if (con.HasValue)
        {
            ValidateAttributeValue(con.Value, nameof(con));
            ConBase = con.Value;
        }
        if (cha.HasValue)
        {
            ValidateAttributeValue(cha.Value, nameof(cha));
            ChaBase = cha.Value;
        }

        LastModifiedAt = DateTime.UtcNow;
        Version++;
    }

    private static int CalculateModifier(int baseValue)
    {
        // D&D 5e modifier formula: (base - 10) / 2 with floor division
        return (int)Math.Floor((baseValue - 10.0) / 2.0);
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Character name cannot be empty.", nameof(name));

        if (name.Length > 255)
            throw new ArgumentException("Character name cannot exceed 255 characters.", nameof(name));
    }

    private static void ValidateAttributeValue(int value, string attributeName)
    {
        if (value < 3 || value > 18)
            throw new ArgumentException($"{attributeName} must be between 3 and 18, received {value}.", attributeName);
    }
}
