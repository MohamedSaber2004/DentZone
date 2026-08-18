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

    public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, List<ProductDto>>
    {
        private readonly IDentZoneContext _context;

        public GetProductsQueryHandler(IDentZoneContext context)
        {
            _context = context;
        }

        public async Task<List<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Vendor)
                .Where(p => !p.IsDeleted);

            if (!string.IsNullOrWhiteSpace(request.CategorySlug))
                query = query.Where(p => p.Category.Slug == request.CategorySlug);

            if (!string.IsNullOrWhiteSpace(request.VendorSlug))
                query = query.Where(p => p.Vendor.Slug == request.VendorSlug);

            if (request.Featured == true)
                query = query.Where(p => p.IsFeatured);

            if (request.Bestseller == true)
                query = query.Where(p => p.IsBestseller);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var search = request.Search.Trim().ToLowerInvariant();
                query = query.Where(p =>
                    p.NameEn.ToLower().Contains(search) ||
                    p.NameAr.ToLower().Contains(search) ||
                    p.TaglineEn.ToLower().Contains(search) ||
                    p.TaglineAr.ToLower().Contains(search) ||
                    p.Brand.ToLower().Contains(search) ||
                    p.Slug.ToLower().Contains(search));
            }

            query = request.Sort switch
            {
                "price-asc" => query.OrderBy(p => p.Price),
                "price-desc" => query.OrderByDescending(p => p.Price),
                "rating" => query.OrderByDescending(p => p.Rating).ThenByDescending(p => p.ReviewCount),
                "newest" => query.OrderByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.Rating).ThenBy(p => p.NameEn)
            };

            if (request.Limit.HasValue && request.Limit.Value > 0)
                query = query.Take(Math.Min(request.Limit.Value, 200));

            var products = await query.ToListAsync(cancellationToken);

            return products.Select(p => p.ToDto(request.Language)).ToList();
        }
    }
}
