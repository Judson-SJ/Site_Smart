using System;
using ConstructionApp.Api.Models;


namespace ConstructionApp.Api.Repositories.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(int id);
    Task<Booking> AddAsync(Booking booking);
    Task UpdateAsync(Booking booking);
    Task<IEnumerable<Booking>> GetPendingBookingsForTechnicianAsync(int technicianId);
    Task<IEnumerable<Booking>> GetByCustomerIdAsync(int customerId);
    Task<IEnumerable<Booking>> GetByTechnicianIdAsync(int technicianId);
}