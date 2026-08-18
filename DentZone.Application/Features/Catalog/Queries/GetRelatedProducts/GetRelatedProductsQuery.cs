using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Catalog.Queries.GetRelatedProducts
{
    public class GetRelatedProductsQuery : IRequest<List<ProductDto>>
    {
        public string Slug { get; set; } = null!;
        public int Limit { get; set; } = 4;
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }

    public class GetRelatedProductsQueryHandler : IRequestHandler<GetRelatedProductsQuery, List<ProductDto>>
    {
        private readonly IDentZoneContext _context;
        private readonly IStringLocalizer<Messages> _localizer;

        public GetRelatedProductsQueryHandler(IDentZoneContext context, IStringLocalizer<Messages> localizer)
        {
            _context = context;
            _localizer = localizer;
        }

        public async Task<List<ProductDto>> Handle(GetRelatedProductsQuery request, CancellationToken cancellationToken)
        {
            var product = await _context.Products
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Slug == request.Slug && !p.IsDeleted, cancellationToken);

            if (product is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Catalog.ProductNotFound]);

            var limit = Math.Clamp(request.Limit, 1, 20);

            var related = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Vendor)
                .Where(p => !p.IsDeleted && p.Id != product.Id)
                .OrderByDescending(p => p.CategoryId == product.CategoryId)
                .ThenByDescending(p => p.Rating)
                .ThenByDescending(p => p.ReviewCount)
                .Take(limit)
                .ToListAsync(cancellationToken);

            return related.Select(p => p.ToDto(request.Language)).ToList();
        }
    }
}
