using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.ToTable("Categories");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.NameEn)
                .IsRequired();

            builder.Property(e => e.NameAr)
                .IsRequired();

            builder.Property(e => e.Slug)
                .IsRequired();

            builder.Property(e => e.DescriptionEn);

            builder.Property(e => e.DescriptionAr);

            builder.Property(e => e.Emoji);

            builder.Property(e => e.Tint);

            builder.HasIndex(e => e.Slug).IsUnique();
            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);
        }
    }
}
