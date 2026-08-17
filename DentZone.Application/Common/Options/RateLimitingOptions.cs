namespace DentZone.Application.Common.Options
{
    public class RateLimitingOptions
    {
        public int PermitLimit { get; set; }

        public TimeSpan Window { get; set; }

        public int QueueLimit { get; set; }
    }
}
