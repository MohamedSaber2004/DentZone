using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace DentZone.Application.Common.Behaviours
{
    public class PerformanceBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
where TRequest : IRequest<TResponse>
    {
        private readonly ILogger<TRequest> _logger;

        public PerformanceBehaviour(ILogger<TRequest> logger)
        {
            _logger = logger;
        }

        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            var stopwatch = Stopwatch.StartNew();

            var response = await next();

            stopwatch.Stop();

            var elapsedMilliseconds = stopwatch.ElapsedMilliseconds;

            if (elapsedMilliseconds > 600)
            {
                var requestName = typeof(TRequest).Name;
                var userName = string.Empty;

                _logger.LogWarning("DentZone Long Running Request: {Name} ({ElapsedMilliseconds} milliseconds) {@Request}",
                    requestName, elapsedMilliseconds, request);
            }

            return response;
        }
    }
}
