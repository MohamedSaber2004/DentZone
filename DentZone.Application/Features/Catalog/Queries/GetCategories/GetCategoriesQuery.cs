using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Catalog.Queries.GetCategories
{
    public class GetCategoriesQuery : IRequest<List<CategoryDto>>
    {
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }

    public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
    {
        private readonly IDentZoneContext _context;

        public GetCategoriesQueryHandler(IDentZoneContext context)
        {
            _context = context;
        }

        public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
        {
            return await _context.Categories
                .AsNoTracking()
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.NameEn)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = request.Language == LanguageCode.ar ? c.NameAr : c.NameEn,
                    Slug = c.Slug,
                    Description = request.Language == LanguageCode.ar ? c.DescriptionAr : c.DescriptionEn,
                    Emoji = c.Emoji,
                    Tint = c.Tint,
                    ProductCount = c.Products.Count(p => !p.IsDeleted)
                })
                .ToListAsync(cancellationToken);
        }
    }
}
