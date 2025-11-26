
// Repositories/Implementations/ServiceRepository.cs
using ConstructionApp.Api.Data;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ConstructionApp.Api.Repositories.Implementations
{
    public class ServiceRepository : IServiceRepository
    {
        private readonly AppDbContext _context;

        public ServiceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Service>> GetAllWithCategoryAsync()
        {
            return await _context.Services
                .Include(s => s.Category)
                .OrderBy(s => s.ServiceName)
                .ToListAsync();
        }

        public async Task<Service?> GetByIdAsync(int id)
        {
            return await _context.Services
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s => s.ServiceID == id);
        }

        public async Task<Service?> GetByIdWithBookingsAsync(int id)
        {
            return await _context.Services
                .Include(s => s.Category)
                .Include(s => s.Bookings)
                .FirstOrDefaultAsync(s => s.ServiceID == id);
        }

        public async Task<Service> AddAsync(Service service)
        {
            _context.Services.Add(service);
            await _context.SaveChangesAsync();
            return service;
        }

        public async Task UpdateAsync(Service service)
        {
            _context.Services.Update(service);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service != null)
            {
                _context.Services.Remove(service);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Services.AnyAsync(s => s.ServiceID == id);
        }

        public async Task<bool> HasBookingsAsync(int id)
        {
            return await _context.Bookings.AnyAsync(b => b.ServiceID == id);
        }

        public async Task<IEnumerable<Service>> GetByCategoryIdAsync(int categoryId)
        {
            return await _context.Services
                .Include(s => s.Category)
                .Where(s => s.CategoryID == categoryId)
                .OrderBy(s => s.ServiceName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Service>> SearchByNameAsync(string name)
        {
            return await _context.Services
                .Include(s => s.Category)
                .Where(s => s.ServiceName.Contains(name, StringComparison.OrdinalIgnoreCase))
                .OrderBy(s => s.ServiceName)
                .ToListAsync();
        }
    }
}