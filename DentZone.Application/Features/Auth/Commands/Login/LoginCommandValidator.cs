using DentZone.Application.Localization;
using DentZone.Application.Features.Auth.Commands;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands
{
    public class LoginCommandValidator : AbstractValidator<LoginCommand>
    {
        public LoginCommandValidator(IStringLocalizer<Messages> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.EmailRequired])
                .EmailAddress().WithMessage(localizer[LocalizationKeys.Auth.EmailInvalid]);

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.PasswordRequired]);
        }
    }
}
