using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Orders.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Orders.Queries.GetMyOrders
{
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
            var userId = _currentUserService.UserId;
            var userEmail = _currentUserService.Email?.Trim().ToLower();

            var orders = await _context.Orders
                .AsNoTracking()
                .Include(o => o.Lines)
                .Where(o => !o.IsDeleted && (
                    (userId != Guid.Empty && o.UserId == userId) ||
                    (!string.IsNullOrEmpty(userEmail) && o.CustomerEmail.ToLower() == userEmail)
                ))
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync(cancellationToken);

            return orders.Select(o => o.ToDto()).ToList();
        }
    }
}
