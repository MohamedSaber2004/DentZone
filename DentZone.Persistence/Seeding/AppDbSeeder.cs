using DentZone.Domain.Entities;
using DentZone.Persistence.Seeding.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DentZone.Persistence.Seeding
{
    public static class AppDbSeeder
    {
        private const string SeedingFileName = "Seeding/Data/seed-users.json";

        public static async Task SeedAsync(DentZoneContext context, ILogger logger, CancellationToken cancellationToken = default)
        {
            var seedPath = Path.Combine(AppContext.BaseDirectory, SeedingFileName);
            if (!File.Exists(seedPath))
            {
                logger.LogWarning("Seeding file not found at {SeedPath}. Skipping seeding.", seedPath);
                return;
            }

            var json = await File.ReadAllTextAsync(seedPath, cancellationToken);
            var seedingData = JsonSerializer.Deserialize<SeedingData>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            });

            if (seedingData is null || (seedingData.Users.Count == 0 && seedingData.Roles.Count == 0))
            {
                logger.LogWarning("No seed data found. Skipping seeding.");
                return;
            }

            foreach (var roleName in seedingData.Roles)
            {
                if (await context.Roles.AnyAsync(r => r.Name == roleName, cancellationToken))
                {
                    logger.LogInformation("Seed role {RoleName} already exists. Skipping.", roleName);
                    continue;
                }

                await context.Roles.AddAsync(new IdentityRole<Guid>
                {
                    Id = Guid.NewGuid(),
                    Name = roleName,
                    NormalizedName = roleName.ToUpperInvariant()
                }, cancellationToken);

                logger.LogInformation("Seeding role {RoleName} created.", roleName);
            }

            await context.SaveChangesAsync(cancellationToken);

            var passwordHasher = new PasswordHasher<ApplicationUser>();
            var seededUsers = new List<ApplicationUser>();

            foreach (var userData in seedingData.Users)
            {
                var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == userData.Email, cancellationToken);

                ApplicationUser user;
                if (existingUser is not null)
                {
                    var repaired = false;

                    if (string.IsNullOrEmpty(existingUser.NormalizedEmail) || string.IsNullOrEmpty(existingUser.NormalizedUserName))
                    {
                        existingUser.NormalizedEmail = userData.Email.ToUpperInvariant();
                        existingUser.NormalizedUserName = userData.UserName.ToUpperInvariant();
                        logger.LogInformation("Seed user {Email} found with missing normalized fields. Repairing.", userData.Email);
                        repaired = true;
                    }

                    if (string.IsNullOrEmpty(existingUser.SecurityStamp))
                    {
                        existingUser.SecurityStamp = Guid.NewGuid().ToString("D");
                        logger.LogInformation("Seed user {Email} found with missing security stamp. Repairing.", userData.Email);
                        repaired = true;
                    }

                    if (!repaired)
                    {
                        logger.LogInformation("Seed user {Email} already exists. Skipping.", userData.Email);
                    }

                    user = existingUser;
                }
                else
                {
                    user = new ApplicationUser
                    {
                        Id = userData.Id,
                        UserName = userData.UserName,
                        NormalizedUserName = userData.UserName.ToUpperInvariant(),
                        Email = userData.Email,
                        NormalizedEmail = userData.Email.ToUpperInvariant(),
                        EmailConfirmed = true,
                        SecurityStamp = Guid.NewGuid().ToString("D")
                    };

                    user.UpdateProfile(userData.FullName, userData.BirthDate, null, "system");
                    user.SetLanguage(userData.Language, "system");
                    user.SetUserType(userData.UserType, "system");
                    user.PasswordHash = passwordHasher.HashPassword(user, userData.Password);

                    await context.Users.AddAsync(user, cancellationToken);
                    logger.LogInformation("Seeding user {Email} created.", userData.Email);
                }

                seededUsers.Add(user);
            }

            await context.SaveChangesAsync(cancellationToken);

            foreach (var user in seededUsers)
            {
                foreach (var roleName in seedingData.Roles)
                {
                    var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName, cancellationToken);
                    if (role is null)
                        continue;

                    var alreadyAssigned = await context.UserRoles.AnyAsync(
                        ur => ur.UserId == user.Id && ur.RoleId == role.Id, cancellationToken);
                    if (alreadyAssigned)
                        continue;

                    await context.UserRoles.AddAsync(new IdentityUserRole<Guid>
                    {
                        UserId = user.Id,
                        RoleId = role.Id
                    }, cancellationToken);

                    logger.LogInformation("Assigned role {RoleName} to user {Email}.", roleName, user.Email);
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
