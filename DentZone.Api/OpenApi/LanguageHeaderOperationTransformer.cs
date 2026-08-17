using DentZone.Application.Localization;
using DentZone.Domain.Enums;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using System.Text.Json.Nodes;

namespace DentZone_Api.OpenApi
{
    public class LanguageHeaderOperationTransformer : IOpenApiOperationTransformer
    {
        private readonly ILocalizationProvider _localizationProvider;

        public LanguageHeaderOperationTransformer(ILocalizationProvider localizationProvider)
        {
            _localizationProvider = localizationProvider;
        }

        public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
        {
            operation.Parameters ??= new List<IOpenApiParameter>();

            var supportedLanguages = Enum.GetNames<LanguageCode>()
                .Select(name => (JsonNode?)JsonValue.Create(name))
                .ToList();

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "Accept-Language",
                In = ParameterLocation.Header,
                Required = false,
                Description = _localizationProvider.GetLocalizedString(LocalizationKeys.OpenApi.LanguageParameter),
                Schema = new OpenApiSchema
                {
                    Type = JsonSchemaType.String,
                    Default = JsonValue.Create("ar"),
                    Enum = supportedLanguages
                }
            });

            return Task.CompletedTask;
        }
    }
}