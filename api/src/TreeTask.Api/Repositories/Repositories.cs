using Microsoft.EntityFrameworkCore;
using TreeTask.Api.Models;

namespace TreeTask.Api.Repositories;

public interface ITaskRepository
{
    Task<List<FieldTask>> GetAllAsync();
    Task<FieldTask?> GetAsync(Guid id);
    Task AddAsync(FieldTask task);
    Task SaveAsync();
}

/// <summary>Reference data (trees and workers).</summary>
public interface ILookupRepository
{
    Task<List<Tree>> GetTreesAsync();
    Task<List<Worker>> GetWorkersAsync();
}

public class TaskRepository(AppDbContext db) : ITaskRepository
{
    public Task<List<FieldTask>> GetAllAsync() => db.Tasks.OrderByDescending(t => t.CreatedAtUtc).ToListAsync();
    public Task<FieldTask?> GetAsync(Guid id) => db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
    public async Task AddAsync(FieldTask task) { db.Tasks.Add(task); await db.SaveChangesAsync(); }
    public Task SaveAsync() => db.SaveChangesAsync();
}

public class LookupRepository(AppDbContext db) : ILookupRepository
{
    public Task<List<Tree>> GetTreesAsync() => db.Trees.AsNoTracking().OrderBy(t => t.Id).ToListAsync();
    public Task<List<Worker>> GetWorkersAsync() => db.Workers.AsNoTracking().OrderBy(w => w.Id).ToListAsync();
}
