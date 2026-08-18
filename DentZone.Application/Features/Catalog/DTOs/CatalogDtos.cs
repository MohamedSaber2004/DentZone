namespace DentZone.Application.Features.Catalog.DTOs
{
    public class CategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public string? Emoji { get; set; }
        public string? Tint { get; set; }
        public int ProductCount { get; set; }
    }

    public class VendorDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string Tagline { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? Emoji { get; set; }
        public string? Tint { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public bool Verified { get; set; }
        public int ProductCount { get; set; }
    }

    public class ProductDto
    {
        public Guid Id { get; set; }
        public string Slug { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Tagline { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Brand { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal? CompareAtPrice { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public bool InStock { get; set; }
        public int StockQuantity { get; set; }
        public string Image { get; set; } = null!;
        public string? Badge { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsBestseller { get; set; }
        public string[] Features { get; set; } = Array.Empty<string>();
        public Guid CategoryId { get; set; }
        public string CategorySlug { get; set; } = null!;
        public Guid VendorId { get; set; }
        public string VendorSlug { get; set; } = null!;
    }

    public class ReviewDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string Author { get; set; } = null!;
        public int Rating { get; set; }
        public string Content { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public bool VerifiedPurchase { get; set; }
        public int HelpfulCount { get; set; }
    }

    public class AdvertisementDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Image { get; set; } = null!;
        public string? MobileImage { get; set; }
        public string? CtaLabel { get; set; }
        public string? CtaTo { get; set; }
        public string? Eyebrow { get; set; }
        public string Theme { get; set; } = "dark";
    }

    public class AdvertisementsDto
    {
        public AdvertisementDto? Hero { get; set; }
        public List<AdvertisementDto> Secondary { get; set; } = new();
    }

    public class CatalogSettingsDto
    {
        public string Currency { get; set; } = "USD";
        public decimal ShippingCost { get; set; }
        public decimal FreeShippingThreshold { get; set; }
        public decimal TaxRate { get; set; }
    }
}
