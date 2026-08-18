using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<UserRefreshToken>
    {
        public void Configure(EntityTypeBuilder<UserRefreshToken> builder)
        {
            builder.ToTable("RefreshTokens");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Token)
                .IsRequired();

            builder.Property(e => e.ExpiryDate)
                .IsRequired();

            builder.Property(e => e.IsRevoked)
                .IsRequired();

            builder.HasIndex(e => e.Token).IsUnique();
            builder.HasIndex(e => e.UserId);

            builder.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}