
// Controllers/BookingsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Data;
using System.Security.Claims;
using ConstructionApp.Api.Services;
using ConstructionApp.Api.DTOs;

namespace ConstructionApp.Api.Controllers
{
[Authorize]
[Route("api/bookings")]
[ApiController]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookingService;
    private readonly IHttpContextAccessor _httpContext;

    public BookingsController(BookingService bookingService, IHttpContextAccessor httpContext)
    {
        _bookingService = bookingService;
        _httpContext = httpContext;
    }

    private int CurrentUserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string CurrentRole => User.FindFirst(ClaimTypes.Role)!.Value;

    // POST: api/bookings (Customer)
    [HttpPost]
    public async Task<ActionResult<ApiResponseDto>> Create([FromForm] CreateBookingDto dto)
    {
        var booking = await _bookingService.CreateBookingAsync(CurrentUserId, dto);
        return CreatedAtAction(nameof(GetCustomerBookings), new ApiResponseDto
        {
            Success = true,
            Message = "Booking created successfully",
            Data = booking
        });
    }

    // GET: api/bookings/my (Customer)
    [HttpGet("my")]
    public async Task<ActionResult<ApiResponseDto>> GetCustomerBookings()
    {
        var bookings = await _bookingService.GetCustomerBookingsAsync(CurrentUserId);
        return Ok(new ApiResponseDto { Success = true, Data = bookings });
    }

    // GET: api/bookings/technician/my (Technician)
    [HttpGet("technician/my")]
    public async Task<ActionResult<ApiResponseDto>> GetTechnicianBookings()
    {
        var technicianId = GetCurrentTechnicianId();
        var bookings = await _bookingService.GetTechnicianBookingsAsync(technicianId);
        return Ok(new ApiResponseDto { Success = true, Data = bookings });
    }

    // GET: api/bookings/available (Technician)
    [HttpGet("available")]
    public async Task<ActionResult<ApiResponseDto>> GetAvailableJobs()
    {
        var technicianId = GetCurrentTechnicianId();
        var jobs = await _bookingService.GetAvailableJobsAsync(technicianId);
        return Ok(new ApiResponseDto { Success = true, Data = jobs });
    }

    // POST: api/bookings/{id}/accept (Technician)
    [HttpPost("{id}/accept")]
    public async Task<ActionResult<ApiResponseDto>> Accept(int id)
    {
        var technicianId = GetCurrentTechnicianId();
        var booking = await _bookingService.AcceptBookingAsync(technicianId, id);
        return Ok(new ApiResponseDto { Success = true, Message = "Booking accepted", Data = booking });
    }

    // PUT: api/bookings/{id}/status (Technician)
    [HttpPut("{id}/status")]
    public async Task<ActionResult<ApiResponseDto>> UpdateStatus(int id, [FromBody] UpdateBookingStatusDto dto)
    {
        var technicianId = GetCurrentTechnicianId();
        var booking = await _bookingService.UpdateStatusAsync(technicianId, id, dto.Status);
        return Ok(new ApiResponseDto { Success = true, Data = booking });
    }

    private int GetCurrentTechnicianId()
    {
        var techIdClaim = User.FindFirst("TechnicianID");
        if (techIdClaim == null) throw new UnauthorizedAccessException("Technician not found");
        return int.Parse(techIdClaim.Value);
    }
}
}