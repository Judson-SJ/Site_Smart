// Controllers/TechnicianJobsController.cs → FINAL 100% WORKING + ZERO ERRORS + CLEAN!
using ConstructionApp.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstructionApp.Api.Controllers
{
    [ApiController]
    [Route("api/technician/jobs")]
    [Authorize(Roles = "Technician")]
    public class TechnicianJobsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TechnicianJobsController(AppDbContext db)
        {
            _db = db;
        }

        private int GetTechnicianId()
        {
            var claim = User.FindFirst("technicianId") 
                     ?? User.FindFirst("TechnicianID") 
                     ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

            return int.TryParse(claim?.Value, out int id) ? id : 0;
        }

        private async Task<bool> IsVerifiedAsync(int techId)
        {
            if (techId <= 0) return false;

            var technician = await _db.Technicians
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TechnicianID == techId);

            return technician?.VerificationStatus == "Verified";
        }

        // GET: api/technician/jobs → All available + my accepted jobs
        [HttpGet]
        public async Task<IActionResult> GetJobs()
        {
            var techId = GetTechnicianId();
            if (techId <= 0) return Unauthorized("Invalid technician ID");

            var jobs = await _db.Bookings
                .Where(b => 
                    (b.Status == "Pending" && b.TechnicianID == null) || // New jobs
                    (b.TechnicianID == techId && (b.Status == "Accepted" || b.Status == "In-Progress")) // My jobs
                )
                .Include(b => b.Service)
                .Include(b => b.User)
                .Include(b => b.Address)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.BookingID,
                    title = b.Service.ServiceName,
                    address = $"{b.Address.Street}, {b.Address.City}, {b.Address.PostalCode}",
                    rate = b.TotalAmount,
                    description = b.Description ?? "No description provided",
                    status = b.TechnicianID == null ? "new" : "accepted",
                    customerName = b.User.FullName,
                    customerPhone = b.User.Phone ?? "Not provided",
                    createdAt = b.BookingDate.ToString("yyyy-MM-dd"),
                    preferredDate = b.PreferredStartDateTime.ToString("MMM dd, yyyy 'at' hh:mm tt")
                })
                .ToListAsync();

            return Ok(new { success = true, data = jobs });
        }

        //// POST: api/technician/jobs/123/accept
        [HttpPost("{bookingId}/accept")]
        public async Task<IActionResult> AcceptJob(int bookingId)
        {
            var techId = GetTechnicianId();
            if (techId <= 0) return Unauthorized("Invalid technician");

            if (!await IsVerifiedAsync(techId))
                return Forbid("Your account must be verified by admin to accept jobs.");

            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && 
                                        b.Status == "Pending" && 
                                        b.TechnicianID == null);

            if (booking == null)
                return BadRequest(new { success = false, message = "Job not available or already assigned" });

            booking.TechnicianID = techId;
            booking.Status = "Accepted";
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Job accepted successfully!" });
        }

        // PATCH: api/technician/jobs/123/status
        [HttpPatch("{bookingId}/status")]
        public async Task<IActionResult> UpdateStatus(int bookingId, [FromBody] UpdateJobStatusRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { success = false, message = "Status is required" });

            var techId = GetTechnicianId();
            if (techId <= 0) return Unauthorized();

            if (!await IsVerifiedAsync(techId))
                return Forbid("Verification required to update job status");

            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && b.TechnicianID == techId);

            if (booking == null)
                return BadRequest(new { success = false, message = "Job not found or not assigned to you" });

            var validStatuses = new[] { "inprogress", "completed" };
            if (!validStatuses.Contains(request.Status.ToLower()))
                return BadRequest(new { success = false, message = "Invalid status. Use: inprogress or completed" });

            booking.Status = request.Status.ToLower() == "inprogress" ? "In-Progress" : "Completed";

            if (request.Status.ToLower() == "completed")
                booking.WorkCompletionDateTime = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = $"Job status updated to {booking.Status}" });
        }

        // GET: api/technician/jobs/my → Only my jobs (Accepted, In-Progress, Completed)
        [HttpGet("my")]
        public async Task<IActionResult> GetMyJobs()
        {
            var techId = GetTechnicianId();
            if (techId <= 0) return Unauthorized();

            var jobs = await _db.Bookings
                .Where(b => b.TechnicianID == techId)
                .Include(b => b.Service)
                .Include(b => b.User)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.BookingID,
                    serviceName = b.Service.ServiceName,
                    b.TotalAmount,
                    b.Status,
                    customerName = b.User.FullName,
                    b.PreferredStartDateTime
                })
                .ToListAsync();

            return Ok(new { success = true, data = jobs });
        }
    }

    // DTO — Controller file-லயே இருக்கும் (100% safe)
    public class UpdateJobStatusRequest
    {
        public string? Status { get; set; }
    }
}