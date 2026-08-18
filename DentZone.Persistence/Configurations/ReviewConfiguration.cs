using DentZone.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DentZone.Persistence.Configurations
{
    public class ReviewConfiguration : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            builder.ToTable("Reviews");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.AuthorName)
                .IsRequired();

            builder.Property(e => e.Rating)
                .IsRequired();

            builder.Property(e => e.Content)
                .IsRequired();

            builder.Property(e => e.VerifiedPurchase)
                .IsRequired();

            builder.Property(e => e.HelpfulCount)
                .IsRequired();

            builder.HasIndex(e => e.ProductId);
            builder.HasIndex(e => e.UserId);
            builder.HasIndex(e => e.IsDeleted);
            builder.HasIndex(e => e.IsActive);

            builder.HasOne(e => e.Product)
                .WithMany(e => e.Reviews)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
