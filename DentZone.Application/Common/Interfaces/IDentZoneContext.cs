using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Common.Interfaces
{
    public interface IDentZoneContext: IAsyncDisposable
    {
        DbSet<ApplicationUser> Users { get; }
        DbSet<Category> Categories { get; }
        DbSet<Vendor> Vendors { get; }
        DbSet<Product> Products { get; }
        DbSet<Advertisement> Advertisements { get; }
        DbSet<Review> Reviews { get; }
        DbSet<WishlistItem> WishlistItems { get; }
        DbSet<Order> Orders { get; }
        DbSet<OrderLine> OrderLines { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
