using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using TaskBoard.Api.Models;
using TaskBoard.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<TaskStore>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapGet("/api/tasks", (TaskStore tasks) => Results.Ok(tasks.GetAll()));

app.MapGet("/api/tasks/{id:guid}", (Guid id, TaskStore tasks) =>
{
    var task = tasks.Get(id);
    return task is null ? Results.NotFound() : Results.Ok(task);
});

app.MapPost("/api/tasks", (CreateTaskRequest request, TaskStore tasks) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            [nameof(request.Title)] = ["A task title is required."]
        });
    }

    var task = tasks.Create(request.Title);
    return Results.Created($"/api/tasks/{task.Id}", task);
});

app.MapPut("/api/tasks/{id:guid}", (Guid id, UpdateTaskRequest request, TaskStore tasks) =>
{
    var task = tasks.SetCompletion(id, request.IsComplete);
    return task is null ? Results.NotFound() : Results.Ok(task);
});

app.MapDelete("/api/tasks/{id:guid}", (Guid id, TaskStore tasks) =>
    tasks.Delete(id) ? Results.NoContent() : Results.NotFound());

app.MapHealthChecks("/health/live", new HealthCheckOptions());
app.MapHealthChecks("/health/ready", new HealthCheckOptions());

app.Run();
