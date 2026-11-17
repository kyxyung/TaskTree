using Microsoft.AspNetCore.Mvc;
using TreeTask.Api.Dtos;
using TreeTask.Api.Models;
using TreeTask.Api.Services;

namespace TreeTask.Api.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController(ITaskService service) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<TaskResponse>> List([FromQuery] TaskState? status, [FromQuery] string? assigneeId) =>
        service.ListAsync(status, assigneeId);

    [HttpGet("{id:guid}")]
    public Task<TaskResponse> Get(Guid id) => service.GetAsync(id);

    [HttpPost]
    public async Task<IActionResult> Create(CreateTaskRequest request)
    {
        var task = await service.CreateAsync(request);
        return CreatedAtAction(nameof(Get), new { id = task.Id }, task);
    }

    [HttpPut("{id:guid}/assignee")]
    public Task<TaskResponse> Reassign(Guid id, AssignTaskRequest request) => service.ReassignAsync(id, request);

    [HttpPatch("{id:guid}/status")]
    public Task<TaskResponse> UpdateStatus(Guid id, UpdateStatusRequest request) => service.UpdateStatusAsync(id, request);
}

[ApiController]
[Route("api")]
public class LookupController(ITaskService service) : ControllerBase
{
    [HttpGet("trees")]
    public Task<List<Tree>> Trees() => service.GetTreesAsync();

    [HttpGet("workers")]
    public Task<List<Worker>> Workers() => service.GetWorkersAsync();
}
