using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Catalog.Queries.GetProducts
{
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
                var search = $"%{request.Search.Trim()}%";
                query = query.Where(p =>
                    EF.Functions.Like(p.NameEn, search) ||
                    EF.Functions.Like(p.NameAr, search) ||
                    EF.Functions.Like(p.TaglineEn, search) ||
                    EF.Functions.Like(p.TaglineAr, search) ||
                    EF.Functions.Like(p.DescriptionEn, search) ||
                    EF.Functions.Like(p.DescriptionAr, search) ||
                    EF.Functions.Like(p.Brand, search) ||
                    EF.Functions.Like(p.Slug, search) ||
                    EF.Functions.Like(p.Category.NameEn, search) ||
                    EF.Functions.Like(p.Category.NameAr, search) ||
                    EF.Functions.Like(p.Vendor.NameEn, search) ||
                    EF.Functions.Like(p.Vendor.NameAr, search));
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
