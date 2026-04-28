using Microsoft.EntityFrameworkCore;
using ContactCenterApp.Shared.Entities;

namespace ContactCenterApp.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Campaign> Campaigns { get; set; }
    public DbSet<CampaignContact> CampaignContacts { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<CallRecord> CallRecords { get; set; }
    public DbSet<CallFlow> CallFlows { get; set; }
    public DbSet<CallTrace> CallTraces { get; set; }
    public DbSet<WorkType> WorkTypes { get; set; }
    public DbSet<SystemEvent> SystemEvents { get; set; }
    public DbSet<Integration> Integrations { get; set; }
    public DbSet<ExternalTrunk> ExternalTrunks { get; set; }
    public DbSet<DataAction> DataActions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<User>().Property(u => u.Role).HasDefaultValue("AGENT");
        modelBuilder.Entity<User>().Property(u => u.Status).HasDefaultValue("OFFLINE");
    }
}