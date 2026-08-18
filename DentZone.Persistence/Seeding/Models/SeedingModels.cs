using DentZone.Domain.Enums;

namespace DentZone.Persistence.Seeding.Models
{
    public class SeedingData
    {
        public List<string> Roles { get; set; } = new();
        public List<UserSeedData> Users { get; set; } = new();
    }

    public class UserSeedData
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public DateTime? BirthDate { get; set; }
        public LanguageCode Language { get; set; }
        public UserType UserType { get; set; }
        public string Password { get; set; } = null!;
    }
}
