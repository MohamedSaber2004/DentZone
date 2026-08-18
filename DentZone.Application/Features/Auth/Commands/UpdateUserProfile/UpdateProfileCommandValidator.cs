using DentZone.Application.Localization;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using DentZone.Domain.Entities;
using DentZone.Domain.Enums;

namespace DentZone.Application.Features.Auth.Commands.UpdateUserProfile
{
    public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UpdateProfileCommandValidator(UserManager<ApplicationUser> userManager,
            IStringLocalizer<Messages> localizer)
        {
            _userManager = userManager;

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.UserIdRequired])
                .MustAsync(UserExistsAsync).WithMessage(localizer[LocalizationKeys.Auth.UserNotFound]);

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Auth.FullNameRequired]);

            RuleFor(x => x.BirthDate)
                .LessThan(DateTime.Now).WithMessage(localizer[LocalizationKeys.Auth.BirthDateInFuture]);

            RuleFor(x => x.Language)
                .Must(language => language is null || Enum.IsDefined(typeof(LanguageCode), language.Value))
                .WithMessage(localizer[LocalizationKeys.Auth.EmailInvalid]);
        }

        private async Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken)
        {
            return await _userManager.FindByIdAsync(userId.ToString()) is not null;
        }
    }
}
