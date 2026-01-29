using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Repository interface for combat encounter data access
/// </summary>
public interface ICombatRepository
{
    /// <summary>
    /// Get a combat encounter by ID
    /// </summary>
    Task<CombatEncounter?> GetCombatByIdAsync(Guid combatId);

    /// <summary>
    /// Get all combat encounters for an adventure
    /// </summary>
    Task<IEnumerable<CombatEncounter>> GetCombatsByAdventureAsync(
        Guid adventureId, int page = 1, int pageSize = 20);

    /// <summary>
    /// Count combat encounters for an adventure
    /// </summary>
    Task<int> GetCombatsCountByAdventureAsync(Guid adventureId);

    /// <summary>
    /// Add a new combat encounter
    /// </summary>
    Task AddCombatAsync(CombatEncounter combat);

    /// <summary>
    /// Update an existing combat encounter
    /// </summary>
    Task UpdateCombatAsync(CombatEncounter combat);

    /// <summary>
    /// Delete a combat encounter
    /// </summary>
    void RemoveCombat(CombatEncounter combat);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task SaveChangesAsync();
}

/// <summary>
/// Repository interface for enemy data access
/// </summary>
public interface IEnemyRepository
{
    /// <summary>
    /// Get an enemy by ID
    /// </summary>
    Task<Enemy?> GetEnemyByIdAsync(Guid enemyId);

    /// <summary>
    /// Get all enemies with pagination
    /// </summary>
    Task<IEnumerable<Enemy>> GetEnemiesAsync(int page = 1, int pageSize = 20);

    /// <summary>
    /// Count total enemies
    /// </summary>
    Task<int> GetEnemiesCountAsync();

    /// <summary>
    /// Add a new enemy
    /// </summary>
    Task AddEnemyAsync(Enemy enemy);

    /// <summary>
    /// Update an existing enemy
    /// </summary>
    Task UpdateEnemyAsync(Enemy enemy);

    /// <summary>
    /// Delete an enemy
    /// </summary>
    void RemoveEnemy(Enemy enemy);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task SaveChangesAsync();
}
