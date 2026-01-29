using DiceEngine.Application.Models;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for orchestrating combat encounters
/// Manages combat lifecycle: initialization, turn resolution, win/loss conditions
/// </summary>
public class CombatService : ICombatService
{
    private readonly ICombatRepository _combatRepository;
    private readonly IEnemyRepository _enemyRepository;
    private readonly ICharacterRepository _characterRepository;
    private readonly IInitiativeCalculator _initiativeCalculator;
    private readonly IAttackResolver _attackResolver;
    private readonly IDamageCalculator _damageCalculator;
    private readonly IDiceService _diceService;

    public CombatService(
        ICombatRepository combatRepository,
        IEnemyRepository enemyRepository,
        ICharacterRepository characterRepository,
        IInitiativeCalculator initiativeCalculator,
        IAttackResolver attackResolver,
        IDamageCalculator damageCalculator,
        IDiceService diceService)
    {
        _combatRepository = combatRepository ?? throw new ArgumentNullException(nameof(combatRepository));
        _enemyRepository = enemyRepository ?? throw new ArgumentNullException(nameof(enemyRepository));
        _characterRepository = characterRepository ?? throw new ArgumentNullException(nameof(characterRepository));
        _initiativeCalculator = initiativeCalculator ?? throw new ArgumentNullException(nameof(initiativeCalculator));
        _attackResolver = attackResolver ?? throw new ArgumentNullException(nameof(attackResolver));
        _damageCalculator = damageCalculator ?? throw new ArgumentNullException(nameof(damageCalculator));
        _diceService = diceService ?? throw new ArgumentNullException(nameof(diceService));
    }

    /// <summary>
    /// Start a new combat encounter with specified characters and enemies
    /// </summary>
    public async Task<Result<CombatEncounter>> StartCombatAsync(
        Guid adventureId,
        IEnumerable<Guid> characterIds,
        IEnumerable<Guid> enemyIds)
    {
        try
        {
            var characterList = characterIds.ToList();
            var enemyList = enemyIds.ToList();

            // Validate inputs
            if (!characterList.Any())
                return Result<CombatEncounter>.Failure("Must include at least one player character");

            if (!enemyList.Any())
                return Result<CombatEncounter>.Failure("Must include at least one enemy");

            // Load characters
            var characters = new List<Character>();
            foreach (var charId in characterList)
            {
                var character = await _characterRepository.GetCharacterByIdAsync(charId);
                if (character == null)
                    return Result<CombatEncounter>.Failure($"Character {charId} not found");
                characters.Add(character);
            }

            // Load enemies
            var enemies = new List<Enemy>();
            foreach (var enemyId in enemyList)
            {
                var enemy = await _enemyRepository.GetEnemyByIdAsync(enemyId);
                if (enemy == null)
                    return Result<CombatEncounter>.Failure($"Enemy {enemyId} not found");
                enemies.Add(enemy);
            }

            // Create combatants
            var combatants = new List<Combatant>();

            // Add character combatants
            foreach (var character in characters)
            {
                var initiativeRoll = _initiativeCalculator.RollInitiative();
                var combatant = Combatant.CreateFromCharacter(
                    adventureId,
                    character.Name,
                    character.Id,
                    character.DexModifier,
                    16, // Default AC (medium armor + shield)
                    30, // Default health
                    initiativeRoll);
                combatants.Add(combatant);
            }

            // Add enemy combatants
            foreach (var enemy in enemies)
            {
                var initiativeRoll = _initiativeCalculator.RollInitiative();
                var combatant = Combatant.CreateFromEnemy(enemy, initiativeRoll);
                combatants.Add(combatant);
            }

            // Create the encounter
            var encounter = CombatEncounter.Create(adventureId, combatants);

            // Calculate initiative order
            var initiativeOrder = _initiativeCalculator.CalculateInitiativeOrder(combatants);

            // Start combat
            encounter.StartCombat(initiativeOrder);

            // Save to database
            await _combatRepository.AddCombatAsync(encounter);
            await _combatRepository.SaveChangesAsync();

            return Result<CombatEncounter>.Success(encounter);
        }
        catch (Exception ex)
        {
            return Result<CombatEncounter>.Failure($"Failed to start combat: {ex.Message}");
        }
    }

    /// <summary>
    /// Get the current state of a combat encounter
    /// </summary>
    public async Task<Result<CombatEncounter>> GetCombatStatusAsync(Guid combatId)
    {
        try
        {
            var combat = await _combatRepository.GetCombatByIdAsync(combatId);
            if (combat == null)
                return Result<CombatEncounter>.Failure($"Combat encounter {combatId} not found");

            return Result<CombatEncounter>.Success(combat);
        }
        catch (Exception ex)
        {
            return Result<CombatEncounter>.Failure($"Failed to get combat status: {ex.Message}");
        }
    }

