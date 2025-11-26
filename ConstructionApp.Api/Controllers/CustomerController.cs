// Controllers/CustomerController.cs → FINAL FIXED VERSION
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Data;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Helpers;

// FIX: Force using DTO ApiResponse (avoids CS0104)


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
            var userId = User.GetUserId();
            var fullName = User.GetFullName();
            var email = User.GetEmail();

            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Welcome back to ConstructPro!",
                Data = new
                {
                    fullName,
                    userId,
                    email,
                    role = "Customer",
                    time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                }
            });
        }

        // GET: api/customer/profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.GetUserId();

            var user = await _context.Users
                .Where(u => u.UserID == userId)
                .Select(u => new CustomerProfileResponseDto
                {
                    UserID = u.UserID,
                    FullName = u.FullName,
                    Email = u.Email,
                    Phone = u.Phone
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new ApiResponseDto
                {
                    Success = false,
                    Message = "User not found"
                });

            return Ok(new ApiResponseDto
            {
                Success = true,
                Data = user
            });
        }

        // PUT: api/customer/profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiResponseDto
                {
                    Success = false,
                    Message = "Invalid data"
                });

            var userId = User.GetUserId();
            var user = await _context.Users.FindAsync(userId);
            

            if (user == null)
                return NotFound(new ApiResponseDto
                {
                    Success = false,
                    Message = "User not found"
                });

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto
            {
                Success = true,
                Message = "Profile updated successfully!"
            });
        }

        // GET: api/customer/my-bookings
        [HttpGet("my-bookings")]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = User.GetUserId();

            // Current Active Booking
            var currentBooking = await _context.Bookings
                .Where(b => b.UserID == userId &&
                           b.Status != "Completed" &&
                           b.Status != "Cancelled")
                .Include(b => b.Service)
                .Include(b => b.Technician)
                    .ThenInclude(t => t!.User)
                .OrderByDescending(b => b.BookingDate)
                .FirstOrDefaultAsync();

            // Booking History
            var bookingHistory = await _context.Bookings
                .Where(b => b.UserID == userId &&
                           (b.Status == "Completed" || b.Status == "Cancelled"))
                .Include(b => b.Service)
                .Include(b => b.Technician)
                    .ThenInclude(t => t!.User)
                .OrderByDescending(b => b.WorkCompletionDateTime ?? b.BookingDate)
                .Take(20)
                .Select(b => new
                {
                    b.BookingID,
                    ServiceName = b.Service.ServiceName ?? b.ServiceName,
                    Date = b.PreferredStartDateTime.ToString("MMM dd, yyyy"),
                    Time = b.PreferredEndDateTime,
                    TechnicianName = b.Technician != null ? b.Technician.User.FullName : "Not Assigned",
                    Price = b.TotalAmount,
                    b.Status
                })
                .ToListAsync();

            var currentResponse = currentBooking != null ? new
            {
                currentBooking.BookingID,
                ServiceName = currentBooking.Service?.ServiceName ?? currentBooking.ServiceName,
                currentBooking.TotalAmount,
                currentBooking.PreferredStartDateTime,
                currentBooking.PreferredEndDateTime,
                currentBooking.Status,
                TechnicianName = currentBooking.Technician?.User.FullName ?? "Pending Assignment",
                TechnicianPhoto = currentBooking.Technician?.ProfileImage ?? "/assets/default-tech.jpg",
                ProgressStep = GetProgressStep(currentBooking.Status)
            } : null;

            return Ok(new ApiResponseDto
            {
                Success = true,
                Data = new
                {
                    currentBooking = currentResponse,
                    bookingHistory
                }
            });
        }

        private int GetProgressStep(string status) => status switch
        {
            "Requested" or "Pending" => 1,
            "Confirmed" or "Accepted" => 2,
            "In-Progress" => 3,
            "Completed" => 4,
            "Cancelled" => 0,
            _ => 1
        };
    }
}
