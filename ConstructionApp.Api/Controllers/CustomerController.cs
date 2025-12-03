// Controllers/CustomerController.cs → FINAL 100% WORKING + ZERO ERRORS
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Data;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Helpers;

namespace ConstructionApp.Api.Controllers
{
    [Route("api/customer")]
    [ApiController]
    [Authorize(Roles = "Customer")]
    public class CustomerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/customer/dashboard
        [HttpGet("dashboard")]
        public IActionResult Dashboard()
        {
            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Welcome back to ConstructPro!",
                Data = new
                {
                    fullName = User.GetFullName() ?? "Customer",
                    userId = User.GetUserId(),
                    email = User.GetEmail() ?? "",
                    phone = User.FindFirst("Phone")?.Value ?? "",
                    profileImage = User.FindFirst("ProfileImage")?.Value ?? "",
                    role = "Customer"
                }
            });
        }

        // GET: api/customer/profile → INSTANT (NO DB HIT!)
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            return Ok(new ApiResponseDto
            {
                Success = true,
                Data = new
                {
                    UserID = User.GetUserId(),
                    FullName = User.GetFullName() ?? "Customer",
                    Email = User.GetEmail() ?? "",
                    Phone = User.FindFirst("Phone")?.Value ?? "",
                    ProfileImage = User.FindFirst("ProfileImage")?.Value ?? ""
                }
            });
        }

        // PUT: api/customer/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiResponseDto { Success = false, Message = "Invalid data" });

            var userId = User.GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new ApiResponseDto { Success = false, Message = "User not found" });

            user.FullName = dto.FullName.Trim();
            user.Phone = dto.Phone?.Trim();

            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Profile updated successfully!"
            });
        }

        // PATCH: api/customer/profile/image → Simple URL update
        [HttpPatch("profile/image")]
        public async Task<IActionResult> UpdateProfileImage([FromBody] UpdateProfileImageDto dto)
        {
            var userId = User.GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new ApiResponseDto { Success = false, Message = "User not found" });

            user.ProfileImage = dto.ProfileImage;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Profile picture updated!"
            });
        }

        // POST: api/customer/upload-avatar → Normal File Upload
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile profileImage)
        {
            if (profileImage == null || profileImage.Length == 0)
                return BadRequest(new ApiResponseDto { Success = false, Message = "No file uploaded" });

            if (profileImage.Length > 5 * 1024 * 1024)
                return BadRequest(new ApiResponseDto { Success = false, Message = "Max 5MB allowed" });

            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(profileImage.ContentType.ToLowerInvariant()))
                return BadRequest(new ApiResponseDto { Success = false, Message = "Only JPG, PNG, WebP allowed" });

            var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}_{profileImage.FileName}";
            var filePath = Path.Combine(folder, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await profileImage.CopyToAsync(stream);

            var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/avatars/{fileName}";

            var userId = User.GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.ProfileImage = imageUrl;
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponseDto
            {
                Success = true,
                Data = new { url = imageUrl }
            });
        }

       // GET: api/customer/my-bookings
// GET: api/customer/my-bookings → 100% WORKING + ZERO ERRORS + EF CORE SAFE
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = User.GetUserId();

            var currentBooking = await _context.Bookings
                .Where(b => b.UserID == userId && b.Status != "Completed" && b.Status != "Cancelled")
                .Include(b => b.Service)
                .Include(b => b.Technician!.User)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.BookingID,
                    ServiceName = b.Service.ServiceName ?? "Unknown Service",
                    b.TotalAmount,
                    b.PreferredStartDateTime,
                    b.PreferredEndDateTime,
                    b.Status,
                    TechnicianName = b.Technician != null ? b.Technician.User.FullName : "Pending Assignment",
                    TechnicianPhoto = b.Technician != null ? b.Technician.User.ProfileImage : null,
                    // FULLY FIXED: EF Core compatible progress calculation
                    Progress = b.Status == "Requested" || b.Status == "Pending" ? 20 :
                            b.Status == "Confirmed" || b.Status == "Accepted" ? 50 :
                            b.Status == "In-Progress" ? 75 :
                            b.Status == "Completed" ? 100 : 10
                })
                .FirstOrDefaultAsync();

            var history = await _context.Bookings
                .Where(b => b.UserID == userId && (b.Status == "Completed" || b.Status == "Cancelled"))
                .Include(b => b.Service)
                .Include(b => b.Technician!.User)
                .OrderByDescending(b => b.WorkCompletionDateTime ?? b.BookingDate)
                .Take(20)
                .Select(b => new
                {
                    b.BookingID,
                    ServiceName = b.Service.ServiceName ?? "Unknown Service",
                    Date = b.PreferredStartDateTime.ToString("MMM dd, yyyy"),
                    TechnicianName = b.Technician != null ? b.Technician.User.FullName : "Not Assigned",
                    b.TotalAmount,
                    b.Status,
                    TechnicianPhoto = b.Technician != null ? b.Technician.User.ProfileImage : null
                })
                .ToListAsync();

            return Ok(new ApiResponseDto
            {
                Success = true,
                Data = new 
                { 
                    currentBooking, 
                    bookingHistory = history 
                }
            });
        }
    }
}