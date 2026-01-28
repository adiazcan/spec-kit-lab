using System;

namespace DiceEngine.Application.Models;

/// <summary>
/// Data transfer object for character snapshot data.
/// </summary>
public class CharacterSnapshotDto
{
    public Guid Id { get; set; }
    public Guid CharacterId { get; set; }
    public string Label { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public CharacterAttributesDto Attributes { get; set; } = new();
}
