using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Catalog.Queries.GetProductBySlug
{
    public class GetProductBySlugQuery : IRequest<ProductDto>
    {
        public string Slug { get; set; } = null!;
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }

    public class GetProductBySlugQueryHandler : IRequestHandler<GetProductBySlugQuery, ProductDto>
    {
        private readonly IDentZoneContext _context;
        private readonly IStringLocalizer<Messages> _localizer;

        public GetProductBySlugQueryHandler(IDentZoneContext context, IStringLocalizer<Messages> localizer)
        {
            _context = context;
            _localizer = localizer;
        }

        public async Task<ProductDto> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
        {
            var product = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Vendor)
                .FirstOrDefaultAsync(p => p.Slug == request.Slug && !p.IsDeleted, cancellationToken);

            if (product is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Catalog.ProductNotFound]);

            return product.ToDto(request.Language);
        }
    }
}
