using TreeTask.Api.Dtos;
using TreeTask.Api.Infrastructure;
using TreeTask.Api.Models;
using TreeTask.Api.Repositories;

namespace TreeTask.Api.Services;

public interface ITaskService
{
    Task<IReadOnlyList<TaskResponse>> ListAsync(TaskState? status, string? assigneeId);
    Task<TaskResponse> GetAsync(Guid id);
    Task<TaskResponse> CreateAsync(CreateTaskRequest request);
    Task<TaskResponse> ReassignAsync(Guid id, AssignTaskRequest request);
    Task<TaskResponse> UpdateStatusAsync(Guid id, UpdateStatusRequest request);
    Task<List<Tree>> GetTreesAsync();
    Task<List<Worker>> GetWorkersAsync();
}

public class TaskService(ITaskRepository tasks, ILookupRepository lookup) : ITaskService
{
    // Allowed transitions. Completed is terminal; Suspended can be resumed.
    private static readonly Dictionary<TaskState, TaskState[]> Transitions = new()
    {
        [TaskState.Pending] = [TaskState.InProgress],
        [TaskState.InProgress] = [TaskState.Completed, TaskState.Suspended],
        [TaskState.Suspended] = [TaskState.InProgress],
        [TaskState.Completed] = [],
    };

    public Task<List<Tree>> GetTreesAsync() => lookup.GetTreesAsync();
    public Task<List<Worker>> GetWorkersAsync() => lookup.GetWorkersAsync();

    public async Task<IReadOnlyList<TaskResponse>> ListAsync(TaskState? status, string? assigneeId)
    {
        var filtered = (await tasks.GetAllAsync())
            .Where(t => status is null || t.Status == status)
            .Where(t => string.IsNullOrEmpty(assigneeId) || t.AssigneeId == assigneeId);
        return await ToResponsesAsync(filtered);
    }

    public async Task<TaskResponse> GetAsync(Guid id) => (await ToResponsesAsync([await FindAsync(id)]))[0];

    public async Task<TaskResponse> CreateAsync(CreateTaskRequest request)
    {
        var tree = await FindTreeAsync(request.TreeId);
        var worker = await FindWorkerAsync(request.AssigneeId);
        var task = new FieldTask
        {
            TreeId = tree.Id,
            Type = request.Type!.Value,
            Description = request.Description?.Trim(),
            AssigneeId = worker.Id,
        };
        await tasks.AddAsync(task);
        return (await ToResponsesAsync([task]))[0];
    }

    public async Task<TaskResponse> ReassignAsync(Guid id, AssignTaskRequest request)
    {
        var task = await FindAsync(id);
        if (task.Status == TaskState.Completed)
            throw new BusinessRuleException("A completed task cannot be reassigned.");
        task.AssigneeId = (await FindWorkerAsync(request.AssigneeId)).Id;
        task.UpdatedAtUtc = DateTime.UtcNow;
        await tasks.SaveAsync();
        return (await ToResponsesAsync([task]))[0];
    }

    public async Task<TaskResponse> UpdateStatusAsync(Guid id, UpdateStatusRequest request)
    {
        var task = await FindAsync(id);
        var next = request.Status!.Value;
        var feedback = request.Feedback?.Trim();

        if (!Transitions[task.Status].Contains(next))
            throw new BusinessRuleException($"Cannot move a task from {task.Status} to {next}.");
        if (next == TaskState.Suspended && string.IsNullOrEmpty(feedback))
            throw new BusinessRuleException("Feedback is required when suspending a task (state the blocker).");

        task.Status = next;
        if (!string.IsNullOrEmpty(feedback)) task.Feedback = feedback;
        task.UpdatedAtUtc = DateTime.UtcNow;
        await tasks.SaveAsync();
        return (await ToResponsesAsync([task]))[0];
    }

    private async Task<FieldTask> FindAsync(Guid id) =>
        await tasks.GetAsync(id) ?? throw new NotFoundException($"Task {id} was not found.");

    private async Task<Tree> FindTreeAsync(string id) =>
        (await lookup.GetTreesAsync()).FirstOrDefault(t => t.Id == id) ?? throw new NotFoundException($"Tree '{id}' was not found.");

    private async Task<Worker> FindWorkerAsync(string id) =>
        (await lookup.GetWorkersAsync()).FirstOrDefault(w => w.Id == id) ?? throw new NotFoundException($"Field worker '{id}' was not found.");

    private async Task<IReadOnlyList<TaskResponse>> ToResponsesAsync(IEnumerable<FieldTask> items)
    {
        var trees = (await lookup.GetTreesAsync()).ToDictionary(t => t.Id);
        var workers = (await lookup.GetWorkersAsync()).ToDictionary(w => w.Id);
        return items.Select(t =>
        {
            var tree = trees[t.TreeId];
            var worker = workers[t.AssigneeId];
            return new TaskResponse(t.Id, tree.Id, tree.Species, tree.Location, t.Type, t.Description,
                worker.Id, worker.Name, t.Status, t.Feedback, t.CreatedAtUtc, t.UpdatedAtUtc);
        }).ToList();
    }
}
