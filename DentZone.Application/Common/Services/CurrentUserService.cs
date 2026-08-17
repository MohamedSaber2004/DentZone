using DentZone.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace DentZone.Application.Common.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        public Guid UserId { get; }

        public bool IsAuthenticated { get; }

        public string? IpAddress { get; }

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            var httpContext = httpContextAccessor.HttpContext;

            if (httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value is { } userIdString &&
                Guid.TryParse(userIdString, out var userId))
            {
                UserId = userId;
            }
            else
            {
                UserId = Guid.Empty;
            }

            IsAuthenticated = httpContext?.User?.Identity?.IsAuthenticated ?? false;
            IpAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
        }
    }
}