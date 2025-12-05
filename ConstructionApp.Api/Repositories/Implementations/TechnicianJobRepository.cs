// Repositories/TechnicianJobRepository.cs
using ConstructionApp.Api.Data;
using ConstructionApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ConstructionApp.Api.Repositories
{
    public class TechnicianJobRepository : ITechnicianJobRepository
    {
        private readonly AppDbContext _db;

        public TechnicianJobRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Booking>> GetAvailableJobsAsync(int technicianId)
        {
            return await _db.Bookings
                .Where(b =>
                    (b.Status == "Pending" && b.TechnicianID == null) ||
                    (b.TechnicianID == technicianId && (b.Status == "Accepted" || b.Status == "In-Progress"))
                )
                .Include(b => b.Service)
                .Include(b => b.User)
                .Include(b => b.Address)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetMyJobsAsync(int technicianId)
        {
            return await _db.Bookings
                .Where(b => b.TechnicianID == technicianId)
                .Include(b => b.Service)
                .Include(b => b.User)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }

        public async Task<Booking?> GetBookingByIdAsync(int bookingId)
        {
            return await _db.Bookings
                .Include(b => b.Service)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.BookingID == bookingId);
        }

        public async Task<bool> AcceptJobAsync(int bookingId, int technicianId)
        {
            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && b.Status == "Pending" && b.TechnicianID == null);

            if (booking == null) return false;

            booking.TechnicianID = technicianId;
            booking.Status = "Accepted";
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateJobStatusAsync(int bookingId, int technicianId, string status)
        {
            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && b.TechnicianID == technicianId);

            if (booking == null) return false;

            var valid = new[] { "inprogress", "completed" };
            if (!valid.Contains(status.ToLower())) return false;

            booking.Status = status.ToLower() == "inprogress" ? "In-Progress" : "Completed";

            if (status.ToLower() == "completed")
                booking.WorkCompletionDateTime = DateTime.Now;

            await _db.SaveChangesAsync();
            return true;
        }
    }
}