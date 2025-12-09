using System.Linq;
using System.Threading.Tasks;
using System;
using ConstructionApp.Api.Data;
using ConstructionApp.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstructionApp.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("api/admin/technicians")]
    public class AdminTechnicianController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminTechnicianController(AppDbContext context)
        {
            _context = context;
        }

        // -------------------------------------------------------------
        // OPTIONAL: list pending technicians (if you want a separate list)
        // GET: api/admin/technicians/pending
        // -------------------------------------------------------------
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingTechnicians()
        {
            var list = await _context.Technicians
                .Include(t => t.User)
                .Where(t => t.VerificationStatus == "Pending")
                .Select(t => new TechnicianVerificationDto
                {
                    TechnicianID = t.TechnicianID,
                    UserID = t.UserID,
                    FullName = t.User.FullName,
                    Email = t.User.Email,
                    Phone = t.User.Phone ?? "",
                    VerificationStatus = t.VerificationStatus,
                    ExperienceYears = t.ExperienceYears,
                    IDProof = t.IDProof,
                    Certificate = t.Certificate,
                    VerifiedAt = t.VerifiedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = list });
        }

        // -------------------------------------------------------------
        // DETAIL for one technician
        // GET: api/admin/technicians/{id}
        // -------------------------------------------------------------
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTechnician(int id)
        {
            var tech = await _context.Technicians
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TechnicianID == id);

            if (tech == null)
                return NotFound(new { success = false, message = "Technician not found" });

            var addr = await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserID == tech.UserID);

            var dto = new TechnicianVerificationDto
            {
                TechnicianID = tech.TechnicianID,
                UserID = tech.UserID,
                FullName = tech.User.FullName,
                Email = tech.User.Email,
                Phone = tech.User.Phone ?? "",
                VerificationStatus = tech.VerificationStatus,
                ExperienceYears = tech.ExperienceYears,
                IDProof = tech.IDProof,         // 🔥 docs from DB
                Certificate = tech.Certificate, // 🔥 docs from DB
                Street = addr?.Street,
                City = addr?.City,
                State = addr?.State,
                PostalCode = addr?.PostalCode,
                Country = addr?.Country,
                VerifiedAt = tech.VerifiedAt
            };

            return Ok(new { success = true, data = dto });
        }

        // -------------------------------------------------------------
        // APPROVE / REJECT technician
        // PUT: api/admin/technicians/{id}/verify
        // -------------------------------------------------------------
        [HttpPut("{id:int}/verify")]
        public async Task<IActionResult> VerifyTechnician(
            int id,
            [FromBody] UpdateTechnicianVerificationRequest dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
                return BadRequest(new { success = false, message = "Status is required" });

            var allowed = new[] { "Approved", "Rejected", "Pending" };
            if (!allowed.Contains(dto.Status))
                return BadRequest(new { success = false, message = "Invalid status value" });

            var tech = await _context.Technicians
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TechnicianID == id);

            if (tech == null)
                return NotFound(new { success = false, message = "Technician not found" });

            // ✅ NEW: require docs before Approve
            if (dto.Status == "Approved" &&
                (string.IsNullOrEmpty(tech.IDProof) || string.IsNullOrEmpty(tech.Certificate)))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Cannot approve: technician has not uploaded both ID proof and certificate."
                });
            }

            tech.VerificationStatus = dto.Status;
            tech.VerifiedAt = dto.Status == "Approved" ? DateTime.UtcNow : null;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Technician {dto.Status}",
                data = new
                {
                    tech.TechnicianID,
                    tech.UserID,
                    tech.VerificationStatus,
                    tech.VerifiedAt
                }
            });
        }

    }
}