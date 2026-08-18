using MediatR;

namespace DentZone.Application.Features.Auth.Commands.ChangePassword
{
    public class ChangePasswordCommand : IRequest<bool>
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}