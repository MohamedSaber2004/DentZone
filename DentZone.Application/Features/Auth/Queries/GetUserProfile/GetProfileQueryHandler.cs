using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Auth.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Queries.GetUserProfile
{
    public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, UserProfileDto>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IStringLocalizer<Messages> _localizer;
        private readonly ICurrentUserService _currentUserService;

        public GetProfileQueryHandler(UserManager<ApplicationUser> userManager,
            IStringLocalizer<Messages> localizer,
            ICurrentUserService currentUserService)
        {
            _userManager = userManager;
            _localizer = localizer;
            _currentUserService = currentUserService;
        }

        public async Task<UserProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByIdAsync(_currentUserService.UserId.ToString());
            if (user is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Auth.UserNotFound]);

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
