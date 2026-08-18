using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using DentZone.Domain.Repositories.Interfaces;
using DentZone.Domain.Repositories.Interfaces.Base;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands.ChangePassword
{
    public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICurrentUserService _currentUserService;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<Messages> _localizer;

        public ChangePasswordCommandHandler(UserManager<ApplicationUser> userManager,
            ICurrentUserService currentUserService,
            IRefreshTokenRepository refreshTokenRepository,
            IUnitOfWork unitOfWork,
            IStringLocalizer<Messages> localizer)
        {
            _userManager = userManager;
            _currentUserService = currentUserService;
            _refreshTokenRepository = refreshTokenRepository;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
        }

        public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByIdAsync(_currentUserService.UserId.ToString());
            if (user is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Auth.UserNotFound]);

            var currentPasswordValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
            if (!currentPasswordValid)
                throw new BadRequestException(_localizer[LocalizationKeys.Auth.WrongCurrentPassword]);

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
                throw new BadRequestException(result.Errors.FirstOrDefault()?.Description ?? _localizer[LocalizationKeys.Auth.PasswordTooShort, 6]);

            var activeTokens = await _refreshTokenRepository.GetActiveByUserIdAsync(user.Id, cancellationToken);
            foreach (var token in activeTokens)
            {
                token.Revoke();
            }
            await _unitOfWork.SaveChangesAsync();

            return true;
        }
    }
}