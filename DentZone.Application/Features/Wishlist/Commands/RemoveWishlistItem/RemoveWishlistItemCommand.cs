using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Wishlist.Commands.AddWishlistItem;
using DentZone.Application.Localization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Wishlist.Commands.RemoveWishlistItem
{
    public class RemoveWishlistItemCommand : IRequest<bool>
    {
        public Guid ProductId { get; set; }
    }

    public class RemoveWishlistItemCommandHandler : IRequestHandler<RemoveWishlistItemCommand, bool>
    {
        private readonly IDentZoneContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IStringLocalizer<Messages> _localizer;

        public RemoveWishlistItemCommandHandler(IDentZoneContext context, ICurrentUserService currentUserService,
            IStringLocalizer<Messages> localizer)
        {
            _context = context;
            _currentUserService = currentUserService;
            _localizer = localizer;
        }

        public async Task<bool> Handle(RemoveWishlistItemCommand request, CancellationToken cancellationToken)
        {
            var item = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == _currentUserService.UserId && w.ProductId == request.ProductId && !w.IsDeleted, cancellationToken);

            if (item is null)
                return true;

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
