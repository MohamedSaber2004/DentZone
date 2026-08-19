using DentZone.Application.Common.Interfaces;
using DentZone.Application.Localization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Wishlist.Commands.ClearWishlist
{
    public class ClearWishlistCommandHandler : IRequestHandler<ClearWishlistCommand, bool>
    {
        private readonly IDentZoneContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IStringLocalizer<Messages> _localizer;

        public ClearWishlistCommandHandler(IDentZoneContext context, ICurrentUserService currentUserService,
            IStringLocalizer<Messages> localizer)
        {
            _context = context;
            _currentUserService = currentUserService;
            _localizer = localizer;
        }

        public async Task<bool> Handle(ClearWishlistCommand request, CancellationToken cancellationToken)
        {
            var items = await _context.WishlistItems
                .Where(w => w.UserId == _currentUserService.UserId && !w.IsDeleted)
                .ToListAsync(cancellationToken);

            if (items.Count > 0)
            {
                _context.WishlistItems.RemoveRange(items);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return true;
        }
    }
}
