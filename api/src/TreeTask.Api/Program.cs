using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using TreeTask.Api.Infrastructure;
using TreeTask.Api.Repositories;
using TreeTask.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(o =>
    o.InvalidModelStateResponseFactory = ctx =>
    {
        // Friendly messages: hide serializer internals and the generic "request" key.
        var errors = ctx.ModelState
            .Where(e => e.Key != "request" && e.Value!.Errors.Count > 0)
            .ToDictionary(
                e => e.Key.TrimStart('$', '.'),
                e => e.Value!.Errors.Select(x => x.ErrorMessage.StartsWith("The JSON value")
                    ? $"'{e.Key.TrimStart('$', '.')}' has an invalid value."
                    : x.ErrorMessage).ToArray());
        if (errors.Count == 0) errors["body"] = ["A valid JSON request body is required."];
        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new Microsoft.AspNetCore.Mvc.ValidationProblemDetails(errors));
    });
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=treetask.db"));
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ILookupRepository, LookupRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();

var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:4200"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Create the SQLite file and seed reference data on first run (switch to migrations if the schema starts evolving).
using (var scope = app.Services.CreateScope())
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();

app.UseExceptionHandler();
app.UseStatusCodePages(); // problem-details body for bare 404/405 etc.
app.UseCors();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

public partial class Program;
