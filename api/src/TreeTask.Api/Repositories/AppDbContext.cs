using Microsoft.EntityFrameworkCore;
using TreeTask.Api.Models;

namespace TreeTask.Api.Repositories;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Tree> Trees => Set<Tree>();
    public DbSet<Worker> Workers => Set<Worker>();
    public DbSet<FieldTask> Tasks => Set<FieldTask>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Tree>().HasKey(t => t.Id);
        b.Entity<Worker>().HasKey(w => w.Id);
        b.Entity<FieldTask>(e =>
        {
            e.Property(t => t.Type).HasConversion<string>();
            e.Property(t => t.Status).HasConversion<string>();
            e.HasIndex(t => t.AssigneeId);
        });

        // Seed reference data: trees are already purchased and tagged.
        b.Entity<Tree>().HasData(
            new Tree("TREE-01", "Angsana", "Block A, Jalan Taman 1"),
            new Tree("TREE-02", "Rain Tree", "Block A, Central Park"),
            new Tree("TREE-03", "Tembusu", "Block B, Lake Garden"),
            new Tree("TREE-04", "Yellow Flame", "Block B, Main Entrance"),
            new Tree("TREE-05", "Mahogany", "Block C, Riverside Walk"),
            new Tree("TREE-06", "Frangipani", "Block C, Playground"));
        b.Entity<Worker>().HasData(
            new Worker("W-01", "Ahmad Faiz"),
            new Worker("W-02", "Lim Wei Jie"),
            new Worker("W-03", "Siti Nurhaliza"));
    }
}
