using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class VendorConfiguration : IEntityTypeConfiguration<Vendor>
    {
        public void Configure(EntityTypeBuilder<Vendor> builder)
        {
            builder.ToTable("Vendors");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.NameEn)
                .IsRequired();

            builder.Property(e => e.NameAr)
                .IsRequired();

            builder.Property(e => e.Slug)
                .IsRequired();

            builder.Property(e => e.TaglineEn)
                .IsRequired();

            builder.Property(e => e.TaglineAr)
                .IsRequired();

            builder.Property(e => e.DescriptionEn)
                .IsRequired();

            builder.Property(e => e.DescriptionAr)
                .IsRequired();

            builder.Property(e => e.Emoji);

            builder.Property(e => e.Tint);

            builder.Property(e => e.Rating)
                .HasPrecision(3, 2);

            builder.Property(e => e.ReviewCount);

            builder.Property(e => e.Verified);

            builder.HasIndex(e => e.Slug).IsUnique();
            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);
        }
    }
}
