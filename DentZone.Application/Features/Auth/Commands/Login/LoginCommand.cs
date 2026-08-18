using DentZone.Application.Features.Auth.DTOs;
using MediatR;

namespace DentZone.Application.Features.Auth.Commands
{
    public class LoginCommand : IRequest<LoginResponseDto>
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
