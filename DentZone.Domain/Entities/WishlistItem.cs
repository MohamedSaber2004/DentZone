using DentZone.Domain.Common;

namespace DentZone.Domain.Entities
{
    public class WishlistItem : BaseEntity<Guid>
    {
        public Guid UserId { get; private set; }
        public Guid ProductId { get; private set; }

        public virtual ApplicationUser User { get; private set; } = null!;
        public virtual Product Product { get; private set; } = null!;

        public static WishlistItem Create(Guid userId, Guid productId) => new()
        {
            UserId = userId,
            ProductId = productId
        };
    }
}
