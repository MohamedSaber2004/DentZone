using DentZone.Domain.Entities;
using DentZone.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
    {
        public void Configure(EntityTypeBuilder<ApplicationUser> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.FullName)
                .IsRequired();

            builder.Property(e => e.ProfilePictureName);

            builder.Property(e => e.PasswordResetToken);

            builder.Property(e => e.Language)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(e => e.UserType)
                .IsRequired()
                .HasDefaultValue(Domain.Enums.UserType.Doctor)
                .HasConversion<string>();

            builder.HasIndex(e => e.NormalizedEmail).IsUnique();
            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);
        }
    }
}