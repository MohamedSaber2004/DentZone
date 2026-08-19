using MediatR;

namespace DentZone.Application.Features.Wishlist.Commands.RemoveWishlistItem
{
    public class RemoveWishlistItemCommand : IRequest<bool>
    {
        public Guid ProductId { get; set; }
    }
}
