using DentZone.Application.Common.Models;
using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace DentZone_Api.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public sealed class CustomAuthorizeAttribute : Attribute, IAuthorizationFilter
    {
        private readonly UserType[] _allowedUserTypes;

        public CustomAuthorizeAttribute(params UserType[] allowedUserTypes)
        {
            _allowedUserTypes = allowedUserTypes;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            if (user.Identity?.IsAuthenticated != true)
            {
                WriteResponse(context, StatusCodes.Status401Unauthorized, LocalizationKeys.ExceptionMessages.Unauthorized);
                return;
            }

            if (_allowedUserTypes.Length > 0 && !HasAllowedUserType(user))
            {
                WriteResponse(context, StatusCodes.Status403Forbidden, LocalizationKeys.ExceptionMessages.Forbidden);
            }
        }

        private bool HasAllowedUserType(ClaimsPrincipal user)
        {
            var userTypeClaim = user.FindFirstValue("UserType");
            if (string.IsNullOrWhiteSpace(userTypeClaim))
                return false;

            return Enum.TryParse<UserType>(userTypeClaim, out var userType)
                && _allowedUserTypes.Contains(userType);
        }

        private void WriteResponse(AuthorizationFilterContext context, int statusCode, string localizationKey)
        {
            var localizationProvider = context.HttpContext.RequestServices.GetRequiredService<ILocalizationProvider>();
            var message = localizationProvider.GetLocalizedString(localizationKey);

            context.Result = new JsonResult(ApiResponse<object>.Error(message, statusCode))
            {
                StatusCode = statusCode
            };
        }
    }
}