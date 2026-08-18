using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Catalog.Queries.GetVendorBySlug
{
    public class GetVendorBySlugQuery : IRequest<VendorDto>
    {
        public string Slug { get; set; } = null!;
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }

    public class GetVendorBySlugQueryHandler : IRequestHandler<GetVendorBySlugQuery, VendorDto>
    {
        private readonly IDentZoneContext _context;
        private readonly IStringLocalizer<Messages> _localizer;

        public GetVendorBySlugQueryHandler(IDentZoneContext context, IStringLocalizer<Messages> localizer)
        {
            _context = context;
            _localizer = localizer;
        }

        public async Task<VendorDto> Handle(GetVendorBySlugQuery request, CancellationToken cancellationToken)
        {
            var vendor = await _context.Vendors
                .AsNoTracking()
                .Include(v => v.Products.Where(p => !p.IsDeleted))
                .FirstOrDefaultAsync(v => v.Slug == request.Slug && !v.IsDeleted, cancellationToken);

            if (vendor is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Catalog.VendorNotFound]);

            return vendor.ToDto(request.Language, vendor.Products.Count(p => !p.IsDeleted));
        }
    }
}
