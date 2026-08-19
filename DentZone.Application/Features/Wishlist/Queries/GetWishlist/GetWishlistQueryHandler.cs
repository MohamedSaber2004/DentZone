using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Wishlist.Queries.GetWishlist
{
    public class GetWishlistQueryHandler : IRequestHandler<GetWishlistQuery, List<ProductDto>>
    {
        private readonly IDentZoneContext _context;
        private readonly ICurrentUserService _currentUserService;

        public GetWishlistQueryHandler(IDentZoneContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<List<ProductDto>> Handle(GetWishlistQuery request, CancellationToken cancellationToken)
        {
            var items = await _context.WishlistItems
                .AsNoTracking()
                .Include(w => w.Product).ThenInclude(p => p.Category)
                .Include(w => w.Product).ThenInclude(p => p.Vendor)
                .Where(w => w.UserId == _currentUserService.UserId && !w.IsDeleted && !w.Product.IsDeleted)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => w.Product)
                .ToListAsync(cancellationToken);

            return items.Select(p => p.ToDto(request.Language)).ToList();
        }
    }
}
