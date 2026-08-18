using DentZone.Domain.Enums;

namespace DentZone.Application.Features.Auth.DTOs
{
    public record LoginResponseDto
    {
        public string AccessToken { get; init; } = null!;
        public string RefreshToken { get; init; } = null!;
        public DateTime AccessTokenExpiresAt { get; init; }
        public DateTime RefreshTokenExpiresAt { get; init; }
        public bool RefreshTokenReused { get; init; }
        public Guid UserId { get; init; }
        public string FullName { get; init; } = null!;
        public string Email { get; init; } = null!;
        public UserType UserType { get; init; }
        public IList<string> Roles { get; init; } = new List<string>();
    }
}
