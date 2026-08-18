using Asp.Versioning;
using DentZone.Application.Features.Orders.Commands.CreateOrder;
using DentZone.Application.Features.Orders.Queries.GetMyOrders;
using DentZone.Application.Features.Orders.Queries.GetOrderById;
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
    public class OrdersController : BaseApiController
    {
        public OrdersController(IMediator mediator, ILocalizationProvider localizationProvider) : base(mediator, localizationProvider) { }

        [HttpGet]
        [Route(ApiRoutes.Orders.GetOrders)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyOrders(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetMyOrdersQuery(), cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Route(ApiRoutes.Orders.GetOrderById)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetOrderById(string id, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetOrderByIdQuery { Id = id }, cancellationToken);
            return Ok(result);
        }

        [HttpPost]
        [Route(ApiRoutes.Orders.CreateOrder)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command, CancellationToken cancellationToken)
        {
            command.Language = ResolveLanguage();
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Orders.Placed));
        }
    }
}