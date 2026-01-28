using System;

namespace DiceEngine.Application.Models;

/// <summary>
/// Data transfer object for character data.
/// </summary>
public class CharacterDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid AdventureId { get; set; }
    public CharacterAttributesDto Attributes { get; set; } = new();
    public uint Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastModifiedAt { get; set; }
}
