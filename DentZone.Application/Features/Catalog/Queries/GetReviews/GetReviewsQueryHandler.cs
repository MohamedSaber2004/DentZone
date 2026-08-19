using DentZone.Application.Common.Interfaces;
using DentZone.Application.Features.Catalog.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DentZone.Application.Features.Catalog.Queries.GetReviews
{
    public class GetReviewsQueryHandler : IRequestHandler<GetReviewsQuery, List<ReviewDto>>
    {
        private readonly IDentZoneContext _context;

        public GetReviewsQueryHandler(IDentZoneContext context)
        {
            _context = context;
        }

        public async Task<List<ReviewDto>> Handle(GetReviewsQuery request, CancellationToken cancellationToken)
        {
            return await _context.Reviews
                .AsNoTracking()
                .Where(r => r.ProductId == request.ProductId && !r.IsDeleted)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDto
                {
                    Id = r.Id,
                    ProductId = r.ProductId,
                    Author = r.AuthorName,
                    Rating = r.Rating,
                    Content = r.Content,
                    CreatedAt = r.CreatedAt,
                    VerifiedPurchase = r.VerifiedPurchase,
                    HelpfulCount = r.HelpfulCount
                })
                .ToListAsync(cancellationToken);
        }
    }
}
