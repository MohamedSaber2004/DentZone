using Asp.Versioning;
using DentZone.Application.Features.Wishlist.Commands.AddWishlistItem;
using DentZone.Application.Features.Wishlist.Commands.ClearWishlist;
using DentZone.Application.Features.Wishlist.Commands.RemoveWishlistItem;
using DentZone.Application.Features.Wishlist.Queries.GetWishlist;
using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using DentZone_Api.Controllers.Api;
using DentZone_Api.Filters;
using DentZone_Api.Routes;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DentZone_Api.Controllers.Api.V1
{
    [ApiVersion("1.0")]
    [EnableRateLimiting("General")]
    [CustomAuthorize(UserType.Doctor)]
    public class WishlistController : BaseApiController
    {
        public WishlistController(IMediator mediator, ILocalizationProvider localizationProvider) : base(mediator, localizationProvider) { }

        [HttpGet]
        [Route(ApiRoutes.Wishlist.GetWishlist)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetWishlist(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetWishlistQuery { Language = ResolveLanguage() }, cancellationToken);
            return Ok(result);
        }

        [HttpPost]
        [Route(ApiRoutes.Wishlist.AddItem)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddItem(Guid productId, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new AddWishlistItemCommand { ProductId = productId }, cancellationToken);
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Wishlist.Added));
        }

        [HttpDelete]
        [Route(ApiRoutes.Wishlist.RemoveItem)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RemoveItem(Guid productId, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new RemoveWishlistItemCommand { ProductId = productId }, cancellationToken);
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Wishlist.Removed));
        }

        [HttpDelete]
        [Route(ApiRoutes.Wishlist.Clear)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Clear(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new ClearWishlistCommand(), cancellationToken);
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Wishlist.Cleared));
        }
    }
}