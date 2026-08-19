using DentZone.Application.Features.Orders.DTOs;
using MediatR;

namespace DentZone.Application.Features.Orders.Queries.GetMyOrders
{
    public class GetMyOrdersQuery : IRequest<List<OrderDto>>
    {
    }
}
