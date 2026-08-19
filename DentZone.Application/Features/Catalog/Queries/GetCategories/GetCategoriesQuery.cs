using DentZone.Application.Features.Catalog.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Catalog.Queries.GetCategories
{
    public class GetCategoriesQuery : IRequest<List<CategoryDto>>
    {
        public LanguageCode Language { get; set; } = LanguageCode.en;
    }
}
