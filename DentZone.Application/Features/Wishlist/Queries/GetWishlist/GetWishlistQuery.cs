using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Wishlist.Queries.GetWishlist
{
    public class GetWishlistQuery : IRequest<List<ProductDto>>
    {
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }
}
