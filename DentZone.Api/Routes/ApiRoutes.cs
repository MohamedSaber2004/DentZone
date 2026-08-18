namespace DentZone_Api.Routes
{
    public static class ApiRoutes
    {
        public const string Base = "api/v{version:apiVersion}";

        public static class Auth
        {
            public const string Login = Base + "/auth/login";
            public const string Register = Base + "/auth/register";
            public const string RefreshToken = Base + "/auth/refresh-token";
            public const string Logout = Base + "/auth/logout";
            public const string ForgotPassword = Base + "/auth/forgot-password";
            public const string ResetPassword = Base + "/auth/reset-password";
            public const string VerifyOtp = Base + "/auth/verify-otp";
            public const string GetUserProfile = Base + "/auth/profile";
            public const string UpdateUserProfile = Base + "/auth/profile";
        }
    }
}
