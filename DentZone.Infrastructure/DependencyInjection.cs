using DentZone.Domain.Repositories.Interfaces.Base;
using DentZone.Infrastructure.Repositories.Implementations.Base;
using Microsoft.Extensions.DependencyInjection;

namespace DentZone.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped(typeof(IGenericRepository<,>), typeof(GenericRepository<,>));

            return services;
        }
    }
}
