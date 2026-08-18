using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Catalog.Queries.GetVendors
{
    public class GetVendorsQuery : IRequest<List<VendorDto>>
    {
        public string? CategorySlug { get; set; }
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }

    public class GetVendorsQueryHandler : IRequestHandler<GetVendorsQuery, List<VendorDto>>
    {
        private readonly IDentZoneContext _context;

        public GetVendorsQueryHandler(IDentZoneContext context)
        {
            _context = context;
        }

        public async Task<List<VendorDto>> Handle(GetVendorsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Vendors
                .AsNoTracking()
                .Include(v => v.Products.Where(p => !p.IsDeleted))
                .Where(v => !v.IsDeleted);

            if (!string.IsNullOrWhiteSpace(request.CategorySlug))
                query = query.Where(v => v.Products.Any(p => p.Category.Slug == request.CategorySlug));

            var vendors = await query
                .OrderByDescending(v => v.Products.Count(p => !p.IsDeleted))
                .ThenBy(v => v.NameEn)
                .ToListAsync(cancellationToken);

            return vendors.Select(v => v.ToDto(request.Language, v.Products.Count(p => !p.IsDeleted))).ToList();
        }
    }
}
