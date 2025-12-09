// Controllers/TechnicianJobsController.cs → FINAL 100% WORKING + NO 403 ERROR!
using System.Security.Claims;
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
            // முதல்ல UserID எடு (எல்லா user-க்கும் இருக்கும்)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value 
                        ?? User.FindFirst("UserID")?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return 0;

            // Technician table-ல UserID இருந்தா TechnicianID return பண்ணு
            var technician = _db.Technicians
                .AsNoTracking()
                .FirstOrDefault(t => t.UserID == userId);

            return technician?.TechnicianID ?? 0;
        }

        private async Task<bool> IsVerifiedAsync(int techId)
        {
            if (techId <= 0) return false;

            var technician = await _db.Technicians
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TechnicianID == techId);

            var status = technician?.VerificationStatus?.Trim();
            return status == "Approved" || status == "Verified";
        }

        // GET: api/technician/jobs
        [HttpGet]
        public async Task<IActionResult> GetJobs()
        {
            var techId = GetTechnicianId();
            if (techId <= 0) 
                return Unauthorized(new { success = false, message = "Invalid token" });

            var jobs = await _db.Bookings
                .Where(b => 
                    (b.Status == "Pending" && b.TechnicianID == null) ||
                    (b.TechnicianID == techId && (b.Status == "Accepted" || b.Status == "In-Progress"))
                )
                .Include(b => b.Service)
                .Include(b => b.User)
                .Include(b => b.Address)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.BookingID,
                    title = b.Service.ServiceName,
                    address = $"{b.Address.Street}, {b.Address.City}",
                    rate = b.TotalAmount,
                    description = b.Description ?? "No description",
                    status = b.TechnicianID == null ? "new" : "accepted",
                    customerName = b.User.FullName,
                    createdAt = b.BookingDate.ToString("yyyy-MM-dd")
                })
                .ToListAsync();

            return Ok(new { success = true, data = jobs });
        }

        // POST: api/technician/jobs/1/accept → 100% WORKING!
        [HttpPost("{bookingId}/accept")]
        public async Task<IActionResult> AcceptJob(int bookingId)
        {
            var techId = GetTechnicianId();
            if (techId <= 0)
                return Unauthorized(new { success = false, message = "Invalid technician token" });

            // இப்போ Forbid() இல்லை → StatusCode(403) use பண்ணியிருக்கு!
            if (!await IsVerifiedAsync(techId))
                return StatusCode(403, new { 
                    success = false, 
                    message = "Your account must be verified by admin to accept jobs." 
                });

            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => 
                    b.BookingID == bookingId && 
                    b.Status == "Pending" && 
                    b.TechnicianID == null);

            if (booking == null)
                return BadRequest(new { success = false, message = "Job not available or already taken" });

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
            if (techId <= 0)
                return Unauthorized(new { success = false, message = "Invalid token" });

            if (!await IsVerifiedAsync(techId))
                return StatusCode(403, new { 
                    success = false, 
                    message = "Your account must be verified by admin to update job status" 
                });

            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.BookingID == bookingId && b.TechnicianID == techId);

            if (booking == null)
                return NotFound(new { success = false, message = "Job not found" });

            var valid = new[] { "inprogress", "completed" };
            if (!valid.Contains(request.Status.ToLower()))
                return BadRequest(new { success = false, message = "Invalid status" });

            booking.Status = request.Status.ToLower() == "inprogress" ? "In-Progress" : "Completed";
            if (request.Status.ToLower() == "completed")
                booking.WorkCompletionDateTime = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = $"Status updated to {booking.Status}" });
        }
    }

    public class UpdateJobStatusRequest
    {
        public string? Status { get; set; }
    }
}