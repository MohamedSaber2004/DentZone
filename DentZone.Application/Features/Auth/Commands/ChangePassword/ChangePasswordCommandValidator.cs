using DentZone.Application.Common.Options;
using DentZone.Application.Localization;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;

namespace DentZone.Application.Features.Auth.Commands.ChangePassword
{
    public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
    {
        public ChangePasswordCommandValidator(IStringLocalizer<Messages> localizer,
            IOptions<IdentityOptions> identityOptions)
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.CurrentPasswordRequired]);

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.NewPasswordRequired])
                .MinimumLength(identityOptions.Value.RequiredLength)
                .WithMessage(localizer[LocalizationKeys.Auth.PasswordTooShort, identityOptions.Value.RequiredLength]);

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.ConfirmPasswordRequired])
                .Equal(x => x.NewPassword).WithMessage(localizer[LocalizationKeys.Auth.PasswordMismatch]);
        }
    }
}