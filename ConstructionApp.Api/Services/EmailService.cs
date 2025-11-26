// File: Services/EmailService.cs
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ConstructionApp.Api.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            var smtpSection = _config.GetSection("Smtp");

            // Validate required config
            var host = smtpSection["Host"] ?? throw new InvalidOperationException("SMTP Host not configured");
            var portStr = smtpSection["Port"] ?? "587";
            var fromEmail = smtpSection["From"] ?? "no-reply@constructionapp.com";
            var displayName = smtpSection["DisplayName"] ?? "Construction App";
            var username = smtpSection["User"] ?? throw new InvalidOperationException("SMTP User not configured");
            var password = smtpSection["Pass"] ?? throw new InvalidOperationException("SMTP Password not configured");

            if (!int.TryParse(portStr, out int port))
                port = 587;

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, displayName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to.Trim());

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            try
            {
                _logger.LogInformation($"Sending email to {to} via {host}:{port}");
                await client.SendMailAsync(message);
                _logger.LogInformation($"Email sent successfully to {to}");
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, $"SMTP Error sending email to {to}: {ex.Message}");
                throw new InvalidOperationException("Failed to send email via SMTP", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error sending email to {to}");
                throw new InvalidOperationException("Failed to send email", ex);
            }
        }
    }
}