using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;

namespace DiceEngine.Application.Services;

/// <summary>
/// Service for resolving quest dependencies.
/// </summary>
public class DependencyResolver : IDependencyResolver
{
    private readonly IQuestRepository _repository;
    private Dictionary<Guid, List<QuestDependency>>? _dependencyCache;

    public DependencyResolver(IQuestRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<(bool AllMet, List<string> UnmetReasons)> CheckPrerequisitesAsync(
        Guid playerId,
        Guid questId,
        CancellationToken cancellationToken = default)
    {
        var dependencies = await _repository.GetQuestDependenciesAsync(questId, cancellationToken);
        if (!dependencies.Any())
        {
            return (true, new List<string>());
        }

        var unmetReasons = new List<string>();

        foreach (var dependency in dependencies)
        {
            var prerequisiteProgress = await _repository.GetQuestProgressAsync(
                playerId,
                dependency.PrerequisiteQuestId,
                cancellationToken);

            var isMet = dependency.Type switch
            {
                DependencyType.MustComplete =>
                    prerequisiteProgress != null && prerequisiteProgress.Status == QuestProgressStatus.Completed,

                DependencyType.MustNotFail =>
                    prerequisiteProgress == null || prerequisiteProgress.Status != QuestProgressStatus.Failed,

                _ => false
            };

            if (!isMet)
            {
                var prerequisiteQuest = dependency.PrerequisiteQuest;
                var reason = dependency.Type switch
                {
                    DependencyType.MustComplete => $"Must complete '{prerequisiteQuest.Name}' first",
                    DependencyType.MustNotFail => $"Cannot have failed '{prerequisiteQuest.Name}'",
                    _ => $"Prerequisite '{prerequisiteQuest.Name}' not met"
                };
                unmetReasons.Add(reason);
            }
        }

        return (unmetReasons.Count == 0, unmetReasons);
    }

    public async Task<QuestDependencyInfoDto> GetDependencyInfoAsync(
        Guid questId,
        Guid? playerId = null,
        CancellationToken cancellationToken = default)
    {
        var dependencies = await _repository.GetQuestDependenciesAsync(questId, cancellationToken);

        var prerequisites = new List<PrerequisiteDto>();
        bool? allMet = null;

        if (playerId.HasValue)
        {
            allMet = true;
        }

        foreach (var dependency in dependencies)
        {
            string? playerStatus = null;

            if (playerId.HasValue)
            {
                var progress = await _repository.GetQuestProgressAsync(
                    playerId.Value,
                    dependency.PrerequisiteQuestId,
                    cancellationToken);

                playerStatus = progress?.Status.ToString() ?? "NotStarted";

                // Check if prerequisite is met
                var isMet = dependency.Type switch
                {
                    DependencyType.MustComplete => progress != null && progress.Status == QuestProgressStatus.Completed,
                    DependencyType.MustNotFail => progress == null || progress.Status != QuestProgressStatus.Failed,
                    _ => false
                };

                if (!isMet)
                {
                    allMet = false;
                }
            }

            prerequisites.Add(new PrerequisiteDto
            {
                PrerequisiteQuestId = dependency.PrerequisiteQuestId,
                QuestName = dependency.PrerequisiteQuest.Name,
                DependencyType = dependency.Type.ToString(),
                PlayerStatus = playerStatus
            });
        }

        return new QuestDependencyInfoDto
        {
            QuestId = questId,
            Prerequisites = prerequisites,
            AllPrerequisitesMet = allMet
        };
    }

    public async Task<bool> ValidateDependencyGraphAsync(CancellationToken cancellationToken = default)
    {
        var allDependencies = await _repository.GetAllDependenciesAsync(cancellationToken);

        // Build adjacency list
        var graph = new Dictionary<Guid, List<Guid>>();
        foreach (var dep in allDependencies)
        {
            if (!graph.ContainsKey(dep.DependentQuestId))
            {
                graph[dep.DependentQuestId] = new List<Guid>();
            }
            graph[dep.DependentQuestId].Add(dep.PrerequisiteQuestId);
        }

        // Check for cycles using DFS
        var visited = new HashSet<Guid>();
        var recursionStack = new HashSet<Guid>();

        foreach (var questId in graph.Keys)
        {
            if (HasCycle(questId, graph, visited, recursionStack))
            {
                return false; // Cycle detected
            }
        }

        return true; // No cycles, valid DAG
    }

    public async Task LoadDependencyGraphAsync(CancellationToken cancellationToken = default)
    {
        var allDependencies = await _repository.GetAllDependenciesAsync(cancellationToken);

        _dependencyCache = new Dictionary<Guid, List<QuestDependency>>();
        foreach (var dep in allDependencies)
        {
            if (!_dependencyCache.ContainsKey(dep.DependentQuestId))
            {
                _dependencyCache[dep.DependentQuestId] = new List<QuestDependency>();
            }
            _dependencyCache[dep.DependentQuestId].Add(dep);
        }
    }

    private static bool HasCycle(
        Guid questId,
        Dictionary<Guid, List<Guid>> graph,
        HashSet<Guid> visited,
        HashSet<Guid> recursionStack)
    {
        if (recursionStack.Contains(questId))
        {
            return true; // Cycle detected
        }

        if (visited.Contains(questId))
        {
            return false; // Already processed
        }

        visited.Add(questId);
        recursionStack.Add(questId);

        if (graph.ContainsKey(questId))
        {
            foreach (var prerequisite in graph[questId])
            {
                if (HasCycle(prerequisite, graph, visited, recursionStack))
                {
                    return true;
                }
            }
        }

        recursionStack.Remove(questId);
        return false;
    }
}
