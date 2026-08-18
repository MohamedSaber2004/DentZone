using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Common.Options;
using DentZone.Application.Features.Auth.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using DentZone.Domain.Repositories.Interfaces;
using DentZone.Domain.Repositories.Interfaces.Base;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;

namespace DentZone.Application.Features.Auth.Commands.RefreshToken
{
    public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResponseDto>
    {
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly JwtOptions _jwtOptions;
        private readonly IStringLocalizer<Messages> _localizer;

        public RefreshTokenCommandHandler(IRefreshTokenRepository refreshTokenRepository,
            IUnitOfWork unitOfWork,
            UserManager<ApplicationUser> userManager,
            IJwtTokenService jwtTokenService,
            IOptions<JwtOptions> jwtOptions,
            IStringLocalizer<Messages> localizer)
        {
            _refreshTokenRepository = refreshTokenRepository;
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _jwtTokenService = jwtTokenService;
            _jwtOptions = jwtOptions.Value;
            _localizer = localizer;
        }

        public async Task<LoginResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            var storedToken = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);
            if (storedToken is null || storedToken.IsRevoked)
                throw new UnAuthorizedException(_localizer[LocalizationKeys.Auth.InvalidRefreshToken]);

            if (storedToken.ExpiryDate <= DateTime.Now)
            {
                storedToken.Revoke();
                await _unitOfWork.SaveChangesAsync();
                throw new UnAuthorizedException(_localizer[LocalizationKeys.Auth.RefreshTokenExpired]);
            }

            var user = await _userManager.FindByIdAsync(storedToken.UserId.ToString());
            if (user is null)
                throw new UnAuthorizedException(_localizer[LocalizationKeys.Auth.InvalidRefreshToken]);

            storedToken.Revoke();
            await _unitOfWork.SaveChangesAsync();

            var roles = await _userManager.GetRolesAsync(user);

            var accessToken = _jwtTokenService.GenerateAccessToken(user, roles);
            var refreshToken = await _jwtTokenService.GenerateRefreshToken(user.Id);

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiresAt = DateTime.Now.AddDays(_jwtOptions.ExpiryInDays),
                RefreshTokenExpiresAt = DateTime.Now.AddDays(_jwtOptions.RefreshTokenExpiryDays),
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                UserType = user.UserType,
                Roles = roles
            };
        }
    }
}
