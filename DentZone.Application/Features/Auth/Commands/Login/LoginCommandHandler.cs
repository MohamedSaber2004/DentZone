using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Common.Models;
using DentZone.Application.Common.Options;
using DentZone.Application.Features.Auth.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using DentZone.Domain.Repositories.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;

namespace DentZone.Application.Features.Auth.Commands
{
    public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly JwtOptions _jwtOptions;
        private readonly IStringLocalizer<Messages> _localizer;

        public LoginCommandHandler(UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IJwtTokenService jwtTokenService,
            IRefreshTokenRepository refreshTokenRepository,
            IOptions<JwtOptions> jwtOptions,
            IStringLocalizer<Messages> localizer)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenService = jwtTokenService;
            _refreshTokenRepository = refreshTokenRepository;
            _jwtOptions = jwtOptions.Value;
            _localizer = localizer;
        }

        public async Task<LoginResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null || user.IsDeleted)
                throw new UnAuthorizedException(_localizer[LocalizationKeys.Auth.InvalidCredentials].Value);

            if (!user.IsActive)
                throw new UnAuthorizedException(_localizer[LocalizationKeys.Auth.AccountDeactivated].Value);

            var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

            if (!signInResult.Succeeded)
                throw new UnAuthorizedException(GetSignInErrorMessage(signInResult));

            var roles = await _userManager.GetRolesAsync(user);

            var accessToken = _jwtTokenService.GenerateAccessToken(user, roles);

            var refreshTokenResult = await GetOrCreateRefreshTokenAsync(user.Id);

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenResult.Token,
                AccessTokenExpiresAt = DateTime.UtcNow.AddDays(_jwtOptions.ExpiryInDays),
                RefreshTokenExpiresAt = refreshTokenResult.ExpiresAt,
                RefreshTokenReused = refreshTokenResult.Reused,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                UserType = user.UserType,
                Roles = roles
            };
        }

        private string GetSignInErrorMessage(SignInResult signInResult)
        {
            if (signInResult.IsLockedOut)
                return _localizer[LocalizationKeys.Auth.LockedOut].Value;

            if (signInResult.IsNotAllowed)
                return _localizer[LocalizationKeys.Auth.EmailNotConfirmed].Value;

            return _localizer[LocalizationKeys.Auth.InvalidCredentials].Value;
        }

        private async Task<(string Token, DateTime ExpiresAt, bool Reused)> GetOrCreateRefreshTokenAsync(Guid userId)
        {
            var activeTokens = await _refreshTokenRepository.GetActiveByUserIdAsync(userId);

            var validToken = activeTokens.FirstOrDefault(t => t.ExpiryDate > DateTime.Now);
            if (validToken is not null)
            {
                return (validToken.Token, validToken.ExpiryDate, true);
            }

            var refreshToken = await _jwtTokenService.GenerateRefreshToken(userId);

            return (refreshToken, DateTime.Now.AddDays(_jwtOptions.RefreshTokenExpiryDays), false);
        }
    }
}
