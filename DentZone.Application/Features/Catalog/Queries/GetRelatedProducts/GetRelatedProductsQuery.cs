using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Catalog.Queries.GetRelatedProducts
{
    public class GetRelatedProductsQuery : IRequest<List<ProductDto>>
    {
        public string Slug { get; set; } = null!;
        public int Limit { get; set; } = 4;
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }
}
