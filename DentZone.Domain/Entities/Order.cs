using DentZone.Domain.Common;
using DentZone.Domain.Enums;

namespace DentZone.Domain.Entities
{
    public class Order : BaseEntity<Guid>
    {
        public Guid UserId { get; private set; }
        public string OrderNumber { get; private set; } = null!;
        public decimal Subtotal { get; private set; }
        public decimal Discount { get; private set; }
        public decimal Shipping { get; private set; }
        public decimal Tax { get; private set; }
        public decimal Total { get; private set; }
        public string CustomerName { get; private set; } = null!;
        public string CustomerEmail { get; private set; } = null!;
        public string? CustomerPhone { get; private set; }
        public string ShippingAddress { get; private set; } = null!;
        public string ShippingCity { get; private set; } = null!;
        public string? Notes { get; private set; }
        public OrderStatus Status { get; private set; }

        public virtual ApplicationUser User { get; private set; } = null!;
        public virtual ICollection<OrderLine> Lines { get; private set; } = new List<OrderLine>();

        public static Order Create(Guid userId, string orderNumber, decimal subtotal, decimal discount,
            decimal shipping, decimal tax, decimal total, string customerName, string customerEmail,
            string? customerPhone, string shippingAddress, string shippingCity, string? notes) => new()
        {
            UserId = userId,
            OrderNumber = ValidateOrderNumber(orderNumber),
            Subtotal = ValidateMoney(subtotal, nameof(subtotal)),
            Discount = ValidateMoney(discount, nameof(discount)),
            Shipping = ValidateMoney(shipping, nameof(shipping)),
            Tax = ValidateMoney(tax, nameof(tax)),
            Total = ValidateMoney(total, nameof(total)),
            CustomerName = ValidateName(customerName, nameof(customerName)),
            CustomerEmail = ValidateName(customerEmail, nameof(customerEmail)),
            CustomerPhone = customerPhone,
            ShippingAddress = ValidateName(shippingAddress, nameof(shippingAddress)),
            ShippingCity = ValidateName(shippingCity, nameof(shippingCity)),
            Notes = notes,
            Status = OrderStatus.Confirmed
        };

        public void AddLine(OrderLine line)
        {
            if (line is null)
                throw new ArgumentNullException(nameof(line));

            Lines.Add(line);
        }

        public void SetStatus(OrderStatus status, string updatedBy)
        {
            Status = status;
            MarkAsUpdated(updatedBy);
        }

        private static string ValidateName(string value, string paramName)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException($"{paramName} cannot be empty.", paramName);

            return value.Trim();
        }

        private static string ValidateOrderNumber(string orderNumber)
        {
            if (string.IsNullOrWhiteSpace(orderNumber))
                throw new ArgumentException("Order number cannot be empty.", nameof(orderNumber));

            return orderNumber.Trim().ToUpperInvariant();
        }

        private static decimal ValidateMoney(decimal value, string paramName)
        {
            if (value < 0)
                throw new ArgumentOutOfRangeException(paramName, "Amount cannot be negative.");

            return Math.Round(value, 2);
        }
    }
}
