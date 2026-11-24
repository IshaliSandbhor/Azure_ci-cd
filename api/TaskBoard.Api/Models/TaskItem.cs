namespace TaskBoard.Api.Models;

public sealed record TaskItem(Guid Id, string Title, bool IsComplete, DateTimeOffset CreatedAtUtc);
