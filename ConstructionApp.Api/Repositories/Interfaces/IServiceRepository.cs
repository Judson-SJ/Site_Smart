// Repositories/Interfaces/IServiceRepository.cs
using ConstructionApp.Api.Models;

namespace ConstructionApp.Api.Repositories.Interfaces
{
    public interface IServiceRepository
    {
        Task<IEnumerable<Service>> GetAllWithCategoryAsync();
        Task<Service?> GetByIdAsync(int id);
        Task<Service?> GetByIdWithBookingsAsync(int id);
        Task<Service> AddAsync(Service service);
        Task UpdateAsync(Service service);
        Task DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
        Task<bool> HasBookingsAsync(int id);
        Task<IEnumerable<Service>> GetByCategoryIdAsync(int categoryId);
        Task<IEnumerable<Service>> SearchByNameAsync(string name);
    }
}