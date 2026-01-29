using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents a complete combat encounter with all participants, turn order, and state
/// Aggregate Root for the Combat domain
/// </summary>
public class CombatEncounter
{
    // Identity
    public Guid Id { get; private set; }
    public Guid AdventureId { get; private set; }
    
    // State
    public CombatStatus Status { get; private set; } = CombatStatus.NotStarted;
    public int CurrentRound { get; private set; } = 1;
    public int CurrentTurnIndex { get; private set; } = 0;
    
    // Participants (navigation property)
    public ICollection<Combatant> Combatants { get; private set; } = new List<Combatant>();
    
    // Initiative Order (list of Combatant IDs in order)
    public List<Guid> InitiativeOrder { get; private set; } = new();
    
    // History of actions
    public ICollection<AttackAction> CompletedActions { get; private set; } = new List<AttackAction>();
    
    // Results
    public CombatSide? Winner { get; private set; }
    
    // Audit
    public DateTime StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }
    
    // Concurrency
    public uint Version { get; private set; } = 1;

    // Computed Properties
    public Guid? CurrentActiveCombatantId
    {
        get
        {
            if (Status != CombatStatus.Active || CurrentTurnIndex >= InitiativeOrder.Count)
                return null;
            return InitiativeOrder[CurrentTurnIndex];
        }
    }

    // Private constructor for EF Core
    private CombatEncounter()
    {
    }

    /// <summary>
    /// Factory method to create a new CombatEncounter
    /// </summary>
    public static CombatEncounter Create(
        Guid adventureId,
        IEnumerable<Combatant> combatants)
    {
        var combatantList = combatants.ToList();
        
        // Validate we have combatants
        if (!combatantList.Any())
            throw new ArgumentException("Combat encounter must have at least one combatant", nameof(combatants));

        // Validate that we have at least one character and one enemy
        var hasCharacter = combatantList.Any(c => c.CombatantType == CombatantType.Character);
        var hasEnemy = combatantList.Any(c => c.CombatantType == CombatantType.Enemy);
        
        if (!hasCharacter || !hasEnemy)
            throw new ArgumentException("Combat encounter must have at least one character and one enemy", nameof(combatants));

        // Validate no defeated combatants at start
        if (combatantList.Any(c => c.Status != CombatantStatus.Active))
            throw new ArgumentException("All combatants must be active at combat start", nameof(combatants));

        var encounter = new CombatEncounter
        {
            Id = Guid.NewGuid(),
            AdventureId = adventureId,
            Status = CombatStatus.NotStarted,
            CurrentRound = 1,
            CurrentTurnIndex = 0,
            StartedAt = DateTime.UtcNow,
            Version = 1
        };

        // Add combatants and set their encounter ID
        foreach (var combatant in combatantList)
        {
            combatant.SetCombatEncounterId(encounter.Id);
            encounter.Combatants.Add(combatant);
        }

        return encounter;
    }

    /// <summary>
    /// Start combat by calculating initiative and setting turn order
    /// </summary>
    public void StartCombat(List<Guid> initiativeOrder)
    {
        if (Status != CombatStatus.NotStarted)
            throw new InvalidOperationException("Combat has already started");

        InitiativeOrder.Clear();
        InitiativeOrder.AddRange(initiativeOrder);
        Status = CombatStatus.Active;
        CurrentRound = 1;
        CurrentTurnIndex = 0;
        IncrementVersion();
    }

    /// <summary>
    /// Get the currently active combatant
    /// </summary>
    public Combatant? GetActiveCombatant()
    {
        var activeCombatantId = CurrentActiveCombatantId;
        if (activeCombatantId == null)
            return null;

        return Combatants.FirstOrDefault(c => c.Id == activeCombatantId);
    }

    /// <summary>
    /// Advance to the next combatant's turn
    /// Handles round advancement and skips defeated/fled combatants
    /// </summary>
    public void AdvanceToNextTurn()
    {
        CurrentTurnIndex++;

        // Skip defeated or fled combatants
        while (CurrentTurnIndex < InitiativeOrder.Count)
        {
            var combatantId = InitiativeOrder[CurrentTurnIndex];
            var combatant = Combatants.FirstOrDefault(c => c.Id == combatantId);
            
            if (combatant == null)
            {
                CurrentTurnIndex++;
                continue;
            }

            if (combatant.Status == CombatantStatus.Active)
            {
                IncrementVersion();
                return;
            }

            CurrentTurnIndex++;
        }

        // If reached end of initiative order, start new round
        if (CurrentTurnIndex >= InitiativeOrder.Count)
        {
            CurrentRound++;
            CurrentTurnIndex = 0;

            // Skip defeated or fled combatants at start of new round
            while (CurrentTurnIndex < InitiativeOrder.Count)
            {
                var combatantId = InitiativeOrder[CurrentTurnIndex];
                var combatant = Combatants.FirstOrDefault(c => c.Id == combatantId);
                
                if (combatant != null && combatant.Status == CombatantStatus.Active)
                {
                    break;
                }

                CurrentTurnIndex++;
            }
        }

        IncrementVersion();
    }

    /// <summary>
    /// Check if combat should end and determine winner
    /// </summary>
    public CombatOutcome? CheckCombatEnd()
    {
        var activeCombatants = Combatants.Where(c => c.Status == CombatantStatus.Active).ToList();
        
        var playerCount = activeCombatants.Count(c => c.CombatantType == CombatantType.Character);
        var enemyCount = activeCombatants.Count(c => c.CombatantType == CombatantType.Enemy);

        if (playerCount == 0 && enemyCount == 0)
            return new CombatOutcome { Winner = CombatSide.Draw, RoundEnded = CurrentRound };

        if (playerCount == 0)
            return new CombatOutcome { Winner = CombatSide.Enemy, RoundEnded = CurrentRound };

        if (enemyCount == 0)
            return new CombatOutcome { Winner = CombatSide.Player, RoundEnded = CurrentRound };

        return null; // Combat continues
    }

    /// <summary>
    /// End combat with a winner
    /// </summary>
    public void EndCombat(CombatSide winner)
    {
        if (Status == CombatStatus.Completed)
            throw new InvalidOperationException("Combat has already ended");

        Status = CombatStatus.Completed;
        Winner = winner;
        EndedAt = DateTime.UtcNow;
        IncrementVersion();
    }

    /// <summary>
    /// Add an attack action to the combat history
    /// </summary>
    public void RecordAction(AttackAction action)
    {
        CompletedActions.Add(action);
    }

    /// <summary>
    /// Increment version for optimistic concurrency
    /// </summary>
    private void IncrementVersion()
    {
        Version++;
    }
}

/// <summary>
/// Value object representing the outcome of a combat encounter
/// </summary>
public record CombatOutcome
{
    public CombatSide Winner { get; init; }
    public int RoundEnded { get; init; }
}
