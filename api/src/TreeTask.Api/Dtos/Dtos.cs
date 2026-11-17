using System.ComponentModel.DataAnnotations;
using TreeTask.Api.Models;

namespace TreeTask.Api.Dtos;

public class CreateTaskRequest
{
    [Required, StringLength(50)]
    public string TreeId { get; set; } = "";

    [Required, EnumDataType(typeof(TaskType))]
    public TaskType? Type { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [Required, StringLength(50)]
    public string AssigneeId { get; set; } = "";
}

public class AssignTaskRequest
{
    [Required, StringLength(50)]
    public string AssigneeId { get; set; } = "";
}

public class UpdateStatusRequest
{
    [Required, EnumDataType(typeof(TaskState))]
    public TaskState? Status { get; set; }

    [StringLength(1000)]
    public string? Feedback { get; set; }
}

public record TaskResponse(
    Guid Id, string TreeId, string TreeSpecies, string TreeLocation, TaskType Type, string? Description,
    string AssigneeId, string AssigneeName, TaskState Status, string? Feedback,
    DateTime CreatedAtUtc, DateTime UpdatedAtUtc);
