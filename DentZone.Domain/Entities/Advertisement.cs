using DentZone.Domain.Common;
using DentZone.Domain.Enums;

namespace DentZone.Domain.Entities
{
    public class Advertisement : BaseEntity<Guid>
    {
        public string TitleEn { get; private set; } = null!;
        public string TitleAr { get; private set; } = null!;
        public string? DescriptionEn { get; private set; }
        public string? DescriptionAr { get; private set; }
        public string Image { get; private set; } = null!;
        public string? MobileImage { get; private set; }
        public string? CtaLabelEn { get; private set; }
        public string? CtaLabelAr { get; private set; }
        public string? CtaTo { get; private set; }
        public string? EyebrowEn { get; private set; }
        public string? EyebrowAr { get; private set; }
        public AdvertisementTheme Theme { get; private set; }
        public bool IsHero { get; private set; }

        public static Advertisement Create(string titleEn, string titleAr, string image,
            string? descriptionEn = null, string? descriptionAr = null, string? mobileImage = null,
            string? ctaLabelEn = null, string? ctaLabelAr = null, string? ctaTo = null,
            string? eyebrowEn = null, string? eyebrowAr = null, AdvertisementTheme theme = AdvertisementTheme.Dark,
            bool isHero = false) => new()
        {
            TitleEn = ValidateTitle(titleEn, nameof(titleEn)),
            TitleAr = ValidateTitle(titleAr, nameof(titleAr)),
            Image = image,
            DescriptionEn = descriptionEn,
            DescriptionAr = descriptionAr,
            MobileImage = mobileImage,
            CtaLabelEn = ctaLabelEn,
            CtaLabelAr = ctaLabelAr,
            CtaTo = ctaTo,
            EyebrowEn = eyebrowEn,
            EyebrowAr = eyebrowAr,
            Theme = theme,
            IsHero = isHero
        };

        public void Update(string titleEn, string titleAr, string image,
            string? descriptionEn, string? descriptionAr, string? mobileImage,
            string? ctaLabelEn, string? ctaLabelAr, string? ctaTo,
            string? eyebrowEn, string? eyebrowAr, AdvertisementTheme theme, bool isHero, string updatedBy)
        {
            TitleEn = ValidateTitle(titleEn, nameof(titleEn));
            TitleAr = ValidateTitle(titleAr, nameof(titleAr));
            Image = image;
            DescriptionEn = descriptionEn;
            DescriptionAr = descriptionAr;
            MobileImage = mobileImage;
            CtaLabelEn = ctaLabelEn;
            CtaLabelAr = ctaLabelAr;
            CtaTo = ctaTo;
            EyebrowEn = eyebrowEn;
            EyebrowAr = eyebrowAr;
            Theme = theme;
            IsHero = isHero;
            MarkAsUpdated(updatedBy);
        }

        public string GetTitle(LanguageCode language) => language == LanguageCode.ar ? TitleAr : TitleEn;

        public string? GetDescription(LanguageCode language) => language == LanguageCode.ar ? DescriptionAr : DescriptionEn;

        public string? GetCtaLabel(LanguageCode language) => language == LanguageCode.ar ? CtaLabelAr : CtaLabelEn;

        public string? GetEyebrow(LanguageCode language) => language == LanguageCode.ar ? EyebrowAr : EyebrowEn;

        private static string ValidateTitle(string title, string paramName)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException($"{paramName} cannot be empty.", paramName);

            return title.Trim();
        }
    }
}
