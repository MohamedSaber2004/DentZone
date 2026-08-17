using Asp.Versioning;
using DentZone.Application.Localization;
using DentZone_Api.Routes;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DentZone_Api.Controllers.Api.V1
{
    [Route(ApiRoutes.Base + "/products")]
    public class ProductsController : BaseApiController
    {

        public ProductsController(IMediator mediator, ILocalizationProvider localizationProvider) : base(mediator, localizationProvider) { }

        [HttpGet]
        [ApiVersion("1.0")]
        public IActionResult GetV1()
        {
            return Ok(new { Version = "1.0", Message = "Products endpoint (v1)" });
        }

        [HttpGet]
        [ApiVersion("2.0")]
        public IActionResult GetV2()
        {
            return Ok(new { Version = "2.0", Message = "Products endpoint (v2)" });
        }
    }
}