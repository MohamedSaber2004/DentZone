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
            public const string ChangePassword = Base + "/auth/change-password";
        }

        public static class Catalog
        {
            public const string Categories = Base + "/catalog/categories";
            public const string Products = Base + "/catalog/products";
            public const string ProductBySlug = Base + "/catalog/products/{slug}";
            public const string RelatedProducts = Base + "/catalog/products/{slug}/related";
            public const string Vendors = Base + "/catalog/vendors";
            public const string VendorBySlug = Base + "/catalog/vendors/{slug}";
            public const string VendorProducts = Base + "/catalog/vendors/{slug}/products";
            public const string Reviews = Base + "/catalog/reviews/{productId:guid}";
            public const string Advertisements = Base + "/catalog/advertisements";
            public const string Settings = Base + "/catalog/settings";
        }

        public static class Wishlist
        {
            public const string GetWishlist = Base + "/wishlist";
            public const string AddItem = Base + "/wishlist/{productId:guid}";
            public const string RemoveItem = Base + "/wishlist/{productId:guid}";
            public const string Clear = Base + "/wishlist";
        }

        public static class Orders
        {
            public const string GetOrders = Base + "/orders";
            public const string CreateOrder = Base + "/orders";
            public const string GetOrderById = Base + "/orders/{id:guid}";
        }
    }
}
