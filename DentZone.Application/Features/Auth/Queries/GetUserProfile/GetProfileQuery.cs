using DentZone.Application.Features.Auth.DTOs;
using MediatR;

namespace DentZone.Application.Features.Auth.Queries.GetUserProfile
{
    public class GetProfileQuery : IRequest<UserProfileDto>
    {
    }
}
