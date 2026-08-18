using DentZone.Application.Common.Interfaces;
using DentZone.Domain.Common;
using DentZone.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DentZone.Persistence
{
    public class DentZoneContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid,
        IdentityUserClaim<Guid>, IdentityUserRole<Guid>, IdentityUserLogin<Guid>,
        IdentityRoleClaim<Guid>, IdentityUserToken<Guid>>, IDentZoneContext
    {

        private readonly ICurrentUserService? _currentUserService;
        public DentZoneContext(ICurrentUserService? currentUserService, DbContextOptions<DentZoneContext> options)
            : base(options)
        {
            _currentUserService = currentUserService;
        }

        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Vendor> Vendors => Set<Vendor>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<Advertisement> Advertisements => Set<Advertisement>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();

        protected override void OnConfiguring(DbContextOptionsBuilder builder)
        {
            builder.ConfigureWarnings(action =>
            {
                action.Ignore(CoreEventId.InvalidIncludePathError);
            });
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.ApplyConfigurationsFromAssembly(typeof(DentZoneContext).Assembly,
                type => type.Namespace is not null && type.Namespace.EndsWith("Configurations"));

            builder.HasDefaultSchema("public");

            builder.HasPostgresExtension("postgis");
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService?.UserId.ToString() ?? "System";

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.MarkAsCreated(userId);
                        break;
                    case EntityState.Modified:
                        entry.Entity.MarkAsUpdated(userId);
                        break;
                    case EntityState.Deleted:
                        entry.State = EntityState.Modified;
                        entry.Entity.MarkAsDeleted(userId);
                        break;
                }
            }

            foreach (var entry in ChangeTracker.Entries<ApplicationUser>().Where(e => e.State != EntityState.Detached))
            {
                var user = entry.Entity;
                switch (entry.State)
                {
                    case EntityState.Added:
                        user.MarkAsCreated(userId);
                        break;
                    case EntityState.Modified:
                        user.MarkAsUpdated(userId);
                        break;
                    case EntityState.Deleted:
                        entry.State = EntityState.Modified;
                        user.MarkAsDeleted(userId);
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}