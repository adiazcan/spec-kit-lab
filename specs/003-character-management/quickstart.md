# Quickstart Guide: Character Management System

**Date**: 2026-01-28  
**Target**: Developers implementing character CRUD operations  
**Scope**: Setup, usage examples, and implementation sequence

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Project Setup](#project-setup)
4. [Implementation Sequence](#implementation-sequence)
5. [Usage Examples](#usage-examples)
6. [Testing Guide](#testing-guide)
7. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

- ASP.NET Core 10 SDK installed
- PostgreSQL 14+ running (from docker-compose.yaml)
- xUnit and Moq for unit testing
- Entity Framework Core CLI tools
- Existing DiceEngine project structure with:
  - DiceEngine.API (Web API)
  - DiceEngine.Application (Services)
  - DiceEngine.Domain (Entities)
  - DiceEngine.Infrastructure (Data access)

---

## Architecture Overview

### Layered Organization

```
DiceEngine.API (Controllers)
    ↓
DiceEngine.Application (Services, DTOs)
    ↓
DiceEngine.Domain (Entities, Value Objects)
    ↓
DiceEngine.Infrastructure (EF Core, Repository)
    ↓
PostgreSQL Database
```

### Key Components

| Component | Responsibility | Example |
|-----------|-----------------|---------|
| **CharactersController** | HTTP request handling, validation | `POST /api/adventures/{id}/characters` |
| **CharacterService** | Business logic, orchestration | Create, update, snapshot operations |
| **Character Entity** | Domain model, validation rules | Aggregate root with attributes |
| **CharacterRepository** | Data access, persistence | EF Core queries and saves |
| **CharacterSnapshot Entity** | Immutable historical state | Point-in-time captures |

---

## Project Setup

### Step 1: Create Domain Entities

**File**: `src/DiceEngine.Domain/Entities/Character.cs`

```csharp
using System;
using System.Collections.Generic;

namespace DiceEngine.Domain.Entities
{
    /// <summary>
    /// Character aggregate root representing a playable/non-playable game character.
    /// Contains attributes, calculated modifiers, and associated snapshots.
    /// </summary>
    public class Character
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid AdventureId { get; set; }
        
        // Attributes (base values)
        public int StrBase { get; set; }
        public int DexBase { get; set; }
        public int IntBase { get; set; }
        public int ConBase { get; set; }
        public int ChaBase { get; set; }
        
        // Computed properties for modifiers
        public int StrModifier => CalculateModifier(StrBase);
        public int DexModifier => CalculateModifier(DexBase);
        public int IntModifier => CalculateModifier(IntBase);
        public int ConModifier => CalculateModifier(ConBase);
        public int ChaModifier => CalculateModifier(ChaBase);
        
        // Metadata
        public DateTime CreatedAt { get; set; }
        public DateTime LastModifiedAt { get; set; }
        public uint Version { get; set; }
        
        // Navigation
        public virtual ICollection<CharacterSnapshot> Snapshots { get; set; } = new List<CharacterSnapshot>();
        
        /// <summary>
        /// Factory method for creating a new character with validation.
        /// </summary>
        public static Character Create(
            string name, Guid adventureId,
            int str, int dex, int intel, int con, int cha)
        {
            ValidateName(name);
            ValidateAttributeValue(str, nameof(str));
            ValidateAttributeValue(dex, nameof(dex));
            ValidateAttributeValue(intel, nameof(intel));
            ValidateAttributeValue(con, nameof(con));
            ValidateAttributeValue(cha, nameof(cha));
            
            return new Character
            {
                Id = Guid.NewGuid(),
                Name = name.Trim(),
                AdventureId = adventureId,
                StrBase = str,
                DexBase = dex,
                IntBase = intel,
                ConBase = con,
                ChaBase = cha,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow,
                Version = 1
            };
        }
        
        /// <summary>
        /// Update character attributes with optimistic locking.
        /// </summary>
        public void UpdateAttributes(
            string? name = null,
            int? str = null, int? dex = null, int? intel = null,
            int? con = null, int? cha = null)
        {
            if (!string.IsNullOrWhiteSpace(name))
            {
                ValidateName(name);
                Name = name.Trim();
            }
            
            if (str.HasValue)
            {
                ValidateAttributeValue(str.Value, nameof(str));
                StrBase = str.Value;
            }
            if (dex.HasValue)
            {
                ValidateAttributeValue(dex.Value, nameof(dex));
                DexBase = dex.Value;
            }
            if (intel.HasValue)
            {
                ValidateAttributeValue(intel.Value, nameof(intel));
                IntBase = intel.Value;
            }
            if (con.HasValue)
            {
                ValidateAttributeValue(con.Value, nameof(con));
                ConBase = con.Value;
            }
            if (cha.HasValue)
            {
                ValidateAttributeValue(cha.Value, nameof(cha));
                ChaBase = cha.Value;
            }
            
            LastModifiedAt = DateTime.UtcNow;
            Version++;
        }
        
        private static int CalculateModifier(int baseValue)
        {
            return (int)Math.Floor((baseValue - 10.0) / 2.0);
        }
        
        private static void ValidateName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Character name cannot be empty.", nameof(name));
            
            if (name.Length > 255)
                throw new ArgumentException("Character name cannot exceed 255 characters.", nameof(name));
        }
        
        private static void ValidateAttributeValue(int value, string attributeName)
        {
            if (value < 3 || value > 18)
                throw new ArgumentException($"{attributeName} must be between 3 and 18, received {value}.", attributeName);
        }
    }
}
```

**File**: `src/DiceEngine.Domain/Entities/CharacterSnapshot.cs`

```csharp
using System;

namespace DiceEngine.Domain.Entities
{
    /// <summary>
    /// Immutable point-in-time capture of a character's state (game save).
    /// </summary>
    public class CharacterSnapshot
    {
        public Guid Id { get; set; }
        public Guid CharacterId { get; set; }
        public string Label { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        
        // Captured attribute state
        public int StrBase { get; set; }
        public int DexBase { get; set; }
        public int IntBase { get; set; }
        public int ConBase { get; set; }
        public int ChaBase { get; set; }
        
        // Captured modifiers for historical reference
        public int StrModifier { get; set; }
        public int DexModifier { get; set; }
        public int IntModifier { get; set; }
        public int ConModifier { get; set; }
        public int ChaModifier { get; set; }
        
        // Navigation
        public virtual Character Character { get; set; } = null!;
        
        /// <summary>
        /// Factory method to capture character state at current moment.
        /// </summary>
        public static CharacterSnapshot CreateFromCharacter(Character character, string? label = null)
        {
            return new CharacterSnapshot
            {
                Id = Guid.NewGuid(),
                CharacterId = character.Id,
                Label = label?.Trim() ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                StrBase = character.StrBase,
                DexBase = character.DexBase,
                IntBase = character.IntBase,
                ConBase = character.ConBase,
                ChaBase = character.ChaBase,
                StrModifier = character.StrModifier,
                DexModifier = character.DexModifier,
                IntModifier = character.IntModifier,
                ConModifier = character.ConModifier,
                ChaModifier = character.ChaModifier
            };
        }
    }
}
```

### Step 2: Create Application Service

**File**: `src/DiceEngine.Application/Services/CharacterService.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DiceEngine.Domain.Entities;

namespace DiceEngine.Application.Services
{
    /// <summary>
    /// Service for character management (CRUD + snapshots).
    /// </summary>
    public interface ICharacterService
    {
        Task<CharacterDto> CreateAsync(Guid adventureId, CreateCharacterRequest request);
        Task<CharacterDto> GetAsync(Guid characterId);
        Task<IEnumerable<CharacterDto>> ListAsync(Guid adventureId, int page = 1, int pageSize = 20);
        Task<CharacterDto> UpdateAsync(Guid characterId, UpdateCharacterRequest request);
        Task DeleteAsync(Guid characterId);
        Task<CharacterSnapshotDto> CreateSnapshotAsync(Guid characterId, string? label = null);
        Task<CharacterSnapshotDto> GetSnapshotAsync(Guid characterId, Guid snapshotId);
        Task<IEnumerable<CharacterSnapshotDto>> ListSnapshotsAsync(Guid characterId, int page = 1, int pageSize = 50);
    }
    
    public class CharacterService : ICharacterService
    {
        private readonly ICharacterRepository _repository;
        
        public CharacterService(ICharacterRepository repository)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        }
        
        public async Task<CharacterDto> CreateAsync(Guid adventureId, CreateCharacterRequest request)
        {
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
        
        public async Task<IEnumerable<CharacterDto>> ListAsync(Guid adventureId, int page = 1, int pageSize = 20)
        {
            var characters = await _repository.GetCharactersByAdventureAsync(adventureId, page, pageSize);
            return characters.Select(MapToDto);
        }
        
        public async Task<CharacterDto> UpdateAsync(Guid characterId, UpdateCharacterRequest request)
        {
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
        
        public async Task<IEnumerable<CharacterSnapshotDto>> ListSnapshotsAsync(
            Guid characterId, int page = 1, int pageSize = 50)
        {
            var snapshots = await _repository.GetSnapshotsByCharacterAsync(characterId, page, pageSize);
            return snapshots.Select(MapSnapshotToDto);
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
}
```

### Step 3: Create API Controller

**File**: `src/DiceEngine.API/Controllers/CharactersController.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiceEngine.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers
{
    [ApiController]
    [Route("api/adventures/{adventureId}/characters")]
    public class CharactersController : ControllerBase
    {
        private readonly ICharacterService _characterService;
        
        public CharactersController(ICharacterService characterService)
        {
            _characterService = characterService ?? throw new ArgumentNullException(nameof(characterService));
        }
        
        /// <summary>
        /// Create a new character for an adventure.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateCharacter(
            Guid adventureId, [FromBody] CreateCharacterRequest request)
        {
            try
            {
                var character = await _characterService.CreateAsync(adventureId, request);
                return CreatedAtAction(nameof(GetCharacter), 
                    new { adventureId, characterId = character.Id }, character);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
        
        /// <summary>
        /// List all characters for an adventure.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> ListCharacters(
            Guid adventureId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var characters = await _characterService.ListAsync(adventureId, page, pageSize);
            return Ok(new { data = characters, page, pageSize });
        }
        
        /// <summary>
        /// Retrieve a specific character.
        /// </summary>
        [HttpGet("{characterId}")]
        public async Task<IActionResult> GetCharacter(Guid adventureId, Guid characterId)
        {
            try
            {
                var character = await _characterService.GetAsync(characterId);
                if (character.AdventureId != adventureId)
                    return NotFound(new { error = "Character not found in this adventure." });
                
                return Ok(character);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
        
        /// <summary>
        /// Update character attributes.
        /// </summary>
        [HttpPut("{characterId}")]
        public async Task<IActionResult> UpdateCharacter(
            Guid adventureId, Guid characterId, [FromBody] UpdateCharacterRequest request)
        {
            try
            {
                var updated = await _characterService.UpdateAsync(characterId, request);
                if (updated.AdventureId != adventureId)
                    return NotFound(new { error = "Character not found in this adventure." });
                
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        
        /// <summary>
        /// Delete a character.
        /// </summary>
        [HttpDelete("{characterId}")]
        public async Task<IActionResult> DeleteCharacter(Guid adventureId, Guid characterId)
        {
            try
            {
                await _characterService.DeleteAsync(characterId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
        
        /// <summary>
        /// Create a character snapshot (save point).
        /// </summary>
        [HttpPost("{characterId}/snapshots")]
        public async Task<IActionResult> CreateSnapshot(
            Guid adventureId, Guid characterId, [FromBody] CreateSnapshotRequest request)
        {
            try
            {
                var snapshot = await _characterService.CreateSnapshotAsync(characterId, request.Label);
                return CreatedAtAction("GetSnapshot", 
                    new { characterId, snapshotId = snapshot.Id }, snapshot);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
        
        /// <summary>
        /// List character snapshots.
        /// </summary>
        [HttpGet("{characterId}/snapshots")]
        public async Task<IActionResult> ListSnapshots(
            Guid adventureId, Guid characterId,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var snapshots = await _characterService.ListSnapshotsAsync(characterId, page, pageSize);
            return Ok(new { data = snapshots, page, pageSize });
        }
        
        /// <summary>
        /// Get a specific snapshot.
        /// </summary>
        [HttpGet("{characterId}/snapshots/{snapshotId}")]
        public async Task<IActionResult> GetSnapshot(Guid adventureId, Guid characterId, Guid snapshotId)
        {
            try
            {
                var snapshot = await _characterService.GetSnapshotAsync(characterId, snapshotId);
                return Ok(snapshot);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
```

### Step 4: Register in Dependency Injection

**File**: `src/DiceEngine.API/Program.cs`

```csharp
// In ConfigureServices (or at builder setup)
builder.Services.AddScoped<ICharacterService, CharacterService>();
builder.Services.AddScoped<ICharacterRepository, CharacterRepository>();

// Swagger/OpenAPI
builder.Services.AddSwaggerGen(options =>
{
    var xmlFile = "DiceEngine.API.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});
```

### Step 5: Database Migrations

Create EF Core migration:

```bash
cd src/DiceEngine.Infrastructure
dotnet ef migrations add AddCharacterManagement --context DiceEngineDbContext
dotnet ef database update
```

---

## Implementation Sequence

### Phase 1: Domain Layer (30 minutes)
- [ ] Create Character entity (with validation)
- [ ] Create CharacterSnapshot entity
- [ ] Unit test Character.Create() and modifier calculation

### Phase 2: Data Layer (45 minutes)
- [ ] Create CharacterRepository interface
- [ ] Implement repository with EF Core DbContext mapping
- [ ] Create and apply migrations
- [ ] Unit test repository methods

### Phase 3: Application Layer (30 minutes)
- [ ] Create CharacterService interface and implementation
- [ ] Implement all CRUD and snapshot methods
- [ ] Add DTOs for serialization
- [ ] Unit test service methods

### Phase 4: API Layer (30 minutes)
- [ ] Create CharactersController with all endpoints
- [ ] Register dependency injection
- [ ] Manual testing with Postman or curl
- [ ] Update OpenAPI spec

### Phase 5: Testing (1 hour)
- [ ] Unit tests for modifier calculation (>90% coverage)
- [ ] Integration tests for service and repository
- [ ] Controller tests for HTTP contracts
- [ ] Performance validation (<200ms per operation)

---

## Usage Examples

### Create Character

```bash
curl -X POST http://localhost:5000/api/adventures/550e8400-e29b-41d4-a716-446655440000/characters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gandalf",
    "strBase": 10,
    "dexBase": 12,
    "intBase": 18,
    "conBase": 14,
    "chaBase": 16
  }'
```

**Response (201 Created)**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Gandalf",
  "adventureId": "550e8400-e29b-41d4-a716-446655440000",
  "attributes": {
    "str": { "base": 10, "modifier": 0 },
    "dex": { "base": 12, "modifier": 1 },
    "int": { "base": 18, "modifier": 4 },
    "con": { "base": 14, "modifier": 2 },
    "cha": { "base": 16, "modifier": 3 }
  },
  "version": 1,
  "createdAt": "2026-01-28T10:00:00Z",
  "lastModifiedAt": "2026-01-28T10:00:00Z"
}
```

### Update Character

```bash
curl -X PUT http://localhost:5000/api/adventures/550e8400-e29b-41d4-a716-446655440000/characters/660e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "strBase": 12,
    "dexBase": 14,
    "intBase": 18,
    "conBase": 14,
    "chaBase": 16,
    "version": 1
  }'
```

**Response (200 OK)**: Updated character with version=2

### Create Snapshot

```bash
curl -X POST http://localhost:5000/api/characters/660e8400-e29b-41d4-a716-446655440000/snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Before Dragon Battle"
  }'
```

**Response (201 Created)**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "characterId": "660e8400-e29b-41d4-a716-446655440000",
  "label": "Before Dragon Battle",
  "createdAt": "2026-01-28T11:25:00Z",
  "attributes": { /* same as character at snapshot time */ }
}
```

---

## Testing Guide

### Unit Test Example: Modifier Calculation

```csharp
public class CharacterModifierCalculationTests
{
    [Theory]
    [InlineData(3, -4)]
    [InlineData(8, -1)]
    [InlineData(9, -1)]  // Critical: 0.5 floors to -1
    [InlineData(10, 0)]
    [InlineData(11, 0)]  // Critical: 0.5 floors to 0
    [InlineData(18, 4)]
    public void CalculateModifier_ReturnsCorrectValues(int baseValue, int expectedModifier)
    {
        // Act
        var modifier = CalculateModifierHelper(baseValue);
        
        // Assert
        Assert.Equal(expectedModifier, modifier);
    }
    
    [Fact]
    public void Create_ValidatesAttributeRange()
    {
        // Act & Assert: Should throw on value < 3
        Assert.Throws<ArgumentException>(() =>
            Character.Create("Test", Guid.NewGuid(), 2, 10, 10, 10, 10)
        );
    }
}
```

### Service Integration Test

```csharp
public class CharacterServiceTests
{
    private ICharacterService _service;
    private ICharacterRepository _mockRepository;
    
    [Fact]
    public async Task CreateAsync_PersistsCharacterWithCalculatedModifiers()
    {
        // Arrange
        var adventureId = Guid.NewGuid();
        var request = new CreateCharacterRequest
        {
            Name = "Test", StrBase = 12, DexBase = 10,
            IntBase = 14, ConBase = 11, ChaBase = 13
        };
        
        // Act
        var result = await _service.CreateAsync(adventureId, request);
        
        // Assert
        Assert.Equal(1, result.Attributes.Str.Modifier);  // (12-10)/2 = 1
        Assert.Equal(0, result.Attributes.Dex.Modifier);  // (10-10)/2 = 0
        Assert.Equal(2, result.Attributes.Int.Modifier);  // (14-10)/2 = 2
        Assert.Equal(0, result.Attributes.Con.Modifier);  // (11-10)/2 = 0.5 → 0
        Assert.Equal(1, result.Attributes.Cha.Modifier);  // (13-10)/2 = 1.5 → 1
    }
}
```

---

## Deployment Checklist

- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Database migrations applied to PostgreSQL
- [ ] OpenAPI spec updated and validates
- [ ] CharactersController registered in dependency injection
- [ ] Performance tested: all operations <200ms
- [ ] Error responses return proper HTTP status codes
- [ ] Optimistic locking tested (409 Conflict scenarios)
- [ ] Snapshot creation and retrieval tested
- [ ] Adventure foreign key validation tested
- [ ] Code review completed
- [ ] Swagger UI accessible at /swagger

---

## Key Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Response time | <200ms | Per constitution |
| Test coverage | >90% | For character/service logic |
| API availability | 99.9% | Standard SLA |
| Create success | >99% | First-attempt success rate |
| Concurrent updates | Detected (409 Conflict) | Optimistic locking |

