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
            public const string Forbidden = "ExceptionMessages.Forbidden";
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

        public static class Auth
        {
            public const string InvalidCredentials = "Auth.InvalidCredentials";
            public const string InvalidRefreshToken = "Auth.InvalidRefreshToken";
            public const string EmailRequired = "Auth.EmailRequired";
            public const string EmailInvalid = "Auth.EmailInvalid";
            public const string PasswordRequired = "Auth.PasswordRequired";
            public const string TokenRequired = "Auth.TokenRequired";
            public const string UserIdRequired = "Auth.UserIdRequired";
            public const string UserNotFound = "Auth.UserNotFound";
            public const string FullNameRequired = "Auth.FullNameRequired";
            public const string BirthDateInFuture = "Auth.BirthDateInFuture";
            public const string LoginSuccess = "Auth.LoginSuccess";
            public const string TokenRefreshed = "Auth.TokenRefreshed";
            public const string ProfileUpdated = "Auth.ProfileUpdated";
            public const string ProfileFetched = "Auth.ProfileFetched";
            public const string LockedOut = "Auth.LockedOut";
            public const string EmailNotConfirmed = "Auth.EmailNotConfirmed";
            public const string AccountDeactivated = "Auth.AccountDeactivated";
            public const string RefreshTokenExpired = "Auth.RefreshTokenExpired";
            public const string TooManyAttempts = "Auth.TooManyAttempts";
            public const string OtpSent = "Auth.OtpSent";
            public const string OtpVerified = "Auth.OtpVerified";
            public const string PasswordResetSuccess = "Auth.PasswordResetSuccess";
            public const string InvalidOtp = "Auth.InvalidOtp";
            public const string EmailSendFailed = "Auth.EmailSendFailed";
            public const string OtpCodeRequired = "Auth.OtpCodeRequired";
            public const string OtpCodeFormat = "Auth.OtpCodeFormat";
            public const string NewPasswordRequired = "Auth.NewPasswordRequired";
            public const string PasswordTooShort = "Auth.PasswordTooShort";
            public const string ConfirmPasswordRequired = "Auth.ConfirmPasswordRequired";
            public const string PasswordMismatch = "Auth.PasswordMismatch";
            public const string CurrentPasswordRequired = "Auth.CurrentPasswordRequired";
            public const string WrongCurrentPassword = "Auth.WrongCurrentPassword";
            public const string PasswordChanged = "Auth.PasswordChanged";
            public const string LogoutSuccess = "Auth.LogoutSuccess";
            public const string OtpEmailSubject = "Auth.OtpEmailSubject";
            public const string OtpEmailBody = "Auth.OtpEmailBody";
        }

        public static class Catalog
        {
            public const string ProductNotFound = "Catalog.ProductNotFound";
            public const string VendorNotFound = "Catalog.VendorNotFound";
            public const string CategoryNotFound = "Catalog.CategoryNotFound";
        }

        public static class Wishlist
        {
            public const string Added = "Wishlist.Added";
            public const string Removed = "Wishlist.Removed";
            public const string Cleared = "Wishlist.Cleared";
        }

        public static class Orders
        {
            public const string Placed = "Orders.Placed";
            public const string OrderNotFound = "Orders.OrderNotFound";
            public const string CustomerNameRequired = "Orders.CustomerNameRequired";
            public const string CustomerEmailRequired = "Orders.CustomerEmailRequired";
            public const string ShippingAddressRequired = "Orders.ShippingAddressRequired";
            public const string ShippingCityRequired = "Orders.ShippingCityRequired";
            public const string LinesRequired = "Orders.LinesRequired";
            public const string InvalidQuantity = "Orders.InvalidQuantity";
            public const string ProductUnavailable = "Orders.ProductUnavailable";
            public const string OutOfStock = "Orders.OutOfStock";
        }
    }
}