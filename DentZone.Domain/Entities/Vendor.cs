using DentZone.Domain.Common;
using DentZone.Domain.Enums;

namespace DentZone.Domain.Entities
{
    public class Vendor : BaseEntity<Guid>
    {
        public string NameEn { get; private set; } = null!;
        public string NameAr { get; private set; } = null!;
        public string Slug { get; private set; } = null!;
        public string TaglineEn { get; private set; } = null!;
        public string TaglineAr { get; private set; } = null!;
        public string DescriptionEn { get; private set; } = null!;
        public string DescriptionAr { get; private set; } = null!;
        public string? Emoji { get; private set; }
        public string? Tint { get; private set; }
        public double Rating { get; private set; }
        public int ReviewCount { get; private set; }
        public bool Verified { get; private set; }

        public virtual ICollection<Product> Products { get; private set; } = new List<Product>();

        public int ProductCount => Products.Count;

        public static Vendor Create(string nameEn, string nameAr, string slug,
            string taglineEn, string taglineAr, string descriptionEn, string descriptionAr,
            string? emoji, string? tint, bool verified) => new()
        {
            NameEn = ValidateName(nameEn, nameof(nameEn)),
            NameAr = ValidateName(nameAr, nameof(nameAr)),
            Slug = ValidateSlug(slug),
            TaglineEn = ValidateName(taglineEn, nameof(taglineEn)),
            TaglineAr = ValidateName(taglineAr, nameof(taglineAr)),
            DescriptionEn = descriptionEn,
            DescriptionAr = descriptionAr,
            Emoji = emoji,
            Tint = tint,
            Verified = verified
        };

        public void Update(string nameEn, string nameAr, string slug,
            string taglineEn, string taglineAr, string descriptionEn, string descriptionAr,
            string? emoji, string? tint, bool verified, string updatedBy)
        {
            NameEn = ValidateName(nameEn, nameof(nameEn));
            NameAr = ValidateName(nameAr, nameof(nameAr));
            Slug = ValidateSlug(slug);
            TaglineEn = ValidateName(taglineEn, nameof(taglineEn));
            TaglineAr = ValidateName(taglineAr, nameof(taglineAr));
            DescriptionEn = descriptionEn;
            DescriptionAr = descriptionAr;
            Emoji = emoji;
            Tint = tint;
            Verified = verified;
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
                throw new ArgumentException("Vendor slug cannot be empty.", nameof(slug));

            return slug.Trim().ToLowerInvariant();
        }
    }
}
