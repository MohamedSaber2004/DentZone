using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Models;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands.ResetPassword
{
    public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, bool>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IStringLocalizer<Messages> _localizer;

        public ResetPasswordCommandHandler(UserManager<ApplicationUser> userManager,
            IStringLocalizer<Messages> localizer)
        {
            _userManager = userManager;
            _localizer = localizer;
        }

        public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null || user.IsDeleted)
                throw new NotFoundException(_localizer[LocalizationKeys.Auth.UserNotFound]);

            if (!user.ValidatePasswordResetToken(request.OtpCode))
                throw new BadRequestException(_localizer[LocalizationKeys.Auth.InvalidOtp]);

            var removeResult = await _userManager.RemovePasswordAsync(user);
            var addResult = await _userManager.AddPasswordAsync(user, request.NewPassword);

            if (!removeResult.Succeeded || !addResult.Succeeded)
            {
                var errors = removeResult.Errors.Concat(addResult.Errors).Select(e => e.Description).ToArray();
                throw new BadRequestException(errors);
            }

            user.ClearPasswordResetToken();

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                throw new BadRequestException(updateResult.Errors.Select(e => e.Description).ToArray());

            return true;
        }
    }
}