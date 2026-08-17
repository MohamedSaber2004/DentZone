using System.Globalization;

namespace DentZone.Application.Localization
{
    public interface ILocalizationProvider
    {
        string GetLocalizedString(string key, string? culture = null);

        string GetLocalizedString(string key, string? culture, params object[] args);
    }
}