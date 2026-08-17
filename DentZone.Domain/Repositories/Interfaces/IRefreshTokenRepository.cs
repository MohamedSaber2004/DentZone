using DentZone.Domain.Entities;

namespace DentZone.Domain.Repositories.Interfaces
{
    public interface IRefreshTokenRepository
    {
        Task<UserRefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
        Task<List<UserRefreshToken>> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}