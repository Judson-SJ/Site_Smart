using System;
using System.Collections.Generic;
using System.Security.Claims;
using AutoMapper;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.Repositories.Interfaces;
using ConstructionApp.Api.Exceptions;
using ConstructionApp.Api.Helpers;
using Microsoft.AspNetCore.Http;

namespace ConstructionApp.Api.Services;

public class BookingService
{
    private readonly IBookingRepository _bookingRepo;
    private readonly IServiceRepository _serviceRepo;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContext;
    private readonly IWebHostEnvironment _env; // ← Needed for file upload

    public BookingService(
        IBookingRepository bookingRepo,
        IServiceRepository serviceRepo,
        IMapper mapper,
        IHttpContextAccessor httpContext,
        IWebHostEnvironment env) // ← Add this parameter
    {
        _bookingRepo = bookingRepo;
        _serviceRepo = serviceRepo;
        _mapper = mapper;
        _httpContext = httpContext;
        _env = env;
    }

    private int CurrentUserId => int.Parse(_httpContext.HttpContext!.User
        .FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // Customer creates booking
    public async Task<BookingDto> CreateBookingAsync(int customerId, CreateBookingDto dto, IFormFile? referenceImage = null)
    {
        var service = await _serviceRepo.GetByIdAsync(dto.ServiceID)
            ?? throw new NotFoundException("Service not found");

        string? imageUrl = null;
        if (referenceImage != null)
        {
            imageUrl = await FileUploadHelper.SaveImageAsync(referenceImage, _env);
        }

        var booking = new Booking
        {
            UserID = customerId,
            ServiceID = dto.ServiceID,
            Description = dto.Description,
            AddressID = dto.AddressID,
            PreferredStartDateTime = dto.PreferredStartDateTime,
            PreferredEndDateTime = dto.PreferredEndDateTime,
            Status = "Pending",
            TotalAmount = service.FixedRate,
            BookingDate = DateTime.UtcNow,
            ReferenceImage = imageUrl
        };

        var created = await _bookingRepo.AddAsync(booking);

        return _mapper.Map<BookingDto>(created);
    }

    // Technician accepts booking
    public async Task<BookingDto> AcceptBookingAsync(int technicianId, int bookingId)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId)
            ?? throw new NotFoundException("Booking not found");

        if (booking.Status != "Pending")
            throw new InvalidOperationException("Booking is no longer available");

        booking.TechnicianID = technicianId;
        booking.Status = "Accepted";
        await _bookingRepo.UpdateAsync(booking);

        return _mapper.Map<BookingDto>(booking);
    }

    // Technician updates status
    public async Task<BookingDto> UpdateStatusAsync(int technicianId, int bookingId, string newStatus)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId)
            ?? throw new NotFoundException("Booking not found");

        if (booking.TechnicianID != technicianId)
            throw new UnauthorizedAccessException("Not authorized");

        if (booking.Status == "Completed" || booking.Status == "Cancelled")
            throw new InvalidOperationException("Booking is already finalized");

        var validTransitions = new Dictionary<string, string[]>
        {
            ["Accepted"] = new[] { "InProgress", "Cancelled" },
            ["InProgress"] = new[] { "Completed" }
        };

        if (!validTransitions.GetValueOrDefault(booking.Status, Array.Empty<string>()).Contains(newStatus))
            throw new InvalidOperationException($"Cannot change status from {booking.Status} to {newStatus}");

        booking.Status = newStatus;
        if (newStatus == "Completed")
            booking.WorkCompletionDateTime = DateTime.UtcNow;

        await _bookingRepo.UpdateAsync(booking);

        return _mapper.Map<BookingDto>(booking);
    }

    // Get customer's bookings
    public async Task<IEnumerable<BookingDto>> GetCustomerBookingsAsync(int customerId)
    {
        var bookings = await _bookingRepo.GetByCustomerIdAsync(customerId);
        return _mapper.Map<IEnumerable<BookingDto>>(bookings);
    }

    // Get technician's bookings
    public async Task<IEnumerable<BookingDto>> GetTechnicianBookingsAsync(int technicianId)
    {
        var bookings = await _bookingRepo.GetByTechnicianIdAsync(technicianId);
        return _mapper.Map<IEnumerable<BookingDto>>(bookings);
    }

    // Get available (pending) jobs for technician
    public async Task<IEnumerable<BookingDto>> GetAvailableJobsAsync(int technicianId)
    {
        var bookings = await _bookingRepo.GetPendingBookingsForTechnicianAsync(technicianId);
        return _mapper.Map<IEnumerable<BookingDto>>(bookings);
    }
}