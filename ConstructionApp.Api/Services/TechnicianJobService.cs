// Services/TechnicianJobService.cs → SINGLE FILE BEAST MODE — FULLY WORKING!
using ConstructionApp.Api.Data;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ConstructionApp.Api.Services
{
    
    // MAIN SERVICE — Repository + Service + Logic எல்லாம் இதுல!
    public class TechnicianJobService
    {
        private readonly AppDbContext _db;

        public TechnicianJobService(AppDbContext db)
        {
            _db = db;
        }

        // Get all available + accepted jobs
        public async Task<List<TechnicianJobDto>> GetAvailableJobsAsync(int technicianId)
        {
            var jobs = await _db.Bookings
                .Where(b =>
                    (b.Status == "Pending" && b.TechnicianID == null) ||
                    (b.TechnicianID == technicianId && (b.Status == "Accepted" || b.Status == "In-Progress"))
                )
                .Include(b => b.Service)
                .Include(b => b.User)
                .Include(b => b.Address)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new TechnicianJobDto
                {
                    BookingID = b.BookingID,
                    Title = b.Service.ServiceName,
                    Address = $"{b.Address.Street}, {b.Address.City}, {b.Address.PostalCode}",
                    Rate = b.TotalAmount,
                    Description = b.Description ?? "No description",
                    Status = b.TechnicianID == null ? "new" : "accepted",
                    CustomerName = b.User.FullName,
                    CustomerPhone = b.User.Phone ?? "N/A",
                    CreatedAt = b.BookingDate.ToString("yyyy-MM-dd"),
                    PreferredDate = b.PreferredStartDateTime.ToString("MMM dd, yyyy 'at' hh:mm tt")
                })
                .ToListAsync();

            return jobs;
        }

        // Get only my jobs
        public async Task<List<TechnicianJobDto>> GetMyJobsAsync(int technicianId)
        {
            var jobs = await _db.Bookings
                .Where(b => b.TechnicianID == technicianId)
                .Include(b => b.Service)
                .Include(b => b.User)
                .Select(b => new TechnicianJobDto
                {
                    BookingID = b.BookingID,
                    Title = b.Service.ServiceName,
                    Rate = b.TotalAmount,
                    Status = b.Status == "Accepted" ? "accepted" : 
                             b.Status == "In-Progress" ? "inprogress" : "completed",
                    CustomerName = b.User.FullName,
                    CreatedAt = b.BookingDate.ToString("yyyy-MM-dd")
                })
                .ToListAsync();

            return jobs;
        }

        // Accept a new job
        public async Task<bool> AcceptJobAsync(int bookingId, int technicianId)
        {
            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && 
                                        b.Status == "Pending" && 
                                        b.TechnicianID == null);

            if (booking == null) return false;

            booking.TechnicianID = technicianId;
            booking.Status = "Accepted";
            await _db.SaveChangesAsync();
            return true;
        }

        // Update job status
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

        // Check if technician is verified
        public async Task<bool> IsTechnicianVerifiedAsync(int technicianId)
        {
            var tech = await _db.Technicians
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TechnicianID == technicianId);

            return tech?.VerificationStatus == "Verified";
        }
    }
}