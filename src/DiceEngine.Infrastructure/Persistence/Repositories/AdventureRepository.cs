using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository for Adventure persistence via Entity Framework Core.
/// </summary>
public class AdventureRepository : IAdventureRepository
{
    private readonly DiceEngineDbContext _context;

    public AdventureRepository(DiceEngineDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Adventure adventure)
    {
        await _context.Adventures.AddAsync(adventure);
    }

    public async Task<Adventure?> GetByIdAsync(Guid id)
    {
        return await _context.Adventures.FindAsync(id);
    }

    public async Task<IEnumerable<Adventure>> GetPagedAsync(int page, int limit)
    {
        const int maxLimit = 100;
        limit = Math.Min(limit, maxLimit);

        var skip = (page - 1) * limit;
        return await _context.Adventures
            .OrderByDescending(a => a.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync()
    {
        return await _context.Adventures.CountAsync();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var adventure = await GetByIdAsync(id);
        if (adventure == null)
            return false;

        _context.Adventures.Remove(adventure);
        return true;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
