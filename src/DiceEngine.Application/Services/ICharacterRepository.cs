using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Repository interface for character data access operations.
/// </summary>
public interface ICharacterRepository
{
    Task<Character?> GetCharacterByIdAsync(Guid characterId);
    Task<IEnumerable<Character>> GetCharactersByAdventureAsync(Guid adventureId, int page = 1, int pageSize = 20);
    Task<int> GetCharactersCountByAdventureAsync(Guid adventureId);
    Task AddCharacterAsync(Character character);
    void RemoveCharacter(Character character);

    Task<CharacterSnapshot?> GetSnapshotByIdAsync(Guid snapshotId);
    Task<IEnumerable<CharacterSnapshot>> GetSnapshotsByCharacterAsync(Guid characterId, int page = 1, int pageSize = 50);
    Task<int> GetSnapshotsCountByCharacterAsync(Guid characterId);
    Task AddSnapshotAsync(CharacterSnapshot snapshot);

    Task<bool> AdventureExistsAsync(Guid adventureId);
    Task<int> SaveAsync();
}
