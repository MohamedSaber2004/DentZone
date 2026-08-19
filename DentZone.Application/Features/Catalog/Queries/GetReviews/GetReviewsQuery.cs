using DentZone.Application.Features.Catalog.DTOs;
using MediatR;

namespace DentZone.Application.Features.Catalog.Queries.GetReviews
{
    public class GetReviewsQuery : IRequest<List<ReviewDto>>
    {
        public Guid ProductId { get; set; }
    }
}
