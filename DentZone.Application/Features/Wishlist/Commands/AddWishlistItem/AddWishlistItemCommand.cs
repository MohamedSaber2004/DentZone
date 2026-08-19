using MediatR;

namespace DentZone.Application.Features.Wishlist.Commands.AddWishlistItem
{
    public class AddWishlistItemCommand : IRequest<bool>
    {
        public Guid ProductId { get; set; }
    }
}
