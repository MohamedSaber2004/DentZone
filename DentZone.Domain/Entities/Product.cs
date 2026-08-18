using DentZone.Domain.Common;
using DentZone.Domain.Enums;

namespace DentZone.Domain.Entities
{
    public class Product : BaseEntity<Guid>
    {
        public string Slug { get; private set; } = null!;
        public string NameEn { get; private set; } = null!;
        public string NameAr { get; private set; } = null!;
        public string TaglineEn { get; private set; } = null!;
        public string TaglineAr { get; private set; } = null!;
        public string DescriptionEn { get; private set; } = null!;
        public string DescriptionAr { get; private set; } = null!;
        public string Brand { get; private set; } = null!;
        public decimal Price { get; private set; }
        public decimal? CompareAtPrice { get; private set; }
        public double Rating { get; private set; }
        public int ReviewCount { get; private set; }
        public bool InStock { get; private set; }
        public int StockQuantity { get; private set; }
        public string Image { get; private set; } = null!;
        public ProductBadge Badge { get; private set; }
        public bool IsFeatured { get; private set; }
        public bool IsBestseller { get; private set; }
        public string[] Features { get; private set; } = Array.Empty<string>();

        public Guid CategoryId { get; private set; }
        public Guid VendorId { get; private set; }

        public virtual Category Category { get; private set; } = null!;
        public virtual Vendor Vendor { get; private set; } = null!;

        public virtual ICollection<Review> Reviews { get; private set; } = new List<Review>();
        public virtual ICollection<WishlistItem> WishlistItems { get; private set; } = new List<WishlistItem>();

        public static Product Create(string slug, string nameEn, string nameAr, string taglineEn, string taglineAr,
            string descriptionEn, string descriptionAr, string brand, decimal price, decimal? compareAtPrice,
            int stockQuantity, string image, Guid categoryId, Guid vendorId, string[] features,
            bool isFeatured = false, bool isBestseller = false, ProductBadge badge = ProductBadge.None) => new()
        {
            Slug = ValidateSlug(slug),
            NameEn = ValidateName(nameEn, nameof(nameEn)),
            NameAr = ValidateName(nameAr, nameof(nameAr)),
            TaglineEn = ValidateName(taglineEn, nameof(taglineEn)),
            TaglineAr = ValidateName(taglineAr, nameof(taglineAr)),
            DescriptionEn = descriptionEn,
            DescriptionAr = descriptionAr,
            Brand = ValidateName(brand, nameof(brand)),
            Price = ValidatePrice(price),
            CompareAtPrice = compareAtPrice.HasValue ? ValidatePrice(compareAtPrice.Value) : null,
            StockQuantity = ValidateStockQuantity(stockQuantity),
            Image = image,
            Badge = badge,
            IsFeatured = isFeatured,
            IsBestseller = isBestseller,
            Features = features ?? Array.Empty<string>(),
            CategoryId = categoryId,
            VendorId = vendorId,
            InStock = stockQuantity > 0
        };

        public void Update(string slug, string nameEn, string nameAr, string taglineEn, string taglineAr,
            string descriptionEn, string descriptionAr, string brand, decimal price, decimal? compareAtPrice,
            int stockQuantity, string image, Guid categoryId, Guid vendorId, string[] features,
            bool isFeatured, bool isBestseller, ProductBadge badge, string updatedBy)
        {
            Slug = ValidateSlug(slug);
            NameEn = ValidateName(nameEn, nameof(nameEn));
            NameAr = ValidateName(nameAr, nameof(nameAr));
            TaglineEn = ValidateName(taglineEn, nameof(taglineEn));
            TaglineAr = ValidateName(taglineAr, nameof(taglineAr));
            DescriptionEn = descriptionEn;
            DescriptionAr = descriptionAr;
            Brand = ValidateName(brand, nameof(brand));
            Price = ValidatePrice(price);
            CompareAtPrice = compareAtPrice.HasValue ? ValidatePrice(compareAtPrice.Value) : null;
            StockQuantity = ValidateStockQuantity(stockQuantity);
            InStock = stockQuantity > 0;
            Image = image;
            CategoryId = categoryId;
            VendorId = vendorId;
            Features = features ?? Array.Empty<string>();
            IsFeatured = isFeatured;
            IsBestseller = isBestseller;
            Badge = badge;
            MarkAsUpdated(updatedBy);
        }

        public void UpdateStock(int stockQuantity, string updatedBy)
        {
            StockQuantity = ValidateStockQuantity(stockQuantity);
            InStock = stockQuantity > 0;
            MarkAsUpdated(updatedBy);
        }

        public void UpdateRating(double rating, int reviewCount, string updatedBy)
        {
            if (rating < 0 || rating > 5)
                throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 0 and 5.");

            if (reviewCount < 0)
                throw new ArgumentOutOfRangeException(nameof(reviewCount), "Review count cannot be negative.");

            Rating = Math.Round(rating, 2);
            ReviewCount = reviewCount;
            MarkAsUpdated(updatedBy);
        }

        public string GetName(LanguageCode language) => language == LanguageCode.ar ? NameAr : NameEn;

        public string GetTagline(LanguageCode language) => language == LanguageCode.ar ? TaglineAr : TaglineEn;

        public string GetDescription(LanguageCode language) => language == LanguageCode.ar ? DescriptionAr : DescriptionEn;

        private static string ValidateName(string name, string paramName)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException($"{paramName} cannot be empty.", paramName);

            return name.Trim();
        }

        private static string ValidateSlug(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug))
                throw new ArgumentException("Product slug cannot be empty.", nameof(slug));

            return slug.Trim().ToLowerInvariant();
        }

        private static decimal ValidatePrice(decimal price)
        {
            if (price < 0)
                throw new ArgumentOutOfRangeException(nameof(price), "Price cannot be negative.");

            return Math.Round(price, 2);
        }

        private static int ValidateStockQuantity(int stockQuantity)
        {
            if (stockQuantity < 0)
                throw new ArgumentOutOfRangeException(nameof(stockQuantity), "Stock quantity cannot be negative.");

            return stockQuantity;
        }
    }
}
