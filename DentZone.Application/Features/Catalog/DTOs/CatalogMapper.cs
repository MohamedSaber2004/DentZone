using DentZone.Domain.Entities;
using DentZone.Domain.Enums;

namespace DentZone.Application.Features.Catalog.DTOs
{
    public static class CatalogMapper
    {
        public static CategoryDto ToDto(this Category category, LanguageCode language, int productCount = 0) => new()
        {
            Id = category.Id,
            Name = category.GetName(language),
            Slug = category.Slug,
            Description = category.GetDescription(language),
            Emoji = category.Emoji,
            Tint = category.Tint,
            ProductCount = productCount
        };

        public static VendorDto ToDto(this Vendor vendor, LanguageCode language, int productCount = 0) => new()
        {
            Id = vendor.Id,
            Name = vendor.GetName(language),
            Slug = vendor.Slug,
            Tagline = vendor.GetTagline(language),
            Description = vendor.GetDescription(language),
            Emoji = vendor.Emoji,
            Tint = vendor.Tint,
            Rating = vendor.Rating,
            ReviewCount = vendor.ReviewCount,
            Verified = vendor.Verified,
            ProductCount = productCount
        };

        public static ProductDto ToDto(this Product product, LanguageCode language) => new()
        {
            Id = product.Id,
            Slug = product.Slug,
            Name = product.GetName(language),
            Tagline = product.GetTagline(language),
            Description = product.GetDescription(language),
            Brand = product.Brand,
            Price = product.Price,
            CompareAtPrice = product.CompareAtPrice,
            Rating = product.Rating,
            ReviewCount = product.ReviewCount,
            InStock = product.InStock,
            StockQuantity = product.StockQuantity,
            Image = product.Image,
            Badge = product.Badge == ProductBadge.None ? null : product.Badge.ToString().ToLowerInvariant(),
            IsFeatured = product.IsFeatured,
            IsBestseller = product.IsBestseller,
            Features = product.Features,
            CategoryId = product.CategoryId,
            CategorySlug = product.Category?.Slug ?? string.Empty,
            VendorId = product.VendorId,
            VendorSlug = product.Vendor?.Slug ?? string.Empty
        };

        public static ReviewDto ToDto(this Review review) => new()
        {
            Id = review.Id,
            ProductId = review.ProductId,
            Author = review.AuthorName,
            Rating = review.Rating,
            Content = review.Content,
            CreatedAt = review.CreatedAt,
            VerifiedPurchase = review.VerifiedPurchase,
            HelpfulCount = review.HelpfulCount
        };

        public static AdvertisementDto ToDto(this Advertisement advertisement, LanguageCode language) => new()
        {
            Id = advertisement.Id,
            Title = advertisement.GetTitle(language),
            Description = advertisement.GetDescription(language),
            Image = advertisement.Image,
            MobileImage = advertisement.MobileImage,
            CtaLabel = advertisement.GetCtaLabel(language),
            CtaTo = advertisement.CtaTo,
            Eyebrow = advertisement.GetEyebrow(language),
            Theme = advertisement.Theme.ToString().ToLowerInvariant()
        };
    }
}
