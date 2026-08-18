using DentZone.Domain.Common;
using DentZone.Domain.Enums;

namespace DentZone.Domain.Entities
{
    public class Category : BaseEntity<Guid>
    {
        public string NameEn { get; private set; } = null!;
        public string NameAr { get; private set; } = null!;
        public string Slug { get; private set; } = null!;
        public string? DescriptionEn { get; private set; }
        public string? DescriptionAr { get; private set; }
        public string? Emoji { get; private set; }
        public string? Tint { get; private set; }

        public virtual ICollection<Product> Products { get; private set; } = new List<Product>();

        public static Category Create(string nameEn, string nameAr, string slug,
            string? descriptionEn, string? descriptionAr, string? emoji, string? tint) => new()
        {
            NameEn = ValidateName(nameEn, nameof(nameEn)),
            NameAr = ValidateName(nameAr, nameof(nameAr)),
            Slug = ValidateSlug(slug),
            DescriptionEn = descriptionEn,
            DescriptionAr = descriptionAr,
            Emoji = emoji,
            Tint = tint
        };

        public void Update(string nameEn, string nameAr, string slug,
            string? descriptionEn, string? descriptionAr, string? emoji, string? tint, string updatedBy)
        {
            NameEn = ValidateName(nameEn, nameof(nameEn));
            NameAr = ValidateName(nameAr, nameof(nameAr));
            Slug = ValidateSlug(slug);
            DescriptionEn = descriptionEn;
            DescriptionAr = descriptionAr;
            Emoji = emoji;
            Tint = tint;
            MarkAsUpdated(updatedBy);
        }

        public string GetName(LanguageCode language) => language == LanguageCode.ar ? NameAr : NameEn;

        public string? GetDescription(LanguageCode language) => language == LanguageCode.ar ? DescriptionAr : DescriptionEn;

        private static string ValidateName(string name, string paramName)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException($"{paramName} cannot be empty.", paramName);

            return name.Trim();
        }

        private static string ValidateSlug(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug))
                throw new ArgumentException("Category slug cannot be empty.", nameof(slug));

            return slug.Trim().ToLowerInvariant();
        }
    }
}
