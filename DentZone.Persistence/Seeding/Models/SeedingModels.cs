using DentZone.Domain.Enums;

namespace DentZone.Persistence.Seeding.Models
{
    public class SeedingData
    {
        public List<string> Roles { get; set; } = new();
        public List<UserSeedData> Users { get; set; } = new();
    }

    public class UserSeedData
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public DateTime? BirthDate { get; set; }
        public LanguageCode Language { get; set; }
        public UserType UserType { get; set; }
        public string Password { get; set; } = null!;
    }

    public class StoreSeedingData
    {
        public List<CategorySeedData> Categories { get; set; } = new();
        public List<VendorSeedData> Vendors { get; set; } = new();
        public List<ProductSeedData> Products { get; set; } = new();
        public List<AdvertisementSeedData> Advertisements { get; set; } = new();
        public List<ReviewSeedData> Reviews { get; set; } = new();
    }

    public class CategorySeedData
    {
        public Guid Id { get; set; }
        public string NameEn { get; set; } = null!;
        public string NameAr { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? DescriptionEn { get; set; }
        public string? DescriptionAr { get; set; }
        public string? Emoji { get; set; }
        public string? Tint { get; set; }
    }

    public class VendorSeedData
    {
        public Guid Id { get; set; }
        public string NameEn { get; set; } = null!;
        public string NameAr { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string TaglineEn { get; set; } = null!;
        public string TaglineAr { get; set; } = null!;
        public string DescriptionEn { get; set; } = null!;
        public string DescriptionAr { get; set; } = null!;
        public string? Emoji { get; set; }
        public string? Tint { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public bool Verified { get; set; }
    }

    public class ProductSeedData
    {
        public Guid Id { get; set; }
        public string Slug { get; set; } = null!;
        public string NameEn { get; set; } = null!;
        public string NameAr { get; set; } = null!;
        public string TaglineEn { get; set; } = null!;
        public string TaglineAr { get; set; } = null!;
        public string DescriptionEn { get; set; } = null!;
        public string DescriptionAr { get; set; } = null!;
        public string Brand { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public int StockQuantity { get; set; }
        public string Image { get; set; } = null!;
        public ProductBadge Badge { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsBestseller { get; set; }
        public string[] Features { get; set; } = Array.Empty<string>();
        public string CategorySlug { get; set; } = null!;
        public string VendorSlug { get; set; } = null!;
    }

    public class AdvertisementSeedData
    {
        public Guid Id { get; set; }
        public string TitleEn { get; set; } = null!;
        public string TitleAr { get; set; } = null!;
        public string? DescriptionEn { get; set; }
        public string? DescriptionAr { get; set; }
        public string Image { get; set; } = null!;
        public string? MobileImage { get; set; }
        public string? CtaLabelEn { get; set; }
        public string? CtaLabelAr { get; set; }
        public string? CtaTo { get; set; }
        public string? EyebrowEn { get; set; }
        public string? EyebrowAr { get; set; }
        public AdvertisementTheme Theme { get; set; }
        public bool IsHero { get; set; }
    }

    public class ReviewSeedData
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string AuthorName { get; set; } = null!;
        public int Rating { get; set; }
        public string Content { get; set; } = null!;
        public bool VerifiedPurchase { get; set; }
        public int HelpfulCount { get; set; }
    }
}
