using DentZone.Domain.Common;

namespace DentZone.Domain.Entities
{
    public class Review : BaseEntity<Guid>
    {
        public Guid ProductId { get; private set; }
        public Guid? UserId { get; private set; }
        public string AuthorName { get; private set; } = null!;
        public int Rating { get; private set; }
        public string Content { get; private set; } = null!;
        public bool VerifiedPurchase { get; private set; }
        public int HelpfulCount { get; private set; }

        public virtual Product Product { get; private set; } = null!;
        public virtual ApplicationUser? User { get; private set; }

        public static Review Create(Guid productId, int rating, string content, string authorName,
            Guid? userId = null, bool verifiedPurchase = false) => new()
        {
            ProductId = productId,
            UserId = userId,
            AuthorName = ValidateAuthorName(authorName),
            Rating = ValidateRating(rating),
            Content = ValidateContent(content),
            VerifiedPurchase = verifiedPurchase
        };

        public void Update(int rating, string content, string updatedBy)
        {
            Rating = ValidateRating(rating);
            Content = ValidateContent(content);
            MarkAsUpdated(updatedBy);
        }

        public void MarkHelpful(string updatedBy)
        {
            HelpfulCount++;
            MarkAsUpdated(updatedBy);
        }

        public void SetHelpfulCount(int helpfulCount, string updatedBy)
        {
            if (helpfulCount < 0)
                throw new ArgumentOutOfRangeException(nameof(helpfulCount), "Helpful count cannot be negative.");

            HelpfulCount = helpfulCount;
            MarkAsUpdated(updatedBy);
        }

        private static int ValidateRating(int rating)
        {
            if (rating < 1 || rating > 5)
                throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5.");

            return rating;
        }

        private static string ValidateContent(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Review content cannot be empty.", nameof(content));

            return content.Trim();
        }

        private static string ValidateAuthorName(string authorName)
        {
            if (string.IsNullOrWhiteSpace(authorName))
                throw new ArgumentException("Review author name cannot be empty.", nameof(authorName));

            return authorName.Trim();
        }
    }
}
