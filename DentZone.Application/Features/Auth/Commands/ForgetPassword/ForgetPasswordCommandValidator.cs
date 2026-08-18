using DentZone.Application.Localization;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands.ForgetPassword
{
    public class ForgetPasswordCommandValidator : AbstractValidator<ForgetPasswordCommand>
    {
        public ForgetPasswordCommandValidator(IStringLocalizer<Messages> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.EmailRequired])
                .EmailAddress().WithMessage(localizer[LocalizationKeys.Auth.EmailInvalid]);
        }
    }
}
