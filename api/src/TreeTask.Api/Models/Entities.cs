namespace TreeTask.Api.Models;

/// <summary>A tree that was already purchased and tagged.</summary>
public record Tree(string Id, string Species, string Location);

public record Worker(string Id, string Name);

public class FieldTask
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string TreeId { get; init; }
    public required TaskType Type { get; init; }
    public string? Description { get; set; }
    public required string AssigneeId { get; set; }
    public TaskState Status { get; set; } = TaskState.Pending;
    public string? Feedback { get; set; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
