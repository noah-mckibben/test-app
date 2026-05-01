using Microsoft.EntityFrameworkCore;
using ContactCenterApp.Shared.Entities;

namespace ContactCenterApp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

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

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.Username).IsRequired();
                entity.Property(e => e.PasswordHash).IsRequired();
            });

            modelBuilder.Entity<Campaign>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });

            modelBuilder.Entity<CampaignContact>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CampaignId);
                entity.Property(e => e.PhoneNumber).IsRequired();
            });

            modelBuilder.Entity<Contact>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.Property(e => e.PhoneNumber).IsRequired();
            });

            modelBuilder.Entity<CallRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CallSid);
                entity.Property(e => e.CallSid).IsRequired();
            });

            modelBuilder.Entity<CallFlow>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });

            modelBuilder.Entity<CallTrace>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CallSid);
                entity.Property(e => e.CallSid).IsRequired();
            });

            modelBuilder.Entity<WorkType>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });

            modelBuilder.Entity<SystemEvent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EventType).IsRequired();
            });

            modelBuilder.Entity<Integration>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });

            modelBuilder.Entity<ExternalTrunk>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });

            modelBuilder.Entity<DataAction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });
        }
    }
}