using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Orders.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Orders.Commands.CreateOrder
{
    public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
    {
        private readonly IDentZoneContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IStringLocalizer<Messages> _localizer;
        private readonly IConfiguration _configuration;

        public CreateOrderCommandHandler(IDentZoneContext context, ICurrentUserService currentUserService,
            IStringLocalizer<Messages> localizer, IConfiguration configuration)
        {
            _context = context;
            _currentUserService = currentUserService;
            _localizer = localizer;
            _configuration = configuration;
        }

        public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
        {
            var productIds = request.Lines.Select(l => l.ProductId).Distinct().ToList();

            var products = await _context.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id) && !p.IsDeleted)
                .ToDictionaryAsync(p => p.Id, cancellationToken);

            var missing = request.Lines.Select(l => l.ProductId).FirstOrDefault(id => !products.ContainsKey(id));
            if (missing != Guid.Empty)
                throw new BadRequestException(_localizer[LocalizationKeys.Orders.ProductUnavailable]);

            var outOfStock = request.Lines.FirstOrDefault(l =>
                !products.TryGetValue(l.ProductId, out var product) || !product.InStock);
            if (outOfStock is not null && products.TryGetValue(outOfStock.ProductId, out var unavailableProduct))
                throw new BadRequestException(string.Format(_localizer[LocalizationKeys.Orders.OutOfStock], unavailableProduct.GetName(request.Language)));

            var (shippingCost, freeShippingThreshold, taxRate) = GetSettings();

            var subtotal = 0m;
            var discount = 0m;

            foreach (var line in request.Lines)
            {
                var product = products[line.ProductId];
                var lineTotal = product.Price * line.Quantity;
                var lineDiscount = product.CompareAtPrice.HasValue && product.CompareAtPrice.Value > product.Price
                    ? (product.CompareAtPrice.Value - product.Price) * line.Quantity
                    : 0m;

                subtotal += lineTotal;
                discount += lineDiscount;
            }

            var shipping = subtotal >= freeShippingThreshold ? 0m : shippingCost;
            var tax = Math.Round((subtotal - discount) * taxRate, 2);
            var total = Math.Max(0m, subtotal - discount + shipping + tax);

            var order = Order.Create(
                _currentUserService.UserId,
                await GenerateOrderNumberAsync(cancellationToken),
                subtotal, discount, shipping, tax, total,
                request.CustomerName, request.CustomerEmail, request.CustomerPhone,
                request.ShippingAddress, request.ShippingCity, request.Notes);

            foreach (var line in request.Lines)
            {
                var product = products[line.ProductId];
                order.AddLine(OrderLine.Create(
                    product.Id, product.GetName(request.Language),
                    product.Image, product.Price, line.Quantity));

                product.UpdateStock(Math.Max(0, product.StockQuantity - line.Quantity), "system");
                _context.Products.Update(product);
            }

            await _context.Orders.AddAsync(order, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return order.ToDto();
        }

        private async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken)
        {
            for (var attempt = 0; attempt < 10; attempt++)
            {
                var number = $"DZ-{Random.Shared.Next(100000, 1000000)}";
                var exists = await _context.Orders.AnyAsync(o => o.OrderNumber == number, cancellationToken);
                if (!exists)
                    return number;
            }

            return $"DZ-{Guid.NewGuid():N}".Substring(0, 11).ToUpperInvariant();
        }

        private (decimal ShippingCost, decimal FreeShippingThreshold, decimal TaxRate) GetSettings()
        {
            var section = _configuration.GetSection("CatalogSettings");

            return (
                decimal.TryParse(section["ShippingCost"], out var shipping) ? shipping : 6.99m,
                decimal.TryParse(section["FreeShippingThreshold"], out var threshold) ? threshold : 50m,
                decimal.TryParse(section["TaxRate"], out var tax) ? tax : 0.08m);
        }
    }
}
