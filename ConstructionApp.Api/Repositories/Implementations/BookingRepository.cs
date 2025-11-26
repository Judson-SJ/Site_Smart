// Repositories/Implementations/BookingRepository.cs
using ConstructionApp.Api.Data;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ConstructionApp.Api.Repositories.Implementations;
 public class BookingRepository : IBookingRepository
    {
        private readonly AppDbContext _context;

        public BookingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetByIdAsync(int id)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Technician).ThenInclude(t => t!.User)
                .Include(b => b.Service).ThenInclude(s => s!.CategoryID)
                .Include(b => b.Address)
                .FirstOrDefaultAsync(b => b.BookingID == id);
        }

        public async Task<Booking> AddAsync(Booking booking)
        {
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        public async Task UpdateAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Booking>> GetByCustomerIdAsync(int customerId)
        {
            return await _context.Bookings
                .Where(b => b.UserID == customerId)
                .Include(b => b.Service).ThenInclude(s => s!.CategoryID)
                .Include(b => b.Technician).ThenInclude(t => t!.User)
                .Include(b => b.Address)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetByTechnicianIdAsync(int technicianId)
        {
            return await _context.Bookings
                .Where(b => b.TechnicianID == technicianId)
                .Include(b => b.User)
                .Include(b => b.Service).ThenInclude(s => s!.CategoryID)
                .Include(b => b.Address)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }

        // All pending bookings (for broadcast to nearby technicians)
        public async Task<IEnumerable<Booking>> GetPendingBookingsAsync()
        {
            return await _context.Bookings
                .Where(b => b.Status == "Pending")
                .Include(b => b.Service)
                .Include(b => b.User)
                .Include(b => b.Address)
                .OrderBy(b => b.BookingDate)
                .ToListAsync();
        }

        // Optional: Filter by technician skills/location later
        public async Task<IEnumerable<Booking>> GetAvailableBookingsForTechnicianAsync(int technicianId)
        {
            // For now: return all pending bookings
            // Later: add location/skill filtering
            return await GetPendingBookingsAsync();
        }

    public Task<IEnumerable<Booking>> GetPendingBookingsForTechnicianAsync(int technicianId)
    {
        throw new NotImplementedException();
    }
}
