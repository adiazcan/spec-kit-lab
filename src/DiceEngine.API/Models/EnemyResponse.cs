namespace DiceEngine.API.Models;

/// <summary>
/// Response containing enemy details
/// </summary>
public class EnemyResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Strength { get; set; }
    public int Dexterity { get; set; }
    public int Intelligence { get; set; }
    public int Constitution { get; set; }
    public int Charisma { get; set; }
    public int StrModifier { get; set; }
    public int DexModifier { get; set; }
    public int IntModifier { get; set; }
    public int ConModifier { get; set; }
    public int ChaModifier { get; set; }
    public int MaxHealth { get; set; }
    public int CurrentHealth { get; set; }
    public int ArmorClass { get; set; }
    public string CurrentAIState { get; set; } = string.Empty;
    public string EquippedWeapon { get; set; } = string.Empty;
    public double FleeHealthThreshold { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastModifiedAt { get; set; }
}

/// <summary>
/// Paginated list of enemies
/// </summary>
public class EnemyListResponse
{
    public List<EnemyResponse> Enemies { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (TotalCount + PageSize - 1) / PageSize;
}
