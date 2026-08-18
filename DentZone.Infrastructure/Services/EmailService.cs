using DentZone.Application.Common.Interfaces;
using DentZone.Application.Common.Options;
using DentZone.Application.Localization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace DentZone.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailOptions _options;
        private readonly ILocalizationProvider _localizationProvider;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailOptions> options,
            ILocalizationProvider localizationProvider,
            ILogger<EmailService> logger)
        {
            _options = options.Value;
            _localizationProvider = localizationProvider;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_options.Email, _options.Name),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            message.To.Add(toEmail);

            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                Credentials = new NetworkCredential(_options.Username, _options.Password),
                EnableSsl = true,
                Timeout = 10000
            };

            try
            {
                await client.SendMailAsync(message, cancellationToken);
                _logger.LogInformation("Email sent successfully to {ToEmail} with subject {Subject}", toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail} with subject {Subject}", toEmail, subject);
                throw;
            }
        }

        public async Task SendPasswordResetOtpAsync(string toEmail, string fullName, string otpCode, CancellationToken cancellationToken = default)
        {
            var subject = _localizationProvider.GetLocalizedString(LocalizationKeys.Auth.OtpEmailSubject);
            var body = _localizationProvider.GetLocalizedString(
                LocalizationKeys.Auth.OtpEmailBody,
                null,
                fullName,
                otpCode,
                _options.VerificationCodeExpiryMinutes);

            await SendEmailAsync(toEmail, subject, body, cancellationToken);
        }
    }
}
