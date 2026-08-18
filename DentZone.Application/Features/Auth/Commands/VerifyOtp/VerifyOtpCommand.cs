using MediatR;

namespace DentZone.Application.Features.Auth.Commands.VerifyOtp
{
    public class VerifyOtpCommand : IRequest<bool>
    {
        public string Email { get; set; } = null!;
        public string OtpCode { get; set; } = null!;
    }
}