using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.ToTable("Orders");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.OrderNumber)
                .IsRequired();

            builder.Property(e => e.Subtotal)
                .HasPrecision(18, 2);

            builder.Property(e => e.Discount)
                .HasPrecision(18, 2);

            builder.Property(e => e.Shipping)
                .HasPrecision(18, 2);

            builder.Property(e => e.Tax)
                .HasPrecision(18, 2);

            builder.Property(e => e.Total)
                .HasPrecision(18, 2);

            builder.Property(e => e.CustomerName)
                .IsRequired();

            builder.Property(e => e.CustomerEmail)
                .IsRequired();

            builder.Property(e => e.ShippingAddress)
                .IsRequired();

            builder.Property(e => e.ShippingCity)
                .IsRequired();

            builder.Property(e => e.Status)
                .IsRequired()
                .HasConversion<string>();

            builder.HasIndex(e => e.OrderNumber).IsUnique();
            builder.HasIndex(e => e.UserId);
            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);

            builder.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(e => e.Lines)
                .WithOne(e => e.Order)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
    {
        public void Configure(EntityTypeBuilder<OrderLine> builder)
        {
            builder.ToTable("OrderLines");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.ProductName)
                .IsRequired();

            builder.Property(e => e.Image)
                .IsRequired();

            builder.Property(e => e.Price)
                .HasPrecision(18, 2);

            builder.Property(e => e.Quantity)
                .IsRequired();

            builder.HasIndex(e => e.OrderId);
            builder.HasIndex(e => e.ProductId);
            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);
        }
    }
}