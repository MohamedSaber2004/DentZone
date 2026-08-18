using DentZone.Application.Common.Exceptions;
using DentZone.Application.Features.Auth.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Commands.UpdateUserProfile
{
    public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UserProfileDto>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IStringLocalizer<Messages> _localizer;

        public UpdateProfileCommandHandler(UserManager<ApplicationUser> userManager,
            IStringLocalizer<Messages> localizer)
        {
            _userManager = userManager;
            _localizer = localizer;
        }

        public async Task<UserProfileDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Auth.UserNotFound]);

            user.UpdateProfile(request.FullName, request.BirthDate, request.ProfilePictureName, request.UserId.ToString());
            user.SetLanguage(request.Language, request.UserId.ToString());

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new BadRequestException(result.Errors.Select(e => e.Description).ToArray());

            return new UserProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                BirthDate = user.BirthDate,
                ProfilePictureName = user.ProfilePictureName,
                Language = user.Language,
                UserType = user.UserType
            };
        }
    }
}
