using DentZone.Application.Features.Orders.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Orders.Commands.CreateOrder
{
    public class CreateOrderCommand : IRequest<OrderDto>
    {
        public LanguageCode Language { get; set; } = LanguageCode.en;
        public string CustomerName { get; set; } = null!;
        public string CustomerEmail { get; set; } = null!;
        public string? CustomerPhone { get; set; }
        public string ShippingAddress { get; set; } = null!;
        public string ShippingCity { get; set; } = null!;
        public string? Notes { get; set; }
        public List<OrderLineInput> Lines { get; set; } = new();
    }

    public class OrderLineInput
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
