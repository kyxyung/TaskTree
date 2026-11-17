using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TreeTask.Api.Tests;

public class ApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory
        .WithWebHostBuilder(b => b.UseSetting("ConnectionStrings:Default", $"Data Source={Path.GetTempFileName()}"))
        .CreateClient();

    private async Task<Guid> CreateTask(string tree = "TREE-01", string worker = "W-01")
    {
        var res = await _client.PostAsJsonAsync("/api/tasks", new { treeId = tree, type = "Pruning", assigneeId = worker });
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<Dictionary<string, System.Text.Json.JsonElement>>())!["id"].GetGuid();
    }

    private Task<HttpResponseMessage> Move(Guid id, string status, string? feedback = null) =>
        _client.PatchAsJsonAsync($"/api/tasks/{id}/status", new { status, feedback });

    [Fact]
    public async Task Created_task_is_pending_and_visible_to_assignee()
    {
        var id = await CreateTask(worker: "W-02");
        var list = await _client.GetFromJsonAsync<List<Dictionary<string, System.Text.Json.JsonElement>>>("/api/tasks?assigneeId=W-02");
        Assert.Contains(list!, t => t["id"].GetGuid() == id && t["status"].GetString() == "Pending");
    }

    [Theory]
    [InlineData("", "Pruning", "W-01", HttpStatusCode.BadRequest)]          // missing tree
    [InlineData("TREE-01", "Gardening", "W-01", HttpStatusCode.BadRequest)] // invalid type
    [InlineData("TREE-99", "Pruning", "W-01", HttpStatusCode.NotFound)]     // unknown tree
    [InlineData("TREE-01", "Pruning", "W-99", HttpStatusCode.NotFound)]     // unknown worker
    public async Task Create_rejects_invalid_input(string tree, string type, string worker, HttpStatusCode expected)
    {
        var res = await _client.PostAsJsonAsync("/api/tasks", new { treeId = tree, type, assigneeId = worker });
        Assert.Equal(expected, res.StatusCode);
    }

    [Fact]
    public async Task Happy_path_pending_to_completed()
    {
        var id = await CreateTask();
        Assert.Equal(HttpStatusCode.OK, (await Move(id, "InProgress")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Move(id, "Completed", "Done")).StatusCode);
    }

    [Fact]
    public async Task Cannot_skip_states()
    {
        var id = await CreateTask();
        Assert.Equal(HttpStatusCode.Conflict, (await Move(id, "Completed")).StatusCode);
    }

    [Fact]
    public async Task Suspend_requires_feedback_and_can_resume()
    {
        var id = await CreateTask();
        await Move(id, "InProgress");
        Assert.Equal(HttpStatusCode.Conflict, (await Move(id, "Suspended")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Move(id, "Suspended", "Road blocked")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Move(id, "InProgress")).StatusCode);
    }

    [Fact]
    public async Task Completed_task_is_terminal()
    {
        var id = await CreateTask();
        await Move(id, "InProgress");
        await Move(id, "Completed");
        Assert.Equal(HttpStatusCode.Conflict, (await Move(id, "InProgress")).StatusCode);
        var res = await _client.PutAsJsonAsync($"/api/tasks/{id}/assignee", new { assigneeId = "W-02" });
        Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
    }

    [Fact]
    public async Task Unknown_task_returns_404_problem()
    {
        var res = await Move(Guid.NewGuid(), "InProgress");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
        Assert.Contains("problem+json", res.Content.Headers.ContentType!.ToString());
    }
}
