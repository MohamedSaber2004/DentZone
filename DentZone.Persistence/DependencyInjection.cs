using DentZone.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DentZone.Persistence
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddPersistenceServices(this IServiceCollection services)
        {
            services.AddDbContext<DentZoneContext>((serviceProvider, options) =>
            {
                var configuration = serviceProvider.GetRequiredService<IConfiguration>();
                var connectionString = configuration.GetConnectionString("DentZoneConnection");
                options.UseNpgsql(connectionString);
            });

            services.AddScoped<IDentZoneContext>(provider => provider.GetRequiredService<DentZoneContext>());

            return services;
        }
    }
}