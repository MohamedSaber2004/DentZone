using Asp.Versioning;
using DentZone.Application.Common.Options;
using DentZone.Application.Features.Auth.Commands;
using DentZone.Application.Features.Auth.Commands.ChangePassword;
using DentZone.Application.Features.Auth.Commands.ForgetPassword;
using DentZone.Application.Features.Auth.Commands.Logout;
using DentZone.Application.Features.Auth.Commands.RefreshToken;
using DentZone.Application.Features.Auth.Commands.ResetPassword;
using DentZone.Application.Features.Auth.Commands.VerifyOtp;
using DentZone.Application.Features.Auth.Commands.UpdateUserProfile;
using DentZone.Application.Features.Auth.DTOs;
using DentZone.Application.Features.Auth.Queries.GetUserProfile;
using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using DentZone_Api.Controllers.Api;
using DentZone_Api.Filters;
using DentZone_Api.Routes;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace DentZone_Api.Controllers.Api.V1
{
    [ApiVersion("1.0")]
    public class AuthController : BaseApiController
    {
        private const string AccessTokenCookie = "dz_access_token";
        private const string RefreshTokenCookie = "dz_refresh_token";

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
            SetAuthCookies(result);
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Auth.LoginSuccess));
        }

        [HttpPost]
        [EnableRateLimiting("General")]
        [Route(ApiRoutes.Auth.RefreshToken)]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand? command, CancellationToken cancellationToken)
        {
            command ??= new RefreshTokenCommand();
            if (string.IsNullOrWhiteSpace(command.RefreshToken))
                command.RefreshToken = Request.Cookies[RefreshTokenCookie] ?? string.Empty;

            var result = await _mediator.Send(command, cancellationToken);
            SetAuthCookies(result);
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Auth.TokenRefreshed));
        }

        [HttpPost]
        [Route(ApiRoutes.Auth.Logout)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Logout([FromBody] LogoutCommand? command, CancellationToken cancellationToken)
        {
            command ??= new LogoutCommand();
            if (string.IsNullOrWhiteSpace(command.RefreshToken))
                command.RefreshToken = Request.Cookies[RefreshTokenCookie] ?? string.Empty;

            var result = await _mediator.Send(command, cancellationToken);
            ClearAuthCookies();
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Auth.LogoutSuccess));
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
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Auth.ProfileFetched));
        }

        [HttpPut]
        [CustomAuthorize(UserType.Doctor)]
        [Route(ApiRoutes.Auth.ChangePassword)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(command, cancellationToken);
            ClearAuthCookies();
            return Ok(result, _localizationProvider.GetLocalizedString(LocalizationKeys.Auth.LogoutSuccess));
        }

        private void SetAuthCookies(LoginResponseDto response)
        {
            var jwtOptions = HttpContext.RequestServices.GetRequiredService<IOptions<JwtOptions>>().Value;
            var secure = Request.IsHttps;

            Response.Cookies.Append(AccessTokenCookie, response.AccessToken, new CookieOptions
            {
                HttpOnly = false,
                Secure = secure,
                SameSite = SameSiteMode.Strict,
                Path = "/api",
                MaxAge = TimeSpan.FromDays(jwtOptions.ExpiryInDays)
            });

            Response.Cookies.Append(RefreshTokenCookie, response.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = SameSiteMode.Strict,
                Path = "/api/v1/auth",
                MaxAge = TimeSpan.FromDays(jwtOptions.RefreshTokenExpiryDays)
            });
        }

        private void ClearAuthCookies()
        {
            Response.Cookies.Delete(AccessTokenCookie, new CookieOptions
            {
                Path = "/api",
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict
            });

            Response.Cookies.Delete(RefreshTokenCookie, new CookieOptions
            {
                Path = "/api/v1/auth",
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict
            });
        }
    }
}
