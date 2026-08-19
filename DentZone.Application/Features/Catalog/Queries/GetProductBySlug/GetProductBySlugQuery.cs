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
}
