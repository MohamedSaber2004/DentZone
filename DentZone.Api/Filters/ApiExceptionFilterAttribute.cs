using DentZone.Application.Common.Exceptions;
using DentZone.Application.Common.Models;
using DentZone.Application.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace DentZone_Api.Filters
{
    public class ApiExceptionFilterAttribute : ExceptionFilterAttribute
    {
        private readonly IDictionary<Type, Action<ExceptionContext>> _exceptionHandlers;
        private readonly ILogger<ApiExceptionFilterAttribute> _logger;
        private readonly ILocalizationProvider _localizationProvider;

        public ApiExceptionFilterAttribute(ILogger<ApiExceptionFilterAttribute> logger, ILocalizationProvider localizationProvider)
        {
            _exceptionHandlers = new Dictionary<Type, Action<ExceptionContext>>
            {
                { typeof(ValidationException), HandleValidationException },
                { typeof(NotFoundException), HandleNotFoundException },
                { typeof(BadRequestException), HandleBadRequestException },
                { typeof(UnAuthorizedException), HandleUnauthorizedException }
            };
            _logger = logger;
            _localizationProvider = localizationProvider;
        }

        public override void OnException(ExceptionContext context)
        {
            HandleException(context);

            base.OnException(context);
        }

        private void HandleException(ExceptionContext context)
        {
            Type type = context.Exception.GetType();
            if (_exceptionHandlers.ContainsKey(type))
            {
                _exceptionHandlers[type].Invoke(context);
                return;
            }

            if (!context.ModelState.IsValid)
            {
                HandleInvalidModelStateException(context);
                return;
            }

            HandleUnknownException(context);
        }

        private void HandleValidationException(ExceptionContext context)
        {
            var exception = context.Exception as ValidationException;

            var localizedValidation = _localizationProvider.GetLocalizedString(LocalizationKeys.ExceptionMessages.Validation);
            string? message = localizedValidation ?? "Validation failed";
            var details = ApiResponse<object>.Error(exception?.Errors, message, StatusCodes.Status400BadRequest);

            context.Result = new BadRequestObjectResult(details);

            context.ExceptionHandled = true;
        }

        private void HandleInvalidModelStateException(ExceptionContext context)
        {
            var errors = context.ModelState.ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                            );

            var localizedInvalidState = _localizationProvider.GetLocalizedString(LocalizationKeys.ExceptionMessages.InvalidModelState);
            string? message = localizedInvalidState ?? "Invalid model state";
            var details = ApiResponse<object>.Error(errors, message, StatusCodes.Status400BadRequest);

            context.Result = new BadRequestObjectResult(details);

            context.ExceptionHandled = true;
        }

        private void HandleNotFoundException(ExceptionContext context)
        {
            var exception = context.Exception as NotFoundException;
            var localizedNotFound = _localizationProvider.GetLocalizedString(exception?.Message ?? LocalizationKeys.ExceptionMessages.NotFound);
            string? message = localizedNotFound ?? "Resource not found";
            var details = ApiResponse<object>.Error(message, StatusCodes.Status404NotFound);

            context.Result = new NotFoundObjectResult(details);

            context.ExceptionHandled = true;
        }

        private void HandleBadRequestException(ExceptionContext context)
        {
            var exception = context.Exception as BadRequestException;
            var localizedBadRequest = _localizationProvider.GetLocalizedString(exception?.Message ?? LocalizationKeys.ExceptionMessages.BadRequest);
            string? message = localizedBadRequest ?? "Bad request";
            var details = ApiResponse<object>.Error(message, StatusCodes.Status400BadRequest);

            context.Result = new BadRequestObjectResult(details);

            context.ExceptionHandled = true;

            _logger.LogError(exception, "{Message}", exception?.Message);
        }

        private void HandleUnauthorizedException(ExceptionContext context)
        {
            var exception = context.Exception as UnAuthorizedException;
            var localizedUnauthorized = _localizationProvider.GetLocalizedString(exception?.Message ?? LocalizationKeys.ExceptionMessages.Unauthorized);
            string? message = localizedUnauthorized ?? "Unauthorized access";
            var details = ApiResponse<object>.Error(new Dictionary<string, string[]>(), message, StatusCodes.Status401Unauthorized);

            context.Result = new UnauthorizedObjectResult(details);

            context.ExceptionHandled = true;
        }

        private void HandleUnknownException(ExceptionContext context)
        {
            _logger.LogError(context.Exception, "An unhandled exception has occurred while executing the request.");

            var localizedUnknown = _localizationProvider.GetLocalizedString(LocalizationKeys.ExceptionMessages.UnknownException);
            string? message = localizedUnknown ?? "An unknown error occurred";
            var details = ApiResponse<object>.Error(message, StatusCodes.Status500InternalServerError);

            context.Result = new ObjectResult(details)
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };

            context.ExceptionHandled = true;
        }
    }
}