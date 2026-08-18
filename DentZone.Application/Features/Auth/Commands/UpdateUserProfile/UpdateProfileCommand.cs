using DentZone.Application.Features.Auth.DTOs;
using DentZone.Domain.Enums;
using MediatR;

namespace DentZone.Application.Features.Auth.Commands.UpdateUserProfile
{
    public class UpdateProfileCommand : IRequest<UserProfileDto>
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = null!;
        public DateTime? BirthDate { get; set; }
        public string? ProfilePictureName { get; set; }
        public LanguageCode? Language { get; set; }
    }
}