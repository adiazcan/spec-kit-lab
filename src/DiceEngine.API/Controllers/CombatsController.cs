using DiceEngine.API.Models;
using DiceEngine.Application.Services;
using DiceEngine.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace DiceEngine.API.Controllers;

/// <summary>
/// Combat encounter management and turn resolution endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CombatsController : ControllerBase
{
    private readonly ICombatService _combatService;
    private readonly ICombatRepository _combatRepository;

    public CombatsController(
        ICombatService combatService,
        ICombatRepository combatRepository)
    {
        _combatService = combatService ?? throw new ArgumentNullException(nameof(combatService));
        _combatRepository = combatRepository ?? throw new ArgumentNullException(nameof(combatRepository));
    }

    /// <summary>
    /// Initiate a new combat encounter between player characters and enemies
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CombatStateResponse>> InitiateCombat(
        [FromBody] InitiateCombatRequest request)
    {
        if (request.AdventureId == Guid.Empty)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "AdventureId is required" });

        if (request.CharacterIds == null || !request.CharacterIds.Any())
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "At least one character is required" });

        if (request.EnemyIds == null || !request.EnemyIds.Any())
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "At least one enemy is required" });

        var result = await _combatService.StartCombatAsync(
            request.AdventureId,
            request.CharacterIds,
            request.EnemyIds);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = result.Error });

            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = result.Error });
        }

        var response = MapCombatEncounterToResponse(result.Value);
        return CreatedAtAction(nameof(GetCombat), new { id = result.Value.Id }, response);
    }

    /// <summary>
    /// Get the current state of a combat encounter
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CombatStateResponse>> GetCombat(Guid id)
    {
        var result = await _combatService.GetCombatStatusAsync(id);

        if (!result.IsSuccess)
            return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = result.Error });

        var response = MapCombatEncounterToResponse(result.Value);
        return Ok(response);
    }

    /// <summary>
    /// Resolve a player character's attack action during their turn
    /// </summary>
    [HttpPost("{id}/turns")]
    public async Task<ActionResult<CombatStateResponse>> ResolveTurn(
        Guid id,
        [FromBody] ResolveTurnRequest request)
    {
        if (request.AttackingCombatantId == Guid.Empty)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "AttackingCombatantId is required" });

        if (request.TargetCombatantId == Guid.Empty)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "TargetCombatantId is required" });

        var result = await _combatService.ResolveAttackAsync(
            id,
            request.AttackingCombatantId,
            request.TargetCombatantId);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = result.Error });

            if (result.Error.Contains("not your turn", StringComparison.OrdinalIgnoreCase) ||
                result.Error.Contains("not active", StringComparison.OrdinalIgnoreCase))
                return Conflict(new ErrorResponse { Code = "CONFLICT", Message = result.Error });

            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = result.Error });
        }

        var encounter = result.Value.encounter;
        var response = MapCombatEncounterToResponse(encounter);
        return Ok(response);
    }

    /// <summary>
    /// Resolve an enemy AI turn during their turn slot
    /// </summary>
    [HttpPost("{id}/enemy-turn")]
    public async Task<ActionResult<CombatStateResponse>> ResolveEnemyTurn(Guid id)
    {
        var result = await _combatService.ResolveEnemyTurnAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = result.Error });

            return Conflict(new ErrorResponse { Code = "CONFLICT", Message = result.Error });
        }

        var encounter = result.Value.encounter;
        var response = MapCombatEncounterToResponse(encounter);
        return Ok(response);
    }

    /// <summary>
    /// Get combat history (list of actions taken in a combat)
    /// </summary>
    [HttpGet("{id}/actions")]
    public async Task<ActionResult<CombatHistoryResponse>> GetCombatHistory(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "Page must be >= 1" });

        if (pageSize < 1 || pageSize > 100)
            return BadRequest(new ErrorResponse { Code = "INVALID_REQUEST", Message = "PageSize must be between 1 and 100" });

        var combat = await _combatRepository.GetCombatByIdAsync(id);
        if (combat == null)
            return NotFound(new ErrorResponse { Code = "NOT_FOUND", Message = "Combat encounter not found" });

        var totalActions = combat.CompletedActions.Count;
        var actions = combat.CompletedActions
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new CombatHistoryResponse
        {
            CombatId = id,
            TotalActions = totalActions,
            Page = page,
            PageSize = pageSize,
            Actions = actions.Select(MapAttackActionToResponse).ToList()
        };

        return Ok(response);
    }

    private static CombatStateResponse MapCombatEncounterToResponse(CombatEncounter combat)
    {
        return new CombatStateResponse
        {
            Id = combat.Id,
            AdventureId = combat.AdventureId,
            Status = combat.Status.ToString(),
            CurrentRound = combat.CurrentRound,
            CurrentTurnIndex = combat.CurrentTurnIndex,
            Combatants = combat.Combatants.Select(c => new CombatantDto
            {
                Id = c.Id,
                DisplayName = c.DisplayName,
                CurrentHealth = c.CurrentHealth,
                MaxHealth = c.MaxHealth,
                ArmorClass = c.ArmorClass,
                Status = c.Status.ToString(),
                Type = c.CombatantType.ToString(),
                InitiativeScore = c.InitiativeScore
            }).ToList(),
            TurnOrder = combat.InitiativeOrder,
            Winner = combat.Winner?.ToString(),
            StartedAt = combat.StartedAt,
            EndedAt = combat.EndedAt
        };
    }

    private AttackActionResponse MapAttackActionToResponse(Domain.ValueObjects.AttackAction action)
    {
        return new AttackActionResponse
        {
            Id = action.Id,
            AttackerId = action.AttackerId,
            AttackerName = "Attacker",
            TargetId = action.TargetId,
            TargetName = "Target",
            AttackRoll = action.AttackRoll,
            AttackTotal = action.AttackTotal,
            TargetAC = action.TargetAC,
            IsHit = action.IsHit,
            IsCriticalHit = action.IsCriticalHit,
            WeaponName = action.WeaponName,
            DamageExpression = action.DamageExpression,
            TotalDamage = action.TotalDamage,
            TargetHealthAfter = action.TargetHealthAfter,
            Timestamp = action.Timestamp
        };
    }
}
