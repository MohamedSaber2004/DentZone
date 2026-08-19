using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Catalog.Queries.GetProducts
{
    public class GetProductsQuery : IRequest<List<ProductDto>>
    {
        public string? CategorySlug { get; set; }
        public string? VendorSlug { get; set; }
        public string? Search { get; set; }
        public string? Sort { get; set; }
        public bool? Featured { get; set; }
        public bool? Bestseller { get; set; }
        public int? Limit { get; set; }
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }
}
