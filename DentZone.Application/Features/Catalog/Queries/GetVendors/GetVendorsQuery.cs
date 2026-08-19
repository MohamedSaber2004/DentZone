using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Catalog.Queries.GetVendors
{
    public class GetVendorsQuery : IRequest<List<VendorDto>>
    {
        public string? CategorySlug { get; set; }
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }
}
