
// Repositories/ICustomerRepository.cs
using ConstructionApp.Api.Models;

namespace ConstructionApp.Api.Repositories
{
    public interface ICustomerRepository
    {
        Task<User?> GetCustomerByIdAsync(int userId);
        Task UpdateAsync(User user);
    }
}