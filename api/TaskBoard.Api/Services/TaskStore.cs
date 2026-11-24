using System.Collections.Concurrent;
using TaskBoard.Api.Models;

namespace TaskBoard.Api.Services;

public sealed class TaskStore
{
    private readonly ConcurrentDictionary<Guid, TaskItem> _tasks = new();

    public TaskStore()
    {
        Create("Review the AKS deployment", false);
        Create("Add monitoring and alerts", false);
    }

    public IReadOnlyCollection<TaskItem> GetAll() =>
        _tasks.Values.OrderByDescending(task => task.CreatedAtUtc).ToArray();

    public TaskItem? Get(Guid id) =>
        _tasks.TryGetValue(id, out var task) ? task : null;

    public TaskItem Create(string title, bool isComplete = false)
    {
        var task = new TaskItem(Guid.NewGuid(), title.Trim(), isComplete, DateTimeOffset.UtcNow);
        _tasks[task.Id] = task;
        return task;
    }

    public TaskItem? SetCompletion(Guid id, bool isComplete)
    {
        while (_tasks.TryGetValue(id, out var current))
        {
            var updated = current with { IsComplete = isComplete };
            if (_tasks.TryUpdate(id, updated, current))
            {
                return updated;
            }
        }

        return null;
    }

    public bool Delete(Guid id) => _tasks.TryRemove(id, out _);
}