    /// <summary>
    /// Resolve a player character's attack action
    /// </summary>
    public async Task<Result<(AttackAction action, CombatEncounter encounter)>> ResolveAttackAsync(
        Guid combatId,
        Guid attackingCombatantId,
        Guid targetCombatantId)
    {
        try
        {
            // Get combat
            var combat = await _combatRepository.GetCombatByIdAsync(combatId);
            if (combat == null)
                return Result<(AttackAction, CombatEncounter)>.Failure($"Combat encounter not found");

            if (combat.Status != CombatStatus.Active)
                return Result<(AttackAction, CombatEncounter)>.Failure("Combat is not active");

            // Validate it's the attacking combatant's turn
            var activeCombatant = combat.GetActiveCombatant();
            if (activeCombatant?.Id != attackingCombatantId)
                return Result<(AttackAction, CombatEncounter)>.Failure("It is not this combatant's turn");

            // Get target
            var target = combat.Combatants.FirstOrDefault(c => c.Id == targetCombatantId);
            if (target == null)
                return Result<(AttackAction, CombatEncounter)>.Failure("Target combatant not found");

            if (target.Status != CombatantStatus.Active)
                return Result<(AttackAction, CombatEncounter)>.Failure("Cannot attack defeated or fled combatant");

            // Resolve attack
            var (roll, total, isHit, isCritical) = _attackResolver.ResolveAttack(
                activeCombatant,
                target,
                5); // Default attack modifier (example: +5 from DEX modifier and proficiency)

            // Calculate damage if hit
            int damage = 0;
            string weaponName = "Longsword";
            string damageExpression = "1d8+3";

            if (isHit)
            {
                damage = _damageCalculator.CalculateDamage(damageExpression, 0, isCritical);
                target.TakeDamage(damage);
            }

            // Record the action
            var action = AttackAction.Record(
                combatId,
                activeCombatant.Id,
                target.Id,
                roll,
                5, // Attack modifier
                target.ArmorClass,
                weaponName,
                damageExpression,
                damage,
                3, // Damage modifier
                target.CurrentHealth);

            combat.RecordAction(action);

            // Check for combat end
            var outcome = combat.CheckCombatEnd();
            if (outcome != null)
            {
                combat.EndCombat(outcome.Winner);
            }

            // Advance to next turn
            combat.AdvanceToNextTurn();

            // Save changes
            await _combatRepository.UpdateCombatAsync(combat);
            await _combatRepository.SaveChangesAsync();

            return Result<(AttackAction, CombatEncounter)>.Success((action, combat));
        }
        catch (Exception ex)
        {
            return Result<(AttackAction, CombatEncounter)>.Failure($"Failed to resolve attack: {ex.Message}");
        }
    }

    /// <summary>
    /// Resolve an enemy AI turn (automatic action selection and execution)
    /// </summary>
    public async Task<Result<(AttackAction? action, CombatEncounter encounter)>> ResolveEnemyTurnAsync(
        Guid combatId)
    {
        try
        {
            // Get combat
            var combat = await _combatRepository.GetCombatByIdAsync(combatId);
            if (combat == null)
                return Result<(AttackAction?, CombatEncounter)>.Failure("Combat encounter not found");

            if (combat.Status != CombatStatus.Active)
                return Result<(AttackAction?, CombatEncounter)>.Failure("Combat is not active");

            // Get active combatant (should be enemy)
            var activeCombatant = combat.GetActiveCombatant();
            if (activeCombatant == null || activeCombatant.CombatantType != CombatantType.Enemy)
                return Result<(AttackAction?, CombatEncounter)>.Failure("Current combatant is not an enemy");

            // For now, simple behavior: attack nearest player
            var playerTargets = combat.Combatants
                .Where(c => c.CombatantType == CombatantType.Character && c.Status == CombatantStatus.Active)
                .ToList();

            if (!playerTargets.Any())
            {
                // No valid targets, combat should end
                var outcome = combat.CheckCombatEnd();
                if (outcome != null)
                {
                    combat.EndCombat(outcome.Winner);
                }
                combat.AdvanceToNextTurn();
                await _combatRepository.UpdateCombatAsync(combat);
                await _combatRepository.SaveChangesAsync();
                return Result<(AttackAction?, CombatEncounter)>.Success((null, combat));
            }

            // Select target (first player for now - TODO: improve AI)
            var target = playerTargets.First();

            // Resolve attack
            var (roll, total, isHit, isCritical) = _attackResolver.ResolveAttack(
                activeCombatant,
                target,
                2); // Enemy attack modifier

            // Calculate damage if hit
            AttackAction? action = null;
            if (isHit)
            {
                int damage = _damageCalculator.CalculateDamage("1d6+2", 0, isCritical);
                target.TakeDamage(damage);

                action = AttackAction.Record(
                    combatId,
                    activeCombatant.Id,
                    target.Id,
                    roll,
                    2, // Attack modifier
                    target.ArmorClass,
                    "Goblin Sword",
                    "1d6+2",
                    damage,
                    2, // Damage modifier
                    target.CurrentHealth);

                combat.RecordAction(action);
            }

            // Check for combat end
            var outcome2 = combat.CheckCombatEnd();
            if (outcome2 != null)
            {
                combat.EndCombat(outcome2.Winner);
            }

            // Advance to next turn
            combat.AdvanceToNextTurn();

            // Save changes
            await _combatRepository.UpdateCombatAsync(combat);
            await _combatRepository.SaveChangesAsync();

            return Result<(AttackAction?, CombatEncounter)>.Success((action, combat));
        }
        catch (Exception ex)
        {
            return Result<(AttackAction?, CombatEncounter)>.Failure($"Failed to resolve enemy turn: {ex.Message}");
        }
    }

    /// <summary>
    /// Check if combat should end and get outcome
    /// </summary>
    public async Task<CombatOutcome?> CheckCombatEndAsync(Guid combatId)
    {
        try
        {
            var combat = await _combatRepository.GetCombatByIdAsync(combatId);
            if (combat == null)
                return null;

            return combat.CheckCombatEnd();
        }
        catch
        {
            return null;
        }
    }
}
