using MediatR;

namespace DentZone.Application.Features.Auth.Commands.ForgetPassword
{
    public class ForgetPasswordCommand : IRequest<string>
    {
        public string Email { get; set; } = null!;
    }
}
