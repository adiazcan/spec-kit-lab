namespace DiceEngine.API.Models;

/// <summary>
/// Request to create a new enemy template
/// </summary>
public class CreateEnemyRequest
{
    /// <summary>
    /// Enemy name/title
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Enemy description/flavor text
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Strength attribute (3-18)
    /// </summary>
    public int Strength { get; set; } = 10;

    /// <summary>
    /// Dexterity attribute (3-18)
    /// </summary>
    public int Dexterity { get; set; } = 10;

    /// <summary>
    /// Intelligence attribute (3-18)
    /// </summary>
    public int Intelligence { get; set; } = 10;

    /// <summary>
    /// Constitution attribute (3-18)
    /// </summary>
    public int Constitution { get; set; } = 10;

    /// <summary>
    /// Charisma attribute (3-18)
    /// </summary>
    public int Charisma { get; set; } = 10;

    /// <summary>
    /// Maximum health points
    /// </summary>
    public int MaxHealth { get; set; } = 20;

    /// <summary>
    /// Armor class (defense value)
    /// </summary>
    public int ArmorClass { get; set; } = 12;

    /// <summary>
    /// Equipped weapon information
    /// </summary>
    public string EquippedWeapon { get; set; } = string.Empty;

    /// <summary>
    /// Health threshold for fleeing (0.0-1.0, default 0.25)
    /// </summary>
    public double FleeHealthThreshold { get; set; } = 0.25;
}
