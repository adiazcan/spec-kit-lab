using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for character management (CRUD + snapshots).
/// </summary>
public class CharacterService : ICharacterService
{
    private readonly ICharacterRepository _repository;

    public CharacterService(ICharacterRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<CharacterDto> CreateAsync(Guid adventureId, CreateCharacterRequest request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        // Validate adventure exists
        var adventureExists = await _repository.AdventureExistsAsync(adventureId);
        if (!adventureExists)
            throw new InvalidOperationException($"Adventure {adventureId} not found.");

        // Create entity with validation
        var character = Character.Create(
            request.Name, adventureId,
            request.StrBase, request.DexBase, request.IntBase,
            request.ConBase, request.ChaBase
        );

        // Initialize the 7 standard equipment slots for the character
        character.InitializeEquipmentSlots();

        // Persist
        await _repository.AddCharacterAsync(character);
        await _repository.SaveAsync();

        return MapToDto(character);
    }

    public async Task<CharacterDto> GetAsync(Guid characterId)
    {
        var character = await _repository.GetCharacterByIdAsync(characterId)
            ?? throw new KeyNotFoundException($"Character {characterId} not found.");

        return MapToDto(character);
    }

    public async Task<CharacterListResponse> ListAsync(Guid adventureId, int page = 1, int pageSize = 20)
    {
        if (page < 1)
            throw new ArgumentException("Page must be greater than 0.", nameof(page));

        if (pageSize < 1 || pageSize > 100)
            throw new ArgumentException("PageSize must be between 1 and 100.", nameof(pageSize));

        var characters = await _repository.GetCharactersByAdventureAsync(adventureId, page, pageSize);
        var total = await _repository.GetCharactersCountByAdventureAsync(adventureId);

        return new CharacterListResponse
        {
            Data = characters.Select(MapToDto),
            Page = page,
            PageSize = pageSize,
            Total = total
        };
    }

    public async Task<CharacterDto> UpdateAsync(Guid characterId, UpdateCharacterRequest request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        var character = await _repository.GetCharacterByIdAsync(characterId)
            ?? throw new KeyNotFoundException($"Character {characterId} not found.");

        // Check optimistic lock version
        if (character.Version != request.Version)
            throw new InvalidOperationException("Character has been modified. Please refresh and retry.");

        // Update attributes
        character.UpdateAttributes(
            request.Name,
            request.StrBase, request.DexBase, request.IntBase,
            request.ConBase, request.ChaBase
        );

        await _repository.SaveAsync();
        return MapToDto(character);
    }

    public async Task DeleteAsync(Guid characterId)
    {
        var character = await _repository.GetCharacterByIdAsync(characterId)
            ?? throw new KeyNotFoundException($"Character {characterId} not found.");

        _repository.RemoveCharacter(character);
        await _repository.SaveAsync();
    }

    public async Task<CharacterSnapshotDto> CreateSnapshotAsync(Guid characterId, string? label = null)
    {
        var character = await _repository.GetCharacterByIdAsync(characterId)
            ?? throw new KeyNotFoundException($"Character {characterId} not found.");

        var snapshot = CharacterSnapshot.CreateFromCharacter(character, label);
        await _repository.AddSnapshotAsync(snapshot);
        await _repository.SaveAsync();

        return MapSnapshotToDto(snapshot);
    }

    public async Task<CharacterSnapshotDto> GetSnapshotAsync(Guid characterId, Guid snapshotId)
    {
        var snapshot = await _repository.GetSnapshotByIdAsync(snapshotId)
            ?? throw new KeyNotFoundException($"Snapshot {snapshotId} not found.");

        if (snapshot.CharacterId != characterId)
            throw new InvalidOperationException("Snapshot does not belong to this character.");

        return MapSnapshotToDto(snapshot);
    }

    public async Task<SnapshotListResponse> ListSnapshotsAsync(
        Guid characterId, int page = 1, int pageSize = 50)
    {
        if (page < 1)
            throw new ArgumentException("Page must be greater than 0.", nameof(page));

        if (pageSize < 1 || pageSize > 100)
            throw new ArgumentException("PageSize must be between 1 and 100.", nameof(pageSize));

        var snapshots = await _repository.GetSnapshotsByCharacterAsync(characterId, page, pageSize);
        var total = await _repository.GetSnapshotsCountByCharacterAsync(characterId);

        return new SnapshotListResponse
        {
            Data = snapshots.Select(MapSnapshotToDto),
            Page = page,
            PageSize = pageSize,
            Total = total
        };
    }

    private static CharacterDto MapToDto(Character character)
    {
        return new CharacterDto
        {
            Id = character.Id,
            Name = character.Name,
            AdventureId = character.AdventureId,
            Attributes = new CharacterAttributesDto
            {
                Str = new AttributeValueDto { Base = character.StrBase, Modifier = character.StrModifier },
                Dex = new AttributeValueDto { Base = character.DexBase, Modifier = character.DexModifier },
                Int = new AttributeValueDto { Base = character.IntBase, Modifier = character.IntModifier },
                Con = new AttributeValueDto { Base = character.ConBase, Modifier = character.ConModifier },
                Cha = new AttributeValueDto { Base = character.ChaBase, Modifier = character.ChaModifier }
            },
            Version = character.Version,
            CreatedAt = character.CreatedAt,
            LastModifiedAt = character.LastModifiedAt
        };
    }

    private static CharacterSnapshotDto MapSnapshotToDto(CharacterSnapshot snapshot)
    {
        return new CharacterSnapshotDto
        {
            Id = snapshot.Id,
            CharacterId = snapshot.CharacterId,
            Label = snapshot.Label,
            CreatedAt = snapshot.CreatedAt,
            Attributes = new CharacterAttributesDto
            {
                Str = new AttributeValueDto { Base = snapshot.StrBase, Modifier = snapshot.StrModifier },
                Dex = new AttributeValueDto { Base = snapshot.DexBase, Modifier = snapshot.DexModifier },
                Int = new AttributeValueDto { Base = snapshot.IntBase, Modifier = snapshot.IntModifier },
                Con = new AttributeValueDto { Base = snapshot.ConBase, Modifier = snapshot.ConModifier },
                Cha = new AttributeValueDto { Base = snapshot.ChaBase, Modifier = snapshot.ChaModifier }
            }
        };
    }
}
