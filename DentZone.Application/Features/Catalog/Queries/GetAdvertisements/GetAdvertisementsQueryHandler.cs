using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Application.Features.Catalog.Queries.GetAdvertisements
{
    public class GetAdvertisementsQueryHandler : IRequestHandler<GetAdvertisementsQuery, AdvertisementsDto>
    {
        private readonly IDentZoneContext _context;

        public GetAdvertisementsQueryHandler(IDentZoneContext context)
        {
            _context = context;
        }

        public async Task<AdvertisementsDto> Handle(GetAdvertisementsQuery request, CancellationToken cancellationToken)
        {
            var advertisements = await _context.Advertisements
                .AsNoTracking()
                .Where(a => !a.IsDeleted && a.IsActive)
                .OrderByDescending(a => a.IsHero)
                .ThenBy(a => a.CreatedAt)
                .ToListAsync(cancellationToken);

            var hero = advertisements.FirstOrDefault(a => a.IsHero) ?? advertisements.FirstOrDefault();

            return new AdvertisementsDto
            {
                Hero = hero?.ToDto(request.Language),
                Secondary = advertisements
                    .Where(a => hero is null || a.Id != hero.Id)
                    .Take(2)
                    .Select(a => a.ToDto(request.Language))
                    .ToList()
            };
        }
    }
}
