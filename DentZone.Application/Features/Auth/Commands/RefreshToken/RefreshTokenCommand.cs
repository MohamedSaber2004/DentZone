using DentZone.Application.Features.Auth.DTOs;
using MediatR;

namespace DentZone.Application.Features.Auth.Commands.RefreshToken
{
    public class RefreshTokenCommand : IRequest<LoginResponseDto>
    {
        public string RefreshToken { get; set; } = null!;
    }
}
