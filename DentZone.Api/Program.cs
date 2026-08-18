using Asp.Versioning;
using Asp.Versioning.ApiExplorer;
using DentZone.Application;
using DentZone.Application.Common.Models;
using DentZone.Application.Common.Options;
using DentZone.Application.Localization;
using DentZone.Infrastructure;
using DentZone.Persistence;
using DentZone.Persistence.Seeding;
using DentZone_Api.OpenApi;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Scalar.AspNetCore;
using Serilog;
using System.Globalization;
using System.Reflection;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

namespace DentZone_Api
{
    public class Program
    {
        private const string LanguageSwitcherSnippet = """
            <script>
            (function () {
                var KEY = 'dz-language';
                var lang = localStorage.getItem(KEY) || 'ar';
                var origFetch = window.fetch;
                window.fetch = function (input, init) {
                    try {
                        var req = new Request(input, init);
                        var headers = new Headers(req.headers);
                        headers.set('Accept-Language', lang);
                        return origFetch(new Request(req, { headers: headers }), init);
                    } catch (e) {
                        return origFetch(input, init);
                    }
                };
                window.__dzToggleLanguage = function () {
                    lang = lang === 'ar' ? 'en' : 'ar';
                    localStorage.setItem(KEY, lang);
                    window.location.reload();
                };
                window.addEventListener('DOMContentLoaded', function () {
                    var b = document.createElement('button');
                    b.textContent = lang === 'ar' ? 'English' : 'العربية';
                    b.onclick = window.__dzToggleLanguage;
                    b.style.cssText = 'position:fixed;top:64px;right:20px;z-index:99999;padding:7px 16px;border:1px solid rgba(0,0,0,.2);border-radius:8px;background:#fff;color:#0f172a;cursor:pointer;font:600 13px/1.2 Inter,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.14);margin:0';
                    document.body.appendChild(b);
                });
            })();
            </script>
            """;

        public static async Task Main(string[] args)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

            var builder = WebApplication.CreateBuilder(args);

            var env = builder.Environment;

            builder.Configuration.Sources.Clear();
            builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true, reloadOnChange: true);

            if (env.IsDevelopment() || env.EnvironmentName == "Preview")
            {
                var appAssembly = Assembly.Load(new AssemblyName(env.ApplicationName));
                if (appAssembly != null) builder.Configuration.AddUserSecrets(appAssembly, optional: true);
            }

            builder.Configuration.AddEnvironmentVariables().AddCommandLine(args);

            builder.WebHost.ConfigureKestrel(options =>
            {
                options.AddServerHeader = false;
                options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
                options.Limits.MaxRequestHeaderCount = 20;
                options.Limits.MaxRequestLineSize = 8 * 1024;
                options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(30);
                options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
            });

            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(builder.Configuration)
                .CreateBootstrapLogger();

            Log.Information("DentZone API is starting up at {Time}", DateTime.Now);

            builder.Host.UseSerilog();


            // Add services to the container.

            builder.Services.AddApplicationServices()
                            .AddInfrastructureServices(builder.Configuration)
                            .AddPersistenceServices();

            builder.Services.AddAuthorization();

