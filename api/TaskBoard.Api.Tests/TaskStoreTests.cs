using TaskBoard.Api.Services;
using Xunit;

namespace TaskBoard.Api.Tests;

public sealed class TaskStoreTests
{
    [Fact]
    public void Create_TrimsTitleAndAddsTask()
    {
        var store = new TaskStore();

        var task = store.Create("  Write deployment docs  ");

        Assert.Equal("Write deployment docs", task.Title);
        Assert.False(task.IsComplete);
        Assert.Contains(task, store.GetAll());
    }

    [Fact]
    public void SetCompletion_UpdatesExistingTaskAndReturnsNullForUnknownId()
    {
        var store = new TaskStore();
        var task = store.Create("Ship the demo");

        var completed = store.SetCompletion(task.Id, true);

        Assert.True(completed?.IsComplete);
        Assert.Null(store.SetCompletion(Guid.NewGuid(), true));
    }

    [Fact]
    public void Delete_RemovesExistingTask()
    {
        var store = new TaskStore();
        var task = store.Create("Remove the resource group");

        Assert.True(store.Delete(task.Id));
        Assert.Null(store.Get(task.Id));
        Assert.False(store.Delete(task.Id));
    }
}
