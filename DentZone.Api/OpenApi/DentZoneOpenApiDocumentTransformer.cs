using System.Text.Json.Nodes;
using DentZone.Application.Localization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace DentZone_Api.OpenApi
{
    /// <summary>
    /// Customizes the generated OpenAPI document: API metadata and response examples.
    /// </summary>
    public sealed class DentZoneOpenApiDocumentTransformer : IOpenApiDocumentTransformer
    {
        private readonly ILocalizationProvider _localizationProvider;

        public DentZoneOpenApiDocumentTransformer(ILocalizationProvider localizationProvider)
        {
            _localizationProvider = localizationProvider;
        }

        public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
        {
            document.Info.Title = _localizationProvider.GetLocalizedString(LocalizationKeys.OpenApi.Title);
            document.Info.Version = context.DocumentName;
            document.Info.Description = _localizationProvider.GetLocalizedString(LocalizationKeys.OpenApi.Description);
            document.Info.Contact = new OpenApiContact
            {
                Name = _localizationProvider.GetLocalizedString(LocalizationKeys.OpenApi.ContactName),
                Email = "support@dentzone.com"
            };
            document.Info.License = new OpenApiLicense
            {
                Name = _localizationProvider.GetLocalizedString(LocalizationKeys.OpenApi.LicenseName),
                Url = new Uri("https://opensource.org/licenses/MIT")
            };

            ApplyResponseExamples(document);

            return Task.CompletedTask;
        }

        private static void ApplyResponseExamples(OpenApiDocument document)
        {
            if (document.Paths is null)
            {
                return;
            }

            foreach (var pathItem in document.Paths.Values)
            {
                if (pathItem.Operations is null)
                {
                    continue;
                }

                foreach (var operation in pathItem.Operations.Values)
                {
                    if (operation.Responses is null)
                    {
                        continue;
                    }

                    foreach (var response in operation.Responses.Values)
                    {
                        if (response.Content is null)
                        {
                            continue;
                        }

                        foreach (var mediaType in response.Content.Values)
                        {
                            // Examples are assigned on the concrete OpenApiMediaType
                            // (the read-only IOpenApiMediaType abstraction only exists
                            // in the Microsoft.OpenApi 3.x model).
                            if (mediaType.Example is not null)
                            {
                                continue;
                            }

                            if (mediaType.Schema is null || mediaType.Schema.Example is null)
                            {
                                mediaType.Example = new JsonObject();
                            }
                        }
                    }
                }
            }
        }
    }
}