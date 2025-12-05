// Repositories/CustomerRepository.cs
using ConstructionApp.Api.Data;
using ConstructionApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ConstructionApp.Api.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly AppDbContext _context;

        public CustomerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetCustomerByIdAsync(int userId)
            => await _context.Users.FindAsync(userId);

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }
}