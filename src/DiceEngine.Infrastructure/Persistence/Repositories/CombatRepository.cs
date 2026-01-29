using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for combat encounter data access using EF Core
/// </summary>
public class CombatRepository : DiceEngine.Application.Services.ICombatRepository
{
    private readonly DiceEngineDbContext _context;

    public CombatRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<CombatEncounter?> GetCombatByIdAsync(Guid combatId)
    {
        return await _context.CombatEncounters
            .Include(c => c.Combatants)
            .Include(c => c.CompletedActions)
            .FirstOrDefaultAsync(c => c.Id == combatId);
    }

    public async Task<IEnumerable<CombatEncounter>> GetCombatsByAdventureAsync(
        Guid adventureId, int page = 1, int pageSize = 20)
    {
        return await _context.CombatEncounters
            .Where(c => c.AdventureId == adventureId)
            .Include(c => c.Combatants)
            .OrderByDescending(c => c.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCombatsCountByAdventureAsync(Guid adventureId)
    {
        return await _context.CombatEncounters
            .CountAsync(c => c.AdventureId == adventureId);
    }

    public async Task AddCombatAsync(CombatEncounter combat)
    {
        await _context.CombatEncounters.AddAsync(combat);
    }

    public async Task UpdateCombatAsync(CombatEncounter combat)
    {
        _context.CombatEncounters.Update(combat);
        await Task.CompletedTask;
    }

    public void RemoveCombat(CombatEncounter combat)
    {
        _context.CombatEncounters.Remove(combat);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

/// <summary>
/// Repository implementation for enemy data access using EF Core
/// </summary>
public class EnemyRepository : DiceEngine.Application.Services.IEnemyRepository
{
    private readonly DiceEngineDbContext _context;

    public EnemyRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Enemy?> GetEnemyByIdAsync(Guid enemyId)
    {
        return await _context.Enemies
            .FirstOrDefaultAsync(e => e.Id == enemyId);
    }

    public async Task<IEnumerable<Enemy>> GetEnemiesAsync(int page = 1, int pageSize = 20)
    {
        return await _context.Enemies
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetEnemiesCountAsync()
    {
        return await _context.Enemies.CountAsync();
    }

    public async Task AddEnemyAsync(Enemy enemy)
    {
        await _context.Enemies.AddAsync(enemy);
    }

    public async Task UpdateEnemyAsync(Enemy enemy)
    {
        _context.Enemies.Update(enemy);
        await Task.CompletedTask;
    }

    public void RemoveEnemy(Enemy enemy)
    {
        _context.Enemies.Remove(enemy);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
