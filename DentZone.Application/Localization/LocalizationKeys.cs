namespace DentZone.Application.Localization
{
    public static class LocalizationKeys
    {
        public static class ActionResults
        {
            public const string Ok = "ActionResults.Ok";
            public const string Created = "ActionResults.Created";
            public const string Accepted = "ActionResults.Accepted";
            public const string Deleted = "ActionResults.Deleted";
        }

        public static class ExceptionMessages
        {
            public const string Validation = "ExceptionMessages.Validation";
            public const string InvalidModelState = "ExceptionMessages.InvalidModelState";
            public const string NotFound = "ExceptionMessages.NotFound";
            public const string BadRequest = "ExceptionMessages.BadRequest";
            public const string Unauthorized = "ExceptionMessages.Unauthorized";
            public const string UnknownException = "ExceptionMessages.UnknownException";
        }

        public static class OpenApi
        {
            public const string Title = "OpenApi.Title";
            public const string Description = "OpenApi.Description";
            public const string ContactName = "OpenApi.ContactName";
            public const string LicenseName = "OpenApi.LicenseName";
            public const string LanguageParameter = "OpenApi.LanguageParameter";
        }
    }
}