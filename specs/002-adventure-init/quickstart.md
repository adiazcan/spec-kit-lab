# Quick Start: Adventure Initialization System

**Feature**: 002-adventure-init  
**Target**: C# / ASP.NET Core 10 developers  
**Duration**: Implementation 4-6 hours (design already complete)

---

## Setup & Prerequisites

### 1. Verify Environment

```bash
# Check .NET version
dotnet --version  # Should be 10.0 or later

# Verify PostgreSQL connection in appsettings.Development.json
cat src/DiceEngine.API/appsettings.Development.json | grep -A2 ConnectionStrings

# Verify solution builds
dotnet build DiceEngine.slnx
```

### 2. Create Database Migration

```bash
# Create EF Core migration for Adventure table
cd src
dotnet ef migrations add AddAdventureEntity \
  --project DiceEngine.Infrastructure \
  --startup-project DiceEngine.API \
  --context DiceEngineDbContext

# Review generated migration
cat DiceEngine.Infrastructure/Migrations/*AddAdventureEntity.cs

# Apply to development database
dotnet ef database update \
  --project DiceEngine.Infrastructure \
  --startup-project DiceEngine.API
```

---

## Implementation Checklist

### Layer 1: Domain (DiceEngine.Domain)

#### Create Adventure Aggregate Root

**File**: `src/DiceEngine.Domain/Entities/Adventure.cs`

```csharp
using System;

namespace DiceEngine.Domain.Entities;

public class Adventure
{
    public Guid Id { get; private set; }
    public string CurrentSceneId { get; private set; }
    public Dictionary<string, object> GameState { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime LastUpdatedAt { get; private set; }

    // Constructor for EF Core
    public Adventure() { }

    // Factory method for new adventures
    public static Adventure Create(
        string initialSceneId,
        Dictionary<string, object>? initialGameState = null)
    {
        if (string.IsNullOrWhiteSpace(initialSceneId))
            throw new ArgumentException("Scene ID required", nameof(initialSceneId));

        var now = DateTime.UtcNow;
        return new Adventure
        {
            Id = Guid.NewGuid(),
            CurrentSceneId = initialSceneId,
            GameState = initialGameState ?? new Dictionary<string, object>(),
            CreatedAt = now,
            LastUpdatedAt = now
        };
    }

    // Update scene and game state
    public void UpdateState(string sceneId, Dictionary<string, object> gameState)
    {
        if (string.IsNullOrWhiteSpace(sceneId))
            throw new ArgumentException("Scene ID required", nameof(sceneId));

        CurrentSceneId = sceneId;
        GameState = gameState ?? new Dictionary<string, object>();
        LastUpdatedAt = DateTime.UtcNow;
    }
}
```

#### Create GameState Value Object

**File**: `src/DiceEngine.Domain/ValueObjects/GameState.cs`

```csharp
using System.Collections.Generic;

namespace DiceEngine.Domain.ValueObjects;

public class GameState
{
    public Dictionary<string, object> Data { get; }

    public GameState(Dictionary<string, object>? data = null)
    {
        Data = data ?? new Dictionary<string, object>();
    }

    public object? GetValue(string key) =>
        Data.ContainsKey(key) ? Data[key] : null;

    public void SetValue(string key, object value) =>
        Data[key] = value;
}
```

---

### Layer 2: Application (DiceEngine.Application)

#### Create Data Transfer Objects (DTOs)

**File**: `src/DiceEngine.Application/Models/CreateAdventureRequest.cs`

```csharp
using System.Collections.Generic;

namespace DiceEngine.Application.Models;

public class CreateAdventureRequest
{
    public string InitialSceneId { get; set; } = "scene_start";
    public Dictionary<string, object>? InitialGameState { get; set; }
}
```

**File**: `src/DiceEngine.Application/Models/UpdateAdventureRequest.cs`

```csharp
using System.Collections.Generic;

namespace DiceEngine.Application.Models;

public class UpdateAdventureRequest
{
    public string CurrentSceneId { get; set; } = string.Empty;
    public Dictionary<string, object>? GameState { get; set; }
}
```

**File**: `src/DiceEngine.Application/Models/AdventureDto.cs`

```csharp
using System;
using System.Collections.Generic;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Models;

public class AdventureDto
{
    public Guid Id { get; set; }
    public string CurrentSceneId { get; set; } = string.Empty;
    public Dictionary<string, object> GameState { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime LastUpdatedAt { get; set; }

    public static AdventureDto FromEntity(Adventure adventure) => new()
    {
        Id = adventure.Id,
        CurrentSceneId = adventure.CurrentSceneId,
        GameState = adventure.GameState,
        CreatedAt = adventure.CreatedAt,
        LastUpdatedAt = adventure.LastUpdatedAt
    };
}
```

#### Create Application Service

**File**: `src/DiceEngine.Application/Services/AdventureService.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;
using DiceEngine.Infrastructure.Persistence.Repositories;

namespace DiceEngine.Application.Services;

public interface IAdventureService
{
    Task<AdventureDto> CreateAsync(CreateAdventureRequest request);
    Task<AdventureDto?> GetAsync(Guid id);
    Task<IEnumerable<AdventureDto>> ListAsync(int page = 1, int limit = 20);
    Task<int> GetTotalCountAsync();
    Task<AdventureDto?> UpdateAsync(Guid id, UpdateAdventureRequest request);
    Task<bool> DeleteAsync(Guid id);
}

public class AdventureService : IAdventureService
{
    private readonly IAdventureRepository _repository;

    public AdventureService(IAdventureRepository repository)
    {
        _repository = repository;
    }

    public async Task<AdventureDto> CreateAsync(CreateAdventureRequest request)
    {
        var adventure = Adventure.Create(
            request.InitialSceneId,
            request.InitialGameState);

        await _repository.AddAsync(adventure);
        await _repository.SaveChangesAsync();

        return AdventureDto.FromEntity(adventure);
    }

    public async Task<AdventureDto?> GetAsync(Guid id)
    {
        var adventure = await _repository.GetByIdAsync(id);
        return adventure != null ? AdventureDto.FromEntity(adventure) : null;
    }

    public async Task<IEnumerable<AdventureDto>> ListAsync(int page = 1, int limit = 20)
    {
        var adventures = await _repository.GetPagedAsync(page, limit);
        return adventures.Select(AdventureDto.FromEntity);
    }

    public async Task<int> GetTotalCountAsync()
    {
        return await _repository.GetCountAsync();
    }

    public async Task<AdventureDto?> UpdateAsync(Guid id, UpdateAdventureRequest request)
    {
        var adventure = await _repository.GetByIdAsync(id);
        if (adventure == null)
            return null;

        adventure.UpdateState(request.CurrentSceneId, request.GameState ?? new());
        await _repository.SaveChangesAsync();

        return AdventureDto.FromEntity(adventure);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var success = await _repository.DeleteAsync(id);
        if (success)
            await _repository.SaveChangesAsync();
        return success;
    }
}
```

---

### Layer 3: Infrastructure (DiceEngine.Infrastructure)

#### Create Repository

**File**: `src/DiceEngine.Infrastructure/Persistence/Repositories/AdventureRepository.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence.Repositories;

public interface IAdventureRepository
{
    Task AddAsync(Adventure adventure);
    Task<Adventure?> GetByIdAsync(Guid id);
    Task<IEnumerable<Adventure>> GetPagedAsync(int page, int limit);
    Task<int> GetCountAsync();
    Task<bool> DeleteAsync(Guid id);
    Task SaveChangesAsync();
}

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
```

#### Update DbContext

**File**: `src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs` (add to existing file)

```csharp
public DbSet<Adventure> Adventures { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Configure Adventure entity
    modelBuilder.Entity<Adventure>(entity =>
    {
        entity.HasKey(a => a.Id);

        entity.Property(a => a.CurrentSceneId)
            .IsRequired()
            .HasMaxLength(100);

        entity.Property(a => a.GameState)
            .HasColumnType("jsonb")
            .IsRequired();

        entity.Property(a => a.CreatedAt)
            .IsRequired();

        entity.Property(a => a.LastUpdatedAt)
            .IsRequired();

        // Indexes
        entity.HasIndex(a => a.CreatedAt).IsDescending();
        entity.HasIndex(a => a.LastUpdatedAt).IsDescending();
        entity.HasIndex(a => a.CurrentSceneId);
    });
}
```

---

### Layer 4: API (DiceEngine.API)

#### Create Controller

**File**: `src/DiceEngine.API/Controllers/AdventuresController.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdventuresController : ControllerBase
{
    private readonly IAdventureService _adventureService;

    public AdventuresController(IAdventureService adventureService)
    {
        _adventureService = adventureService;
    }

    /// <summary>
    /// Create a new adventure
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AdventureDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<AdventureDto>> CreateAdventure(
        [FromBody] CreateAdventureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.InitialSceneId))
            return BadRequest("InitialSceneId is required");

        var adventure = await _adventureService.CreateAsync(request);
        return CreatedAtAction(nameof(GetAdventure), new { id = adventure.Id }, adventure);
    }

    /// <summary>
    /// Retrieve an adventure by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdventureDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AdventureDto>> GetAdventure(Guid id)
    {
        var adventure = await _adventureService.GetAsync(id);
        if (adventure == null)
            return NotFound();

        return Ok(adventure);
    }

    /// <summary>
    /// List all adventures with pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedAdventureResponse), 200)]
    public async Task<ActionResult<PagedAdventureResponse>> ListAdventures(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        if (page < 1)
            return BadRequest("Page must be >= 1");

        if (limit < 1 || limit > 100)
            return BadRequest("Limit must be between 1 and 100");

        var adventures = await _adventureService.ListAsync(page, limit);
        var total = await _adventureService.GetTotalCountAsync();
        var hasMore = (page * limit) < total;

        return Ok(new PagedAdventureResponse
        {
            Adventures = adventures.ToList(),
            Total = total,
            Page = page,
            Limit = limit,
            HasMore = hasMore
        });
    }

    /// <summary>
    /// Update an adventure (scene and game state)
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AdventureDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AdventureDto>> UpdateAdventure(
        Guid id,
        [FromBody] UpdateAdventureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentSceneId))
            return BadRequest("CurrentSceneId is required");

        var adventure = await _adventureService.UpdateAsync(id, request);
        if (adventure == null)
            return NotFound();

        return Ok(adventure);
    }

    /// <summary>
    /// Delete an adventure
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> DeleteAdventure(Guid id)
    {
        var success = await _adventureService.DeleteAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }
}

public class PagedAdventureResponse
{
    public List<AdventureDto> Adventures { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public bool HasMore { get; set; }
}
```

#### Register in Program.cs

```csharp
// Add to DiceEngine.API/Program.cs before app.Run()
builder.Services.AddScoped<IAdventureService, AdventureService>();
builder.Services.AddScoped<IAdventureRepository, AdventureRepository>();
```

---

## Testing

### Unit Tests for Service

**File**: `tests/DiceEngine.Application.Tests/AdventureServiceTests.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using DiceEngine.Infrastructure.Persistence.Repositories;
using Moq;
using Xunit;

namespace DiceEngine.Application.Tests;

public class AdventureServiceTests
{
    private readonly Mock<IAdventureRepository> _repositoryMock;
    private readonly IAdventureService _service;

    public AdventureServiceTests()
    {
        _repositoryMock = new Mock<IAdventureRepository>();
        _service = new AdventureService(_repositoryMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidRequest_ReturnsAdventure()
    {
        // Arrange
        var request = new CreateAdventureRequest
        {
            InitialSceneId = "scene_start",
            InitialGameState = new Dictionary<string, object> { { "level", 1 } }
        };

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("scene_start", result.CurrentSceneId);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Adventure>()), Times.Once);
    }

    [Fact]
    public async Task GetAsync_WithValidId_ReturnsAdventure()
    {
        // Arrange
        var id = Guid.NewGuid();
        var adventure = Adventure.Create("scene_start");
        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(adventure);

        // Act
        var result = await _service.GetAsync(id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(adventure.Id, result.Id);
    }

    [Fact]
    public async Task GetAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        _repositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Adventure?)null);

        // Act
        var result = await _service.GetAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_ReturnsTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.DeleteAsync(id)).ReturnsAsync(true);

        // Act
        var result = await _service.DeleteAsync(id);

        // Assert
        Assert.True(result);
        _repositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
```

---

## Deployment Checklist

- [ ] Database migration created and tested locally
- [ ] All unit tests passing (>90% coverage)
- [ ] Controller integration tests passing
- [ ] OpenAPI spec generated and validated
- [ ] Swagger UI shows all endpoints
- [ ] Performance testing shows <200ms response times
- [ ] Error handling covers all edge cases (404, 400, 413)
- [ ] Pagination limit validated (max 100)
- [ ] Production database has indexes applied
- [ ] Monitoring/logging configured for new endpoints

---

## References

- [Feature Specification](./spec.md)
- [Data Model](./data-model.md)
- [Research & Decisions](./research.md)
- [API Contracts](./contracts/openapi.yaml)
