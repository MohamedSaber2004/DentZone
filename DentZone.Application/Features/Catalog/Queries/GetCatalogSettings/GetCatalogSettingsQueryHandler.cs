using DentZone.Application.Features.Catalog.DTOs;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace DentZone.Application.Features.Catalog.Queries.GetCatalogSettings
{
    public class GetCatalogSettingsQueryHandler : IRequestHandler<GetCatalogSettingsQuery, CatalogSettingsDto>
    {
        private readonly IConfiguration _configuration;

        public GetCatalogSettingsQueryHandler(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task<CatalogSettingsDto> Handle(GetCatalogSettingsQuery request, CancellationToken cancellationToken)
        {
            var section = _configuration.GetSection("CatalogSettings");

            return Task.FromResult(new CatalogSettingsDto
            {
                Currency = section["Currency"] ?? "USD",
                ShippingCost = decimal.TryParse(section["ShippingCost"], out var shipping) ? shipping : 6.99m,
                FreeShippingThreshold = decimal.TryParse(section["FreeShippingThreshold"], out var threshold) ? threshold : 50m,
                TaxRate = decimal.TryParse(section["TaxRate"], out var tax) ? tax : 0.08m
            });
        }
    }
}
