using DentZone.Application.Localization;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace DentZone.Application.Features.Orders.Commands.CreateOrder
{
    public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
    {
        public CreateOrderCommandValidator(IStringLocalizer<Messages> localizer)
        {
            RuleFor(x => x.CustomerName)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Orders.CustomerNameRequired]);

            RuleFor(x => x.CustomerEmail)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Orders.CustomerEmailRequired])
                .EmailAddress().WithMessage(localizer[LocalizationKeys.Auth.EmailInvalid]);

            RuleFor(x => x.ShippingAddress)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Orders.ShippingAddressRequired]);

            RuleFor(x => x.ShippingCity)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Orders.ShippingCityRequired]);

            RuleFor(x => x.Lines)
                .NotEmpty().WithMessage(localizer[LocalizationKeys.Orders.LinesRequired]);

            RuleForEach(x => x.Lines)
                .Must(x => x.Quantity >= 1).WithMessage(localizer[LocalizationKeys.Orders.InvalidQuantity]);
        }
    }
}
