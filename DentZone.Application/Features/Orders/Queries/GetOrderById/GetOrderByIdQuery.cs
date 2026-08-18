using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Orders.DTOs;
using DentZone.Application.Localization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Orders.Queries.GetOrderById
{
    public class GetOrderByIdQuery : IRequest<OrderDto>
    {
        public Guid Id { get; set; }
    }

    public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDto>
    {
        private readonly IDentZoneContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IStringLocalizer<Messages> _localizer;

        public GetOrderByIdQueryHandler(IDentZoneContext context, ICurrentUserService currentUserService,
            IStringLocalizer<Messages> localizer)
        {
            _context = context;
            _currentUserService = currentUserService;
            _localizer = localizer;
        }

        public async Task<OrderDto> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
        {
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.Lines)
                .FirstOrDefaultAsync(o => o.Id == request.Id && o.UserId == _currentUserService.UserId && !o.IsDeleted, cancellationToken);

            if (order is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Orders.OrderNotFound]);

            return order.ToDto();
        }
    }
}
