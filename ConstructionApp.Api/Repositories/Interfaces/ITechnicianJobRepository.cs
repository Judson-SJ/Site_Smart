// Repositories/ITechnicianJobRepository.cs
using ConstructionApp.Api.Models;

namespace ConstructionApp.Api.Repositories
{
    public interface ITechnicianJobRepository
    {
        Task<IEnumerable<Booking>> GetAvailableJobsAsync(int technicianId);
        Task<IEnumerable<Booking>> GetMyJobsAsync(int technicianId);
        Task<Booking?> GetBookingByIdAsync(int bookingId);
        Task<bool> AcceptJobAsync(int bookingId, int technicianId);
        Task<bool> UpdateJobStatusAsync(int bookingId, int technicianId, string status);
    }
}