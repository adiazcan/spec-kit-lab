using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services;

public interface IAdventureRepository
{
    Task AddAsync(Adventure adventure);
    Task<Adventure?> GetByIdAsync(Guid id);
    Task<IEnumerable<Adventure>> GetPagedAsync(int page, int limit);
    Task<int> GetCountAsync();
    Task<bool> DeleteAsync(Guid id);
    Task SaveChangesAsync();
}

public interface IAdventureService
{
    Task<AdventureDto> CreateAsync(CreateAdventureRequest request);
    Task<AdventureDto?> GetAsync(Guid id);
    Task<IEnumerable<AdventureDto>> ListAsync(int page = 1, int limit = 20);
    Task<int> GetTotalCountAsync();
    Task<AdventureDto?> UpdateAsync(Guid id, UpdateAdventureRequest request);
    Task<bool> DeleteAsync(Guid id);
}

/// <summary>
/// Service for managing adventure lifecycle operations.
/// Handles creation, retrieval, updating, deletion, and listing of adventures.
/// </summary>
public class AdventureService : IAdventureService
{
    private readonly IAdventureRepository _repository;

    public AdventureService(IAdventureRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Creates a new adventure with default timestamp initialization.
    /// </summary>
    public async Task<AdventureDto> CreateAsync(CreateAdventureRequest request)
    {
        var adventure = Adventure.Create(
            request.InitialSceneId,
            request.InitialGameState);

        await _repository.AddAsync(adventure);
        await _repository.SaveChangesAsync();

        return AdventureDto.FromEntity(adventure);
    }

    /// <summary>
    /// Retrieves an adventure by ID.
    /// Returns null if adventure is not found.
    /// </summary>
    public async Task<AdventureDto?> GetAsync(Guid id)
    {
        var adventure = await _repository.GetByIdAsync(id);
        return adventure != null ? AdventureDto.FromEntity(adventure) : null;
    }

    /// <summary>
    /// Retrieves a paginated list of adventures ordered by creation time (newest first).
    /// </summary>
    public async Task<IEnumerable<AdventureDto>> ListAsync(int page = 1, int limit = 20)
    {
        var adventures = await _repository.GetPagedAsync(page, limit);
        return adventures.Select(AdventureDto.FromEntity);
    }

    /// <summary>
    /// Gets the total count of adventures.
    /// </summary>
    public async Task<int> GetTotalCountAsync()
    {
        return await _repository.GetCountAsync();
    }

    /// <summary>
    /// Updates an adventure's scene and game state with new timestamp.
    /// Returns null if adventure is not found.
    /// </summary>
    public async Task<AdventureDto?> UpdateAsync(Guid id, UpdateAdventureRequest request)
    {
        var adventure = await _repository.GetByIdAsync(id);
        if (adventure == null)
            return null;

        adventure.UpdateState(request.CurrentSceneId, request.GameState ?? new());
        await _repository.SaveChangesAsync();

        return AdventureDto.FromEntity(adventure);
    }

    /// <summary>
    /// Deletes an adventure by ID.
    /// Returns true if deletion was successful, false if adventure not found.
    /// </summary>
    public async Task<bool> DeleteAsync(Guid id)
    {
        var success = await _repository.DeleteAsync(id);
        if (success)
            await _repository.SaveChangesAsync();
        return success;
    }
}
