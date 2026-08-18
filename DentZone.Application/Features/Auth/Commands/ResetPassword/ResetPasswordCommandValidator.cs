using DentZone.Application.Common.Options;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using IdentityOptions = DentZone.Application.Common.Options.IdentityOptions;

namespace DentZone.Application.Features.Auth.Commands.ResetPassword
{
    public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public ResetPasswordCommandValidator(IStringLocalizer<Messages> localizer,
            IOptions<IdentityOptions> identityOptions,
            UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.EmailRequired])
                .EmailAddress().WithMessage(localizer[LocalizationKeys.Auth.EmailInvalid]);

            RuleFor(x => x.OtpCode)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.OtpCodeRequired])
                .Matches(@"^\d{6}$").WithMessage(localizer[LocalizationKeys.Auth.OtpCodeFormat])
                .MustAsync(IsOtpValidAsync).WithMessage(localizer[LocalizationKeys.Auth.InvalidOtp]);

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.NewPasswordRequired])
                .MinimumLength(identityOptions.Value.RequiredLength)
                .WithMessage(localizer[LocalizationKeys.Auth.PasswordTooShort, identityOptions.Value.RequiredLength]);

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.ConfirmPasswordRequired])
                .Equal(x => x.NewPassword).WithMessage(localizer[LocalizationKeys.Auth.PasswordMismatch]);
        }

        private async Task<bool> IsOtpValidAsync(ResetPasswordCommand command, string otpCode, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByEmailAsync(command.Email);
            if (user is null)
                return true;

            return user.ValidatePasswordResetToken(otpCode);
        }
    }
}