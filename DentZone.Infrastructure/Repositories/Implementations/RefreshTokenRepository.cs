using DentZone.Domain.Entities;
using DentZone.Domain.Repositories.Interfaces;
using DentZone.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DentZone.Infrastructure.Repositories.Implementations
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly DentZoneContext _context;

        public RefreshTokenRepository(DentZoneContext context)
        {
            _context = context;
        }

        public async Task<UserRefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default)
        {
            return await _context.Set<UserRefreshToken>()
                .FirstOrDefaultAsync(t => t.Token == token, cancellationToken);
        }

        public async Task<List<UserRefreshToken>> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.Set<UserRefreshToken>()
                .Where(t => t.UserId == userId && !t.IsRevoked && t.ExpiryDate > DateTime.Now)
                .ToListAsync(cancellationToken);
        }
    }
}