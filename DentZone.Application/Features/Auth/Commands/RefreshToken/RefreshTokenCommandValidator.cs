using DentZone.Application.Localization;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands.RefreshToken
{
    public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
    {
        public RefreshTokenCommandValidator(IStringLocalizer<Messages> localizer)
        {
            RuleFor(x => x.RefreshToken)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.TokenRequired]);
        }
    }
}
