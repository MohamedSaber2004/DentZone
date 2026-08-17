using DentZone.Domain.Common.Interfaces;
using DentZone.Domain.Repositories.Interfaces;

namespace DentZone.Domain.Repositories.Interfaces.Base
{
    public interface IUnitOfWork : IDisposable
    {
        IRefreshTokenRepository RefreshTokens { get; }

        IGenericRepository<T, TKey> GetRepository<T, TKey>() where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>;

        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitAsync();
        Task RollbackAsync();
    }
}
