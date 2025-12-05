// Controllers/CustomerController.cs → FINAL BOMB VERSION — 100% WORKING!
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Data;
using ConstructionApp.Api.DTOs;

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

        // GET: api/customer/profile → இப்போ DATABASE-ல இருந்து REAL DATA வரும்!
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirst("UserID")?.Value 
                                 ?? User.FindFirst("sub")?.Value 
                                 ?? User.FindFirst("nameid")?.Value 
                                 ?? "0");

            var user = await _context.Users
                .Where(u => u.UserID == userId)
                .Select(u => new
                {
                    u.UserID,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.ProfileImage
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new ApiResponseDto { Success = false, Message = "User not found" });

            return Ok(new ApiResponseDto
            {
                Success = true,
                Data = new
                {
                    userID = user.UserID,
                    fullName = user.FullName ?? "Customer",
                    email = user.Email ?? "",
                    phone = user.Phone ?? "",
                    profileImage = user.ProfileImage ?? ""
                }
            });
        }

        // PUT: api/customer/profile → Full Name + Phone + Photo Update
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateCustomerProfileRequest dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiResponseDto { Success = false, Message = "Invalid data" });

            var userId = int.Parse(User.FindFirst("UserID")?.Value 
                         ?? User.FindFirst("sub")?.Value 
                         ?? User.FindFirst("nameid")?.Value 
                         ?? "0");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new ApiResponseDto { Success = false, Message = "User not found" });

            if (!string.IsNullOrWhiteSpace(dto.FullName))
                user.FullName = dto.FullName.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Phone))
                user.Phone = dto.Phone.Trim();

            if (!string.IsNullOrWhiteSpace(dto.ProfileImage))
                user.ProfileImage = dto.ProfileImage.Trim();

            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Profile updated successfully!"
            });
        }

        // PATCH: api/customer/profile/image → Only Photo Update
        [HttpPatch("profile/image")]
        public async Task<IActionResult> UpdateProfileImage([FromBody] UpdateProfileImageDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ProfileImage))
                return BadRequest(new ApiResponseDto { Success = false, Message = "Image URL required" });

            var userId = int.Parse(User.FindFirst("UserID")?.Value 
                                 ?? User.FindFirst("sub")?.Value 
                                 ?? "0");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound();

            user.ProfileImage = dto.ProfileImage.Trim();
            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Photo updated!",
                Data = new { url = user.ProfileImage }
            });
        }

       // POST: api/customer/upload-avatar → 100% WORKING FIX!
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)  // ← இங்க 'file' ஆ இருக்கணும்!
        {
            if (file == null || file.Length == 0)
                return BadRequest(new ApiResponseDto { Success = false, Message = "No file uploaded" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new ApiResponseDto { Success = false, Message = "Max 5MB allowed" });

            var allowed = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
            if (!allowed.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest(new ApiResponseDto { Success = false, Message = "Only JPG/PNG/WebP allowed" });

            var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(folder, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/avatars/{fileName}";

            var userId = int.Parse(User.FindFirst("UserID")?.Value ?? "0");
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.ProfileImage = imageUrl;
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Photo uploaded successfully!",
                Data = new { url = imageUrl }
            });
        }

        // GET: api/customer/my-bookings → 100% FIXED — ALL BOOKINGS VARUM!
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = int.Parse(User.FindFirst("UserID")?.Value ?? "0");

            // CURRENT BOOKING — Pending, Requested, Accepted, In-Progress
            var currentBooking = await _context.Bookings
                .Where(b => b.UserID == userId && 
                        b.Status != "Completed" && 
                        b.Status != "Cancelled")
                .Include(b => b.Service)
                .Include(b => b.Technician!.User)
                .OrderByDescending(b => b.BookingDate)
                .Select(b => new
                {
                    b.BookingID,
                    ServiceName = b.Service != null ? b.Service.ServiceName : "Unknown Service",
                    b.TotalAmount,
                    b.PreferredStartDateTime,
                    b.PreferredEndDateTime,
                    b.Status,
                    TechnicianName = b.Technician != null ? b.Technician.User.FullName : "Pending Assignment",
                    TechnicianPhoto = b.Technician != null ? b.Technician.User.ProfileImage : (string?)null,
                    Progress = b.Status == "Requested" || b.Status == "Pending" ? 20 :
                            b.Status == "Confirmed" || b.Status == "Accepted" ? 50 :
                            b.Status == "In-Progress" ? 75 :
                            b.Status == "Completed" ? 100 : 10
                })
                .FirstOrDefaultAsync();

            // HISTORY — எல்லா previous bookings-ம் வரும் (Completed, Cancelled, மற்றும் old Pending கூட!)
            var history = await _context.Bookings
                .Where(b => b.UserID == userId)
                .Include(b => b.Service)
                .Include(b => b.Technician!.User)
                .OrderByDescending(b => b.WorkCompletionDateTime ?? b.BookingDate)
                .Take(20)
                .Select(b => new
                {
                    b.BookingID,
                    ServiceName = b.Service != null ? b.Service.ServiceName : "Unknown Service",
                    Date = b.PreferredStartDateTime.ToString("MMM dd, yyyy"),
                    TechnicianName = b.Technician != null ? b.Technician.User.FullName : "Not Assigned",
                    b.TotalAmount,
                    b.Status,
                    TechnicianPhoto = b.Technician != null ? b.Technician.User.ProfileImage : (string?)null
                })
                .ToListAsync();

            // Current booking-ஐ history-ல இருந்து remove பண்ணு (duplicate வராம)
            if (currentBooking != null)
            {
                history = history.Where(h => h.BookingID != currentBooking.BookingID).ToList();
            }

            return Ok(new ApiResponseDto
            {
                Success = true,
                Data = new { currentBooking, bookingHistory = history }
            });
        }
    }
}    