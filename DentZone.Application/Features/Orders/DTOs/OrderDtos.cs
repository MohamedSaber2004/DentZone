namespace DentZone.Application.Features.Orders.DTOs
{
    public class OrderLineDto
    {
        public Guid ProductId { get; set; }
        public string Name { get; set; } = null!;
        public string Image { get; set; } = null!;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }

    public class CustomerInfoDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        public string Address { get; set; } = null!;
        public string City { get; set; } = null!;
        public string? Notes { get; set; }
    }

    public class OrderDto
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public CustomerInfoDto Customer { get; set; } = new();
        public List<OrderLineDto> Lines { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal Shipping { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }
    }

    public static class OrderMapper
    {
        public static OrderDto ToDto(this Domain.Entities.Order order) => new()
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Status = order.Status.ToString().ToLowerInvariant(),
            CreatedAt = order.CreatedAt,
            Customer = new CustomerInfoDto
            {
                Name = order.CustomerName,
                Email = order.CustomerEmail,
                Phone = order.CustomerPhone,
                Address = order.ShippingAddress,
                City = order.ShippingCity,
                Notes = order.Notes
            },
            Lines = order.Lines
                .OrderBy(l => l.CreatedAt)
                .Select(l => new OrderLineDto
                {
                    ProductId = l.ProductId,
                    Name = l.ProductName,
                    Image = l.Image,
                    Price = l.Price,
                    Quantity = l.Quantity
                })
                .ToList(),
            Subtotal = order.Subtotal,
            Discount = order.Discount,
            Shipping = order.Shipping,
            Tax = order.Tax,
            Total = order.Total
        };
    }
}
