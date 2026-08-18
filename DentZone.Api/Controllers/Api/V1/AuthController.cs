using Asp.Versioning;
using DentZone.Application.Features.Auth.Commands;
using DentZone.Application.Features.Auth.Commands.ForgetPassword;
using DentZone.Application.Features.Auth.Commands.Logout;
using DentZone.Application.Features.Auth.Commands.RefreshToken;
using DentZone.Application.Features.Auth.Commands.ResetPassword;
using DentZone.Application.Features.Auth.Commands.VerifyOtp;
using DentZone.Application.Features.Auth.Commands.UpdateUserProfile;
using DentZone.Application.Features.Auth.Queries.GetUserProfile;
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
    public class AuthController : BaseApiController
    {
        public AuthController(IMediator mediator, ILocalizationProvider localizationProvider) : base(mediator, localizationProvider) { }


        [HttpPost]
        [EnableRateLimiting("Login")]
        [Route(ApiRoutes.Auth.Login)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpPost]
        [EnableRateLimiting("General")]
        [Route(ApiRoutes.Auth.RefreshToken)]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpPost]
        [Route(ApiRoutes.Auth.Logout)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Logout([FromBody] LogoutCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpPost]
        [EnableRateLimiting("Otp")]
        [Route(ApiRoutes.Auth.ForgotPassword)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpPost]
        [EnableRateLimiting("Otp")]
        [Route(ApiRoutes.Auth.VerifyOtp)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpPost]
        [EnableRateLimiting("Otp")]
        [Route(ApiRoutes.Auth.ResetPassword)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpPut]
        [CustomAuthorize(UserType.Doctor)]
        [Route(ApiRoutes.Auth.UpdateUserProfile)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [CustomAuthorize(UserType.Doctor)]
        [Route(ApiRoutes.Auth.GetUserProfile)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetProfileQuery(), cancellationToken);
            return Ok(result);
        }
    }
}
