using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class AdvertisementConfiguration : IEntityTypeConfiguration<Advertisement>
    {
        public void Configure(EntityTypeBuilder<Advertisement> builder)
        {
            builder.ToTable("Advertisements");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.TitleEn)
                .IsRequired();

            builder.Property(e => e.TitleAr)
                .IsRequired();

            builder.Property(e => e.DescriptionEn);

            builder.Property(e => e.DescriptionAr);

            builder.Property(e => e.Image)
                .IsRequired();

            builder.Property(e => e.MobileImage);

            builder.Property(e => e.CtaLabelEn);

            builder.Property(e => e.CtaLabelAr);

            builder.Property(e => e.CtaTo);

            builder.Property(e => e.EyebrowEn);

            builder.Property(e => e.EyebrowAr);

            builder.Property(e => e.Theme)
                .IsRequired()
                .HasConversion<string>();

            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);
        }
    }
}
