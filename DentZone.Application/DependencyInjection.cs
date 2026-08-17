using DentZone.Application.Common.Interfaces;
using DentZone.Application.Common.Services;
using DentZone.Application.Localization;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;

namespace DentZone.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddMediatR(cfg =>
            {
                cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
                cfg.AddOpenBehavior(typeof(Common.Behaviours.UnhandledExceptionBehaviour<,>));
                cfg.AddOpenBehavior(typeof(Common.Behaviours.LoggingBehaviour<,>));
                cfg.AddOpenBehavior(typeof(Common.Behaviours.ValidationBehaviour<,>));
                cfg.AddOpenBehavior(typeof(Common.Behaviours.PerformanceBehaviour<,>));
            });

            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(DependencyInjection).Assembly));

            services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();

            services.AddSingleton<ILocalizationProvider>(sp =>
            {
                var configuration = sp.GetRequiredService<IConfiguration>();
                var logger = sp.GetRequiredService<ILogger<JsonLocalizationProvider>>();
                return new JsonLocalizationProvider(configuration["Localization:ResourcesPath"], logger);
            });

            services.AddSingleton<IStringLocalizerFactory, JsonStringLocalizerFactory>();
            services.AddTransient<IStringLocalizer, JsonStringLocalizer>();

            return services;
        }
    }
}