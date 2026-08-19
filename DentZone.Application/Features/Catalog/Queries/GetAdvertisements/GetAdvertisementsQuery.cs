using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Catalog.Queries.GetAdvertisements
{
    public class GetAdvertisementsQuery : IRequest<AdvertisementsDto>
    {
        public LanguageCode Language { get; set; } = LanguageCode.en;
}
