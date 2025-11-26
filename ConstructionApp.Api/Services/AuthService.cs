using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Helpers;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.Repositories.Interfaces;

namespace ConstructionApp.Api.Services
{
    public class AuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly JwtTokenHelper _jwtHelper;

        public AuthService(IUserRepository userRepo, JwtTokenHelper jwtHelper)
        {
            _userRepo = userRepo;
            _jwtHelper = jwtHelper;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            var existing = await _userRepo.GetByEmailAsync(dto.Email);
            if (existing != null)
                return new AuthResponseDto { Success = false, Message = "Email already exists" };

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = PasswordHasher.Hash(dto.Password),
                Role = dto.Role
            };

            await _userRepo.AddAsync(user);

            if (dto.Role == "Technician")
            {
                // Auto-create technician profile
                var technician = new Technician
                {
                    UserID = user.UserID,
                    ExperienceYears = 0,
                    VerificationStatus = "Pending"
                };
                // Save via context if needed later
            }

            return new AuthResponseDto
            {
                Success = true,
                Message = "Registered successfully",
                Role = user.Role,
                RedirectUrl = GetDashboardUrl(user.Role)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _userRepo.GetByEmailAsync(dto.Email);
            if (user == null || !PasswordHasher.Verify(dto.Password, user.PasswordHash))
                return new AuthResponseDto { Success = false, Message = "Invalid credentials" };

            if (user.Role == "Technician" && user.Technician?.VerificationStatus != "Verified")
                return new AuthResponseDto { Success = false, Message = "Technician not verified yet" };

            var token = _jwtHelper.GenerateToken(user);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                Role = user.Role,
                RedirectUrl = GetDashboardUrl(user.Role)
            };
        }

        private string GetDashboardUrl(string role) => role switch
        {
            "Customer" => "/customer/dashboard",
            "Technician" => "/technician/dashboard",
            "Admin" => "/admin/dashboard",
            _ => "/login"
        };
    }
}