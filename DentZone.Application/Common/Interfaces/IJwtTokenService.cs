using DentZone.Domain.Entities;

namespace DentZone.Application.Common.Interfaces
{
    public interface IJwtTokenService
    {
        string GenerateAccessToken(ApplicationUser user, IList<string> roles);

        Task<string> GenerateRefreshToken(Guid userId);
    }
}
