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
        private const string StoreSeedingFileName = "Seeding/Data/seed-store.json";

        public static async Task SeedAsync(DentZoneContext context, ILogger logger, CancellationToken cancellationToken = default)
        {
            var seedPath = Path.Combine(AppContext.BaseDirectory, SeedingFileName);
            if (!File.Exists(seedPath))
            {
                logger.LogWarning("Seeding file not found at {SeedPath}. Skipping seeding.", seedPath);
                return;
            }

            // Skip seeding entirely if roles or users tables already have data (not first run)
            var hasRoles = await context.Roles.AnyAsync(cancellationToken);
            var hasUsers = await context.Users.AnyAsync(cancellationToken);
            if (hasRoles && hasUsers)
            {
                logger.LogInformation("Users and roles tables already contain data. Skipping user/role seeding.");
                return;
            }

            var json = await File.ReadAllTextAsync(seedPath, System.Text.Encoding.UTF8, cancellationToken);
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

        public static async Task SeedStoreAsync(DentZoneContext context, ILogger logger, CancellationToken cancellationToken = default)
        {
            var seedPath = Path.Combine(AppContext.BaseDirectory, StoreSeedingFileName);
            if (!File.Exists(seedPath))
            {
                logger.LogWarning("Store seeding file not found at {SeedPath}. Skipping store seeding.", seedPath);
                return;
            }

            var json = await File.ReadAllTextAsync(seedPath, System.Text.Encoding.UTF8, cancellationToken);
            var seedingData = JsonSerializer.Deserialize<StoreSeedingData>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            });

            if (seedingData is null)
            {
                logger.LogWarning("No store seed data found. Skipping store seeding.");
                return;
            }

            // ── Categories ────────────────────────────────────────────────────────────
            var categoryIdsBySlug = new Dictionary<string, Guid>();
            var hasCategories = await context.Categories.AnyAsync(cancellationToken);
            if (hasCategories)
            {
                logger.LogInformation("Categories table already contains data. Skipping category seeding.");
                // Still populate the lookup map from the DB so products/ads can resolve slugs
                var dbCategories = await context.Categories
                    .Select(c => new { c.Id, c.Slug })
                    .ToListAsync(cancellationToken);
                foreach (var c in dbCategories)
                    categoryIdsBySlug[c.Slug] = c.Id;
            }
            else
            {
            foreach (var categoryData in seedingData.Categories)
            {
                var existing = await context.Categories.FirstOrDefaultAsync(c => c.Slug == categoryData.Slug, cancellationToken);
                if (existing is not null)
                {
                    existing.Update(categoryData.NameEn, categoryData.NameAr, categoryData.Slug,
                        categoryData.DescriptionEn, categoryData.DescriptionAr, categoryData.Emoji, categoryData.Tint, "system");
                    await context.SaveChangesAsync(cancellationToken);
                    categoryIdsBySlug[categoryData.Slug] = existing.Id;
                    logger.LogInformation("Seed category {Slug} found. Syncing from seed file.", categoryData.Slug);
                    continue;
                }

                var category = Category.Create(categoryData.NameEn, categoryData.NameAr, categoryData.Slug,
                    categoryData.DescriptionEn, categoryData.DescriptionAr, categoryData.Emoji, categoryData.Tint);
                await context.Categories.AddAsync(category, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
                categoryIdsBySlug[categoryData.Slug] = category.Id;
                logger.LogInformation("Seeding category {Slug} created.", categoryData.Slug);
            }
            } // end !hasCategories

            // ── Vendors ───────────────────────────────────────────────────────────────
            var vendorIdsBySlug = new Dictionary<string, Guid>();
            var hasVendors = await context.Vendors.AnyAsync(cancellationToken);
            if (hasVendors)
            {
                logger.LogInformation("Vendors table already contains data. Skipping vendor seeding.");
                var dbVendors = await context.Vendors
                    .Select(v => new { v.Id, v.Slug })
                    .ToListAsync(cancellationToken);
                foreach (var v in dbVendors)
                    vendorIdsBySlug[v.Slug] = v.Id;
            }
            else
            {
            foreach (var vendorData in seedingData.Vendors)
            {
                var existing = await context.Vendors.FirstOrDefaultAsync(v => v.Slug == vendorData.Slug, cancellationToken);
                if (existing is not null)
                {
                    existing.Update(vendorData.NameEn, vendorData.NameAr, vendorData.Slug,
                        vendorData.TaglineEn, vendorData.TaglineAr, vendorData.DescriptionEn, vendorData.DescriptionAr,
                        vendorData.Emoji, vendorData.Tint, vendorData.Verified, "system");
                    existing.UpdateRating(vendorData.Rating, vendorData.ReviewCount, "system");
                    await context.SaveChangesAsync(cancellationToken);
                    vendorIdsBySlug[vendorData.Slug] = existing.Id;
                    logger.LogInformation("Seed vendor {Slug} found. Syncing from seed file.", vendorData.Slug);
                    continue;
                }

                var vendor = Vendor.Create(vendorData.NameEn, vendorData.NameAr, vendorData.Slug,
                    vendorData.TaglineEn, vendorData.TaglineAr, vendorData.DescriptionEn, vendorData.DescriptionAr,
                    vendorData.Emoji, vendorData.Tint, vendorData.Verified);
                vendor.UpdateRating(vendorData.Rating, vendorData.ReviewCount, "system");
                await context.Vendors.AddAsync(vendor, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
                vendorIdsBySlug[vendorData.Slug] = vendor.Id;
                logger.LogInformation("Seeding vendor {Slug} created.", vendorData.Slug);
            }
            } // end !hasVendors

            // ── Products ──────────────────────────────────────────────────────────────
            var productIdsById = new Dictionary<Guid, Guid>();
            var hasProducts = await context.Products.AnyAsync(cancellationToken);
            if (hasProducts)
            {
                logger.LogInformation("Products table already contains data. Skipping product seeding.");
                var dbProducts = await context.Products
                    .Select(p => new { p.Id, p.Slug })
                    .ToListAsync(cancellationToken);
                // Map seed JSON Id → actual DB Id by matching slugs
                foreach (var productData in seedingData.Products)
                {
                    var match = dbProducts.FirstOrDefault(p => p.Slug == productData.Slug);
                    if (match is not null)
                        productIdsById[productData.Id] = match.Id;
                }
            }
            else
            {
            foreach (var productData in seedingData.Products)
            {
                var existing = await context.Products.FirstOrDefaultAsync(p => p.Slug == productData.Slug, cancellationToken);
                if (existing is not null)
                {
                    var existingCategoryId = categoryIdsBySlug.TryGetValue(productData.CategorySlug ?? string.Empty, out var foundExistingCategory)
                        ? foundExistingCategory
                        : existing.CategoryId;
                    var existingVendorId = vendorIdsBySlug.TryGetValue(productData.VendorSlug ?? string.Empty, out var foundExistingVendor)
                        ? foundExistingVendor
                        : existing.VendorId;

                    existing.Update(productData.Slug, productData.NameEn, productData.NameAr,
                        productData.TaglineEn, productData.TaglineAr, productData.DescriptionEn, productData.DescriptionAr,
                        productData.Brand, productData.Price, productData.CompareAtPrice, productData.StockQuantity,
                        productData.Image, existingCategoryId, existingVendorId, productData.Features,
                        productData.IsFeatured, productData.IsBestseller, productData.Badge, "system");
                    existing.UpdateRating(productData.Rating, productData.ReviewCount, "system");
                    await context.SaveChangesAsync(cancellationToken);
                    productIdsById[productData.Id] = existing.Id;
                    logger.LogInformation("Seed product {Slug} found. Syncing from seed file.", productData.Slug);
                    continue;
                }

                var categoryId = categoryIdsBySlug.TryGetValue(productData.CategorySlug ?? string.Empty, out var foundCategory)
                    ? foundCategory
                    : Guid.Empty;
                var vendorId = vendorIdsBySlug.TryGetValue(productData.VendorSlug ?? string.Empty, out var foundVendor)
                    ? foundVendor
                    : Guid.Empty;

                if (categoryId == Guid.Empty || vendorId == Guid.Empty)
                {
                    logger.LogWarning("Seed product {Slug} skipped: category or vendor not found.", productData.Slug);
                    continue;
                }

                var product = Product.Create(productData.Slug, productData.NameEn, productData.NameAr,
                    productData.TaglineEn, productData.TaglineAr, productData.DescriptionEn, productData.DescriptionAr,
                    productData.Brand, productData.Price, productData.CompareAtPrice, productData.StockQuantity,
                    productData.Image, categoryId, vendorId, productData.Features,
                    productData.IsFeatured, productData.IsBestseller, productData.Badge);
                product.UpdateRating(productData.Rating, productData.ReviewCount, "system");
                await context.Products.AddAsync(product, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
                productIdsById[productData.Id] = product.Id;
                logger.LogInformation("Seeding product {Slug} created.", productData.Slug);
            }
            } // end !hasProducts

            // ── Advertisements ────────────────────────────────────────────────────────
            var hasAdvertisements = await context.Advertisements.AnyAsync(cancellationToken);
            if (hasAdvertisements)
            {
                logger.LogInformation("Advertisements table already contains data. Skipping advertisement seeding.");
            }
            else
            {
            foreach (var advertisementData in seedingData.Advertisements)
            {
                var existing = await context.Advertisements.FirstOrDefaultAsync(a => a.Id == advertisementData.Id, cancellationToken);
                if (existing is not null)
                {
                    existing.Update(advertisementData.TitleEn, advertisementData.TitleAr, advertisementData.Image,
                        advertisementData.DescriptionEn, advertisementData.DescriptionAr, advertisementData.MobileImage,
                        advertisementData.CtaLabelEn, advertisementData.CtaLabelAr, advertisementData.CtaTo,
                        advertisementData.EyebrowEn, advertisementData.EyebrowAr, advertisementData.Theme, advertisementData.IsHero, "system");
                    await context.SaveChangesAsync(cancellationToken);
                    logger.LogInformation("Seed advertisement {Id} found. Syncing from seed file.", advertisementData.Id);
                    continue;
                }

                var advertisement = Advertisement.Create(advertisementData.TitleEn, advertisementData.TitleAr,
                    advertisementData.Image, advertisementData.DescriptionEn, advertisementData.DescriptionAr,
                    advertisementData.MobileImage, advertisementData.CtaLabelEn, advertisementData.CtaLabelAr,
                    advertisementData.CtaTo, advertisementData.EyebrowEn, advertisementData.EyebrowAr,
                    advertisementData.Theme, advertisementData.IsHero);
                // Force the stable seed Id so FindAsync works on future restarts
                advertisement.Id = advertisementData.Id;
                await context.Advertisements.AddAsync(advertisement, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
                logger.LogInformation("Seeding advertisement {Id} created.", advertisementData.Id);
            }
            } // end !hasAdvertisements

            // ── Reviews ───────────────────────────────────────────────────────────────
            var hasReviews = await context.Reviews.AnyAsync(cancellationToken);
            if (hasReviews)
            {
                logger.LogInformation("Reviews table already contains data. Skipping review seeding.");
            }
            else
            {
            foreach (var reviewData in seedingData.Reviews)
            {
                var existing = await context.Reviews.FindAsync(new object[] { reviewData.Id }, cancellationToken);
                if (existing is not null)
                {
                    logger.LogInformation("Seed review {Id} already exists. Skipping.", reviewData.Id);
                    continue;
                }

                if (!productIdsById.TryGetValue(reviewData.ProductId, out var productId))
                {
                    logger.LogWarning("Seed review {Id} skipped: product not found.", reviewData.Id);
                    continue;
                }

                var review = Review.Create(productId, reviewData.Rating, reviewData.Content,
                    reviewData.AuthorName, null, reviewData.VerifiedPurchase);
                review.SetHelpfulCount(reviewData.HelpfulCount, "system");
                await context.Reviews.AddAsync(review, cancellationToken);
                logger.LogInformation("Seeding review {Id} created.", reviewData.Id);
            }

            await context.SaveChangesAsync(cancellationToken);
            } // end !hasReviews
        }
    }
}