            builder.Services.AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(1, 0);
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ReportApiVersions = true;
                options.ApiVersionReader = new UrlSegmentApiVersionReader();
            }).AddMvc().AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'VVV";
                options.SubstituteApiVersionInUrl = true;
            });

            builder.Services.AddRequestLocalization(options =>
            {
                var supportedCultures = new[] { new CultureInfo("en"), new CultureInfo("ar") };
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedCultures;
                options.DefaultRequestCulture = new Microsoft.AspNetCore.Localization.RequestCulture("ar");
                options.FallBackToParentCultures = true;
                options.FallBackToParentUICultures = true;
            });

            builder.Services.Configure<MvcOptions>(options =>
            {
                options.Filters.Add<DentZone_Api.Filters.ApiExceptionFilterAttribute>();
            });

            builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
            {
                options.SerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Create(System.Text.Unicode.UnicodeRanges.All);
                options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

            builder.Services.Configure<Microsoft.AspNetCore.Mvc.JsonOptions>(options =>
            {
                options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Create(System.Text.Unicode.UnicodeRanges.All);
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

            builder.Services.AddOpenApi("v1", options =>
            {
                options.AddDocumentTransformer<DentZoneOpenApiDocumentTransformer>();
                options.AddOperationTransformer<LanguageHeaderOperationTransformer>();
            });

            builder.Services.AddOpenApi("v2", options =>
            {
                options.AddDocumentTransformer<DentZoneOpenApiDocumentTransformer>();
                options.AddOperationTransformer<LanguageHeaderOperationTransformer>();
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowedOrigins", policy =>
                {
                    policy.SetIsOriginAllowed(_ => true)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            builder.Services.AddRateLimiter(options =>
            {
                var rateLimiting = builder.Configuration.GetSection("RateLimiting").Get<RateLimitingOptions>();

                if (rateLimiting == null)
                {
                    throw new InvalidOperationException("RateLimiting configuration section is missing. Add 'RateLimiting' to appsettings.");
                }

                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.OnRejected = async (context, cancellationToken) =>
                {
                    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    {
                        context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                    }

                    context.HttpContext.Response.Headers["X-RateLimit-Limit"] = rateLimiting.PermitLimit.ToString();
                    context.HttpContext.Response.Headers["X-RateLimit-Window"] = rateLimiting.Window.TotalSeconds.ToString();

                    var localizationProvider = context.HttpContext.RequestServices.GetRequiredService<ILocalizationProvider>();
                    var message = localizationProvider.GetLocalizedString(LocalizationKeys.Auth.TooManyAttempts);

                    context.HttpContext.Response.ContentType = "application/json";
                    var payload = System.Text.Json.JsonSerializer.Serialize(
                        ApiResponse<object>.Error(message, StatusCodes.Status429TooManyRequests));

                    await context.HttpContext.Response.WriteAsync(payload, cancellationToken);

                    Log.Warning("Request rejected by rate limiter. Client: {ClientIp}", context.HttpContext.Connection.RemoteIpAddress);
                };

                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(partitionKey =>
                {
                    var clientIp = partitionKey.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                    return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = rateLimiting.PermitLimit,
                        Window = rateLimiting.Window,
                        QueueLimit = rateLimiting.QueueLimit,
                        AutoReplenishment = true
                    });
                });

                options.AddPolicy("General", context =>
                {
                    var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                    return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = rateLimiting.PermitLimit,
                        Window = rateLimiting.Window,
                        QueueLimit = rateLimiting.QueueLimit,
                        AutoReplenishment = true
                    });
                });

                options.AddPolicy("Login", context =>
                {
                    var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    var email = context.Request.Headers["X-Attempt-Email"].ToString()
                        ?? context.Request.Query["email"].ToString();
                    var partitionKey = string.IsNullOrWhiteSpace(email) ? clientIp : $"{clientIp}:{email.Trim().ToLowerInvariant()}";

                    return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 3,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    });
                });

                options.AddPolicy("Otp", context =>
                {
                    var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    var email = context.Request.Headers["X-Attempt-Email"].ToString()
                        ?? context.Request.Query["email"].ToString();
                    var partitionKey = string.IsNullOrWhiteSpace(email) ? clientIp : $"{clientIp}:{email.Trim().ToLowerInvariant()}";

                    return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    });
                });
            });

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<DentZoneContext>();
                var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DentZoneDbSeeder");
                try
                {
                    await AppDbSeeder.SeedAsync(dbContext, logger);
                    await AppDbSeeder.SeedStoreAsync(dbContext, logger);
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "Failed to seed the database on startup. Skipping seeding.");
                }
            }

            // Configure the HTTP request pipeline.

            app.UseSecurityHeaders(policies =>
                policies
                    .AddDefaultSecurityHeaders()
                    .RemoveServerHeader());

            app.UseHsts();

            app.UseRateLimiter();

            app.MapOpenApi("/openapi/{documentName}.json");

            app.DescribeApiVersions();

            var apiVersionProvider = app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

            if (apiVersionProvider.ApiVersionDescriptions.Count > 0)
            {
                foreach (var description in apiVersionProvider.ApiVersionDescriptions)
                {
                    var name = description.GroupName;

                    app.MapScalarApiReference($"/scalar/{name}", options =>
                    {
                        options.WithTitle($"DentZone API {name}")
                               .WithTheme(ScalarTheme.BluePlanet)
                               .WithOpenApiRoutePattern($"/openapi/{name}.json")
                               .AddHeadContent(LanguageSwitcherSnippet);
                    });
                }
            }

            app.MapGet("/", (IApiVersionDescriptionProvider provider) =>
            {
                var lastVersion = provider.ApiVersionDescriptions.Last().GroupName;
                return Results.Redirect($"/scalar/{lastVersion}");
            }).ExcludeFromDescription();

            if(app.Environment.IsDevelopment())  
                app.UseHttpsRedirection();

            app.UseRouting();

            app.UseRequestLocalization();

            app.UseCors("AllowedOrigins");

            app.UseAuthentication();

            app.UseAuthorization();

            app.UseStaticFiles();

            app.MapControllers();

            app.Run();
        }
    }
}
