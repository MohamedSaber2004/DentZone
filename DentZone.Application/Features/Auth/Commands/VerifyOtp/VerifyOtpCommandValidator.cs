using DentZone.Application.Localization;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands.VerifyOtp
{
    public class VerifyOtpCommandValidator : AbstractValidator<VerifyOtpCommand>
    {
        public VerifyOtpCommandValidator(IStringLocalizer<Messages> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.EmailRequired])
                .EmailAddress().WithMessage(localizer[LocalizationKeys.Auth.EmailInvalid]);

            RuleFor(x => x.OtpCode)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.OtpCodeRequired])
                .Matches(@"^\d{6}$").WithMessage(localizer[LocalizationKeys.Auth.OtpCodeFormat]);
        }
    }
}