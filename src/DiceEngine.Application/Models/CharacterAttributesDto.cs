namespace DiceEngine.Application.Models;

/// <summary>
/// Contains all five character attributes with base values and modifiers.
/// </summary>
public class CharacterAttributesDto
{
    public AttributeValueDto Str { get; set; } = new();
    public AttributeValueDto Dex { get; set; } = new();
    public AttributeValueDto Int { get; set; } = new();
    public AttributeValueDto Con { get; set; } = new();
    public AttributeValueDto Cha { get; set; } = new();
}
