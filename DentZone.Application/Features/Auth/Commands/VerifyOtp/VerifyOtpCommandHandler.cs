using DentZone.Application.Common.Exceptions;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands.VerifyOtp
{
    public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, bool>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IStringLocalizer<Messages> _localizer;

        public VerifyOtpCommandHandler(UserManager<ApplicationUser> userManager,
            IStringLocalizer<Messages> localizer)
        {
            _userManager = userManager;
            _localizer = localizer;
        }

        public async Task<bool> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null || user.IsDeleted)
                throw new NotFoundException(_localizer[LocalizationKeys.Auth.UserNotFound]);

            if (!user.ValidatePasswordResetToken(request.OtpCode))
                throw new BadRequestException(_localizer[LocalizationKeys.Auth.InvalidOtp]);

            return true;
        }
    }
}