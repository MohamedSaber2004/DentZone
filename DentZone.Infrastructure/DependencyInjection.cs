using DentZone.Application.Common.Interfaces;
using DentZone.Application.Common.Options;
using DentZone.Application.Localization;
using DentZone.Domain.Entities;
using DentZone.Domain.Repositories.Interfaces.Base;
using DentZone.Domain.Repositories.Interfaces;
using DentZone.Infrastructure.Repositories.Implementations.Base;
using DentZone.Infrastructure.Repositories.Implementations;
using DentZone.Infrastructure.Services;
using DentZone.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using IdentityOptions = DentZone.Application.Common.Options.IdentityOptions;

namespace DentZone.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped(typeof(IGenericRepository<,>), typeof(GenericRepository<,>));
            services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IEmailService, EmailService>();

            services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
            services.Configure<IdentityOptions>(configuration.GetSection("Identity"));
            services.Configure<EmailOptions>(configuration.GetSection("EmailSettings"));


            var identityOptions = configuration.GetSection("Identity").Get<IdentityOptions>();

            services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.Password.RequireDigit = identityOptions.RequiredDigit;
                options.Password.RequiredLength = identityOptions.RequiredLength;
                options.Password.RequireLowercase = identityOptions.RequireLowercase;
                options.Password.RequiredUniqueChars = identityOptions.RequiredUniqueChars;
                options.Password.RequireUppercase = identityOptions.RequireUppercase;
                options.Password.RequireNonAlphanumeric = identityOptions.RequireNonAlphanumeric;
                options.User.AllowedUserNameCharacters = identityOptions.AllowedUserNameCharacters;
                options.User.RequireUniqueEmail = identityOptions.RequireUniqueEmail;
                options.Lockout.MaxFailedAccessAttempts = identityOptions.MaxFailedAttempts;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromDays(identityOptions.LockoutTimeSpanInDays);
                options.SignIn.RequireConfirmedEmail = identityOptions.RequireConfirmedEmail;
            })
            .AddEntityFrameworkStores<DentZoneContext>()
            .AddDefaultTokenProviders();

            var jwtOptions = configuration.GetSection("Jwt").Get<JwtOptions>();

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtOptions.Secret)),
                ValidateIssuer = false,
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = false,
                ValidAudience = jwtOptions.Audience,
                RequireExpirationTime = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            };

            services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.SaveToken = true;
                options.TokenValidationParameters = tokenValidationParameters;
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";

                        var localizationProvider = context.HttpContext.RequestServices.GetRequiredService<ILocalizationProvider>();
                        var localizedMessage = localizationProvider.GetLocalizedString(LocalizationKeys.ExceptionMessages.Unauthorized);
                        var result = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            succeeded = false,
                            message = localizedMessage,
                            errors = new Dictionary<string, string[]>(),
                            code = 401
                        });

                        await context.Response.WriteAsync(result);
                    }
                };
            });

            return services;
        }
    }
}