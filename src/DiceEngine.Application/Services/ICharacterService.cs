using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service interface for character management operations.
/// </summary>
public interface ICharacterService
{
    Task<CharacterDto> CreateAsync(Guid adventureId, CreateCharacterRequest request);
    Task<CharacterDto> GetAsync(Guid characterId);
    Task<CharacterListResponse> ListAsync(Guid adventureId, int page = 1, int pageSize = 20);
    Task<CharacterDto> UpdateAsync(Guid characterId, UpdateCharacterRequest request);
    Task DeleteAsync(Guid characterId);
    Task<CharacterSnapshotDto> CreateSnapshotAsync(Guid characterId, string? label = null);
    Task<CharacterSnapshotDto> GetSnapshotAsync(Guid characterId, Guid snapshotId);
    Task<SnapshotListResponse> ListSnapshotsAsync(Guid characterId, int page = 1, int pageSize = 50);
}
