using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Auth.DTOs;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Auth.Queries.GetUserProfile
{
    public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, UserProfileDto>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IStringLocalizer<Messages> _localizer;
        private readonly ICurrentUserService _currentUserService;
        private readonly IDentZoneContext _context;

        public GetProfileQueryHandler(UserManager<ApplicationUser> userManager,
            IStringLocalizer<Messages> localizer,
            ICurrentUserService currentUserService,
            IDentZoneContext context)
        {
            _userManager = userManager;
            _localizer = localizer;
            _currentUserService = currentUserService;
            _context = context;
        }

        public async Task<UserProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByIdAsync(_currentUserService.UserId.ToString());
            if (user is null)
                throw new NotFoundException(_localizer[LocalizationKeys.Auth.UserNotFound]);

            var ordersCount = await _context.Orders
                .AsNoTracking()
                .CountAsync(o => !o.IsDeleted && (
                    (user.Id != Guid.Empty && o.UserId == user.Id) ||
                    (!string.IsNullOrEmpty(user.Email) && o.CustomerEmail.ToLower() == user.Email.ToLower())
                ), cancellationToken);

            return new UserProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                BirthDate = user.BirthDate,
                ProfilePictureName = user.ProfilePictureName,
                Language = user.Language,
                UserType = user.UserType,
                OrdersCount = ordersCount
            };
        }
    }
}
