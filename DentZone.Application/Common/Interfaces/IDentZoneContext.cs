namespace DentZone.Application.Common.Interfaces
{
    public interface IDentZoneContext: IAsyncDisposable
    {

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
