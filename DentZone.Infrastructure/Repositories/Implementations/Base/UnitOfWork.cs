using DentZone.Domain.Common.Interfaces;
using DentZone.Domain.Repositories.Interfaces;
using DentZone.Domain.Repositories.Interfaces.Base;
using DentZone.Persistence;
using Microsoft.EntityFrameworkCore.Storage;

namespace DentZone.Infrastructure.Repositories.Implementations.Base
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly DentZoneContext _context;
        private readonly Dictionary<Type, object> _repositories;
        private IRefreshTokenRepository? _refreshTokenRepository;

        private IDbContextTransaction? _transaction;

        public UnitOfWork(DentZoneContext context)
        {
            _context = context;
            _repositories = new Dictionary<Type, object>();
        }

        public IRefreshTokenRepository RefreshTokens => _refreshTokenRepository ??= new RefreshTokenRepository(_context);

        public IGenericRepository<T, TKey> GetRepository<T, TKey>() where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>
        {
            var type = typeof(T);
            if (!_repositories.ContainsKey(type))
            {
                var repositoryInstance = new GenericRepository<T, TKey>(_context);
                _repositories.Add(type, repositoryInstance);
            }
            return (IGenericRepository<T, TKey>)_repositories[type];
        }
        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitAsync()
        {
            try
            {
                if (_transaction != null)
                {
                    await _transaction.CommitAsync();
                }
            }
            catch
            {
                await RollbackAsync();
                throw;
            }
            finally
            {
                if (_transaction != null)
                {
                    _transaction.Dispose();
                    _transaction = null!;
                }
            }
        }

        public async Task RollbackAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                _transaction.Dispose();
                _transaction = null!;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context?.Dispose();
        }
    }
}
