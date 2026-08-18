using DentZone.Domain.Enums;

namespace DentZone.Application.Features.Auth.DTOs
{
    public record UserProfileDto
    {
        public Guid Id { get; init; }
        public string FullName { get; init; } = null!;
        public string? Email { get; init; }
        public DateTime? BirthDate { get; init; }
        public string? ProfilePictureName { get; init; }
        public LanguageCode Language { get; init; }
        public UserType UserType { get; init; }
    }
}
