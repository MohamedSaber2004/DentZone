using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Interfaces;
using DentZone.Application.Common.Models;
using DentZone.Application.Common.Options;
using DentZone.Application.Common.Services;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;

namespace DentZone.Application.Features.Auth.Commands.ForgetPassword
{
    public class ForgetPasswordCommandHandler : IRequestHandler<ForgetPasswordCommand, string>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly EmailOptions _emailOptions;
        private readonly IStringLocalizer<Messages> _localizer;

        public ForgetPasswordCommandHandler(UserManager<ApplicationUser> userManager,
            IEmailService emailService,
            IOptions<EmailOptions> emailOptions,
            IStringLocalizer<Messages> localizer)
        {
            _userManager = userManager;
            _emailService = emailService;
            _emailOptions = emailOptions.Value;
            _localizer = localizer;
        }

        public async Task<string> Handle(ForgetPasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null || user.IsDeleted)
                throw new NotFoundException(_localizer[LocalizationKeys.Auth.UserNotFound]);

            var otp = OtpGenerator.Generate();
            var expiry = DateTime.Now.AddMinutes(_emailOptions.VerificationCodeExpiryMinutes);

            user.RequestPasswordReset(otp, expiry);

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                throw new BadRequestException(updateResult.Errors.Select(e => e.Description).ToArray());

            try
            {
                await _emailService.SendPasswordResetOtpAsync(user.Email ?? string.Empty, user.FullName, otp, cancellationToken);
            }
            catch (Exception)
            {
                throw new BadRequestException(_localizer[LocalizationKeys.Auth.EmailSendFailed]);
            }

            return MaskEmail(user.Email ?? string.Empty);
        }

        private static string MaskEmail(string email)
        {
            var atIndex = email.IndexOf('@');
            if (atIndex <= 1)
                return email;

            return email[..1] + "***" + email[atIndex..];
        }
    }
}
