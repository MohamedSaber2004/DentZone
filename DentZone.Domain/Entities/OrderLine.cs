using DentZone.Domain.Common;

namespace DentZone.Domain.Entities
{
    public class OrderLine : BaseEntity<Guid>
    {
        public Guid OrderId { get; private set; }
        public Guid ProductId { get; private set; }
        public string ProductName { get; private set; } = null!;
        public string Image { get; private set; } = null!;
        public decimal Price { get; private set; }
        public int Quantity { get; private set; }

        public virtual Order Order { get; private set; } = null!;

        public static OrderLine Create(Guid productId, string productName, string image, decimal price, int quantity) => new()
        {
            ProductId = productId,
            ProductName = ValidateName(productName, nameof(productName)),
            Image = image,
            Price = ValidatePrice(price),
            Quantity = ValidateQuantity(quantity)
        };

        private static string ValidateName(string name, string paramName)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException($"{paramName} cannot be empty.", paramName);

            return name.Trim();
        }

        private static decimal ValidatePrice(decimal price)
        {
            if (price < 0)
                throw new ArgumentOutOfRangeException(nameof(price), "Price cannot be negative.");

            return Math.Round(price, 2);
        }

        private static int ValidateQuantity(int quantity)
        {
            if (quantity < 1)
                throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be at least 1.");

            return quantity;
        }
    }
}
