using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for character data access using EF Core.
/// </summary>
public class CharacterRepository : DiceEngine.Application.Services.ICharacterRepository
{
    private readonly DiceEngineDbContext _context;

    public CharacterRepository(DiceEngineDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Character?> GetCharacterByIdAsync(Guid characterId)
    {
        return await _context.Characters
            .FirstOrDefaultAsync(c => c.Id == characterId);
    }

    public async Task<IEnumerable<Character>> GetCharactersByAdventureAsync(
        Guid adventureId, int page = 1, int pageSize = 20)
    {
        return await _context.Characters
            .Where(c => c.AdventureId == adventureId)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCharactersCountByAdventureAsync(Guid adventureId)
    {
        return await _context.Characters
            .CountAsync(c => c.AdventureId == adventureId);
    }

    public async Task AddCharacterAsync(Character character)
    {
        await _context.Characters.AddAsync(character);
    }

    public void RemoveCharacter(Character character)
    {
        _context.Characters.Remove(character);
    }

    public async Task<CharacterSnapshot?> GetSnapshotByIdAsync(Guid snapshotId)
    {
        return await _context.CharacterSnapshots
            .FirstOrDefaultAsync(s => s.Id == snapshotId);
    }

    public async Task<IEnumerable<CharacterSnapshot>> GetSnapshotsByCharacterAsync(
        Guid characterId, int page = 1, int pageSize = 50)
    {
        return await _context.CharacterSnapshots
            .Where(s => s.CharacterId == characterId)
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetSnapshotsCountByCharacterAsync(Guid characterId)
    {
        return await _context.CharacterSnapshots
            .CountAsync(s => s.CharacterId == characterId);
    }

    public async Task AddSnapshotAsync(CharacterSnapshot snapshot)
    {
        await _context.CharacterSnapshots.AddAsync(snapshot);
    }

    public async Task<bool> AdventureExistsAsync(Guid adventureId)
    {
        return await _context.Adventures
            .AnyAsync(a => a.Id == adventureId);
    }

    public async Task<int> SaveAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
