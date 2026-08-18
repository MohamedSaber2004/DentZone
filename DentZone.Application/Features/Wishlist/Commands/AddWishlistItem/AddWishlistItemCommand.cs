using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Localization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Wishlist.Commands.AddWishlistItem
{
    public class AddWishlistItemCommand : IRequest<bool>
    {
        public Guid ProductId { get; set; }
    }

    public class AddWishlistItemCommandHandler : IRequestHandler<AddWishlistItemCommand, bool>
    {
        private readonly IDentZoneContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IStringLocalizer<Messages> _localizer;

        public AddWishlistItemCommandHandler(IDentZoneContext context, ICurrentUserService currentUserService,
            IStringLocalizer<Messages> localizer)
        {
            _context = context;
            _currentUserService = currentUserService;
            _localizer = localizer;
        }

        public async Task<bool> Handle(AddWishlistItemCommand request, CancellationToken cancellationToken)
        {
            var productExists = await _context.Products
                .AnyAsync(p => p.Id == request.ProductId && !p.IsDeleted, cancellationToken);

            if (!productExists)
                throw new NotFoundException(_localizer[LocalizationKeys.Catalog.ProductNotFound]);

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == _currentUserService.UserId && w.ProductId == request.ProductId, cancellationToken);

            if (existing is not null)
            {
                if (existing.IsDeleted)
                {
                    existing.Active();
                    _context.WishlistItems.Update(existing);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                return true;
            }

            await _context.WishlistItems.AddAsync(Domain.Entities.WishlistItem.Create(_currentUserService.UserId, request.ProductId), cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
