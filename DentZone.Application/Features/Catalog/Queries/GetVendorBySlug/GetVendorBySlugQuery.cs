using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Catalog.Queries.GetVendorBySlug
{
    public class GetVendorBySlugQuery : IRequest<VendorDto>
    {
        public string Slug { get; set; } = null!;
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }
}
