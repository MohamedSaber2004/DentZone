using DentZone.Application.Features.Orders.DTOs;
using MediatR;

namespace DentZone.Application.Features.Orders.Queries.GetOrderById
{
    public class GetOrderByIdQuery : IRequest<OrderDto>
    {
        public string Id { get; set; } = null!;
    }
}
