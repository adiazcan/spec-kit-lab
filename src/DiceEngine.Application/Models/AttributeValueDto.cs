namespace DiceEngine.Application.Models;

/// <summary>
/// Represents a single attribute with base value and calculated modifier.
/// </summary>
public class AttributeValueDto
{
    public int Base { get; set; }
    public int Modifier { get; set; }
}
