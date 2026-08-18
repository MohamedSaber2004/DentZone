using Asp.Versioning;
using DentZone.Application.Features.Catalog.Queries.GetAdvertisements;
using DentZone.Application.Features.Catalog.Queries.GetCategories;
using DentZone.Application.Features.Catalog.Queries.GetCatalogSettings;
using DentZone.Application.Features.Catalog.Queries.GetProductBySlug;
using DentZone.Application.Features.Catalog.Queries.GetProducts;
using DentZone.Application.Features.Catalog.Queries.GetRelatedProducts;
using DentZone.Application.Features.Catalog.Queries.GetReviews;
using DentZone.Application.Features.Catalog.Queries.GetVendorBySlug;
using DentZone.Application.Features.Catalog.Queries.GetVendors;
using DentZone.Application.Localization;
using DentZone_Api.Controllers.Api;
using DentZone_Api.Routes;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DentZone_Api.Controllers.Api.V1
{
    [ApiVersion("1.0")]
    [EnableRateLimiting("General")]
    public class CatalogController : BaseApiController
    {
        public CatalogController(IMediator mediator, ILocalizationProvider localizationProvider) : base(mediator, localizationProvider) { }

        [HttpGet]
        [Route(ApiRoutes.Catalog.Categories)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetCategoriesQuery { Language = ResolveLanguage() }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.Products)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProducts([FromQuery] string? categorySlug, [FromQuery] string? search,
            [FromQuery] string? sort, [FromQuery] bool? featured, [FromQuery] bool? bestseller, [FromQuery] int? limit,
            CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetProductsQuery
            {
                CategorySlug = categorySlug,
                Search = search,
                Sort = sort,
                Featured = featured,
                Bestseller = bestseller,
                Limit = limit,
                Language = ResolveLanguage()
            }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.ProductBySlug)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProductBySlug(string slug, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetProductBySlugQuery { Slug = slug, Language = ResolveLanguage() }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.RelatedProducts)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRelatedProducts(string slug, [FromQuery] int? limit, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetRelatedProductsQuery
            {
                Slug = slug,
                Limit = limit ?? 4,
                Language = ResolveLanguage()
            }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.Vendors)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVendors([FromQuery] string? categorySlug, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetVendorsQuery { CategorySlug = categorySlug, Language = ResolveLanguage() }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.VendorBySlug)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetVendorBySlug(string slug, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetVendorBySlugQuery { Slug = slug, Language = ResolveLanguage() }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.VendorProducts)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetVendorProducts(string slug, [FromQuery] string? categorySlug,
            [FromQuery] string? search, [FromQuery] string? sort, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetProductsQuery
            {
                VendorSlug = slug,
                CategorySlug = categorySlug,
                Search = search,
                Sort = sort,
                Language = ResolveLanguage()
            }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.Reviews)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetReviews(Guid productId, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetReviewsQuery { ProductId = productId }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.Advertisements)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAdvertisements(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetAdvertisementsQuery { Language = ResolveLanguage() }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Catalog.Settings)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetCatalogSettingsQuery(), cancellationToken);
            return Ok(result);
        }
    }
}