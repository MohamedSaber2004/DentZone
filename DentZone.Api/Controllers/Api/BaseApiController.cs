using DentZone.Application.Common.Models;
using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DentZone_Api.Controllers.Api
{
    [ApiController]
    public class BaseApiController : Controller
    {
        public readonly IMediator _mediator;
        protected readonly ILocalizationProvider _localizationProvider;

        protected BaseApiController(IMediator mediator, ILocalizationProvider localizationProvider)
        {
            _mediator = mediator;
            _localizationProvider = localizationProvider;
        }

        protected LanguageCode ResolveLanguage()
        {
            var header = Request.Headers.AcceptLanguage.ToString();
            return header.Contains("ar", StringComparison.OrdinalIgnoreCase) ? LanguageCode.ar : LanguageCode.en;
        }

        protected IActionResult Ok(string message) => base.Ok(ApiResponse<string>.Ok(null, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Ok)));
        protected IActionResult Ok<TData>(TData? data, string message = null!) => base.Ok(ApiResponse<TData>.Ok(data, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Ok)));
        protected IActionResult Ok2<TData>(TData? data, string message = null!) => base.Ok(Ok(data, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Ok)));
        protected IActionResult Deleted<TData>(string uri, TData data, string message = null!) => base.Accepted(uri, ApiResponse<TData>.Ok(data, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Deleted)));
        protected IActionResult Accepted<TData>(string uri, TData data, string message = null!) => base.Accepted(uri, ApiResponse<TData>.Ok(data, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Accepted)));
        protected IActionResult Created<TData>(string uri, TData data, string message = null!) => base.Created(uri, ApiResponse<TData>.Ok(data, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Created)));
        protected IActionResult Deleted<TData>(TData data, string message = null!) => base.Accepted(ApiResponse<TData>.Ok(data, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Deleted)));
        protected IActionResult Accepted<TData>(TData data, string message = null!) => base.Accepted(ApiResponse<TData>.Ok(data, message ?? _localizationProvider.GetLocalizedString(LocalizationKeys.ActionResults.Accepted)));
    }
}
