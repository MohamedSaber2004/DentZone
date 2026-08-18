using System.Security.Cryptography;

namespace DentZone.Application.Common.Services
{
    public static class OtpGenerator
    {
        public static string Generate(int length = 6)
        {
            var min = (int)Math.Pow(10, length - 1);
            var max = (int)Math.Pow(10, length);
            return RandomNumberGenerator.GetInt32(min, max).ToString();
        }
    }
}
