using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Statistic> Statistics => Set<Statistic>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasOne(u => u.Statistic)
            .WithOne(s => s.User)
            .HasForeignKey<Statistic>(s => s.UserId);

        base.OnModelCreating(modelBuilder);
    }
}
