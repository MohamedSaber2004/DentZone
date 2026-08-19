using DentZone.Application.Features.Catalog.DTOs;
using MediatR;

namespace DentZone.Application.Features.Catalog.Queries.GetCatalogSettings
{
    public class GetCatalogSettingsQuery : IRequest<CatalogSettingsDto>
    {
    }
}
