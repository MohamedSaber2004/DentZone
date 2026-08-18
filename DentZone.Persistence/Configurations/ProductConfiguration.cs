using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class ProductConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.ToTable("Products");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Slug)
                .IsRequired();

            builder.Property(e => e.NameEn)
                .IsRequired();

            builder.Property(e => e.NameAr)
                .IsRequired();

            builder.Property(e => e.TaglineEn)
                .IsRequired();

            builder.Property(e => e.TaglineAr)
                .IsRequired();

            builder.Property(e => e.DescriptionEn)
                .IsRequired();

            builder.Property(e => e.DescriptionAr)
                .IsRequired();

            builder.Property(e => e.Brand)
                .IsRequired();

            builder.Property(e => e.Price)
                .HasPrecision(18, 2);

            builder.Property(e => e.CompareAtPrice)
                .HasPrecision(18, 2);

            builder.Property(e => e.Rating)
                .HasPrecision(3, 2);

            builder.Property(e => e.Image)
                .IsRequired();

            builder.Property(e => e.Badge)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(e => e.Features)
                .HasColumnType("text[]");

            builder.HasIndex(e => e.Slug).IsUnique();
            builder.HasIndex(e => e.CategoryId);
            builder.HasIndex(e => e.VendorId);
            builder.HasIndex(e => e.IsFeatured);
            builder.HasIndex(e => e.IsBestseller);
            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);

            builder.HasOne(e => e.Category)
                .WithMany(e => e.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.Vendor)
                .WithMany(e => e.Products)
                .HasForeignKey(e => e.VendorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
