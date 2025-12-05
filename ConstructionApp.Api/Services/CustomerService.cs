// Services/CustomerService.cs
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Repositories;

namespace ConstructionApp.Api.Services
{
    public class CustomerService
    {
        private readonly ICustomerRepository _customerRepo;
        private readonly int _userId;

        public CustomerService(ICustomerRepository customerRepo, IHttpContextAccessor http)
        {
            _customerRepo = customerRepo;
            _userId = int.Parse(http.HttpContext!.User.FindFirst("UserID")!.Value);
        }

        public async Task<CustomerProfileDto> GetProfileAsync()
        {
            var user = await _customerRepo.GetCustomerByIdAsync(_userId)
                       ?? throw new KeyNotFoundException("User not found");

            return new CustomerProfileDto
            {
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone ?? "",
                ProfileImage = user.ProfileImage ?? ""
            };
        }

        public async Task UpdateProfileAsync(UpdateCustomerProfileRequest req)
        {
            var user = await _customerRepo.GetCustomerByIdAsync(_userId)
                       ?? throw new KeyNotFoundException();

            user.FullName = req.FullName?.Trim() ?? user.FullName;
            user.Phone = req.Phone?.Trim();

            if (!string.IsNullOrEmpty(req.ProfileImage))
                user.ProfileImage = req.ProfileImage;

            await _customerRepo.UpdateAsync(user);
        }
    }
}