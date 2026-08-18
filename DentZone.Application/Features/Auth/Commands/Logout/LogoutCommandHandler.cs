using DentZone.Application.Common.Interfaces;
using DentZone.Domain.Repositories.Interfaces;
using DentZone.Domain.Repositories.Interfaces.Base;
using MediatR;

namespace DentZone.Application.Features.Auth.Commands.Logout
{
    public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
    {
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUnitOfWork _unitOfWork;

        public LogoutCommandHandler(IRefreshTokenRepository refreshTokenRepository, IUnitOfWork unitOfWork)
        {
            _refreshTokenRepository = refreshTokenRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
        {
            var storedToken = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);
            if (storedToken is not null && !storedToken.IsRevoked)
            {
                storedToken.Revoke();
                await _unitOfWork.SaveChangesAsync();
            }

            return true;
        }
    }
}