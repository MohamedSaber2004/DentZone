using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Orders.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Orders.Queries.GetMyOrders
{
    public class GetMyOrdersQuery : IRequest<List<OrderDto>>
    {
    }

    public class GetMyOrdersQueryHandler : IRequestHandler<GetMyOrdersQuery, List<OrderDto>>
    {
        private readonly IDentZoneContext _context;
        private readonly ICurrentUserService _currentUserService;

        public GetMyOrdersQueryHandler(IDentZoneContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<List<OrderDto>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
        {
            var orders = await _context.Orders
                .AsNoTracking()
                .Include(o => o.Lines)
                .Where(o => o.UserId == _currentUserService.UserId && !o.IsDeleted)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync(cancellationToken);

            return orders.Select(o => o.ToDto()).ToList();
        }
    }
}
