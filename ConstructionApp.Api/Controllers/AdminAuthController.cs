// File: Controllers/AdminAuthController.cs
using ConstructionApp.Api.Data;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.Helpers;
using ConstructionApp.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net; // BCrypt.Net-Next package இருக்கணும்!

namespace ConstructionApp.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AdminAuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtTokenHelper _jwt;

        public AdminAuthController(AppDbContext db, JwtTokenHelper jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        // POST: /api/auth/admin-login
        [HttpPost("admin-login")]
        public async Task<IActionResult> AdminLogin([FromBody] AdminLoginDto dto)
        {
            // Null & empty check
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { success = false, message = "Email and password are required" });

            var adminUser = await _db.Users
                .Include(u => u.Admin)
                .FirstOrDefaultAsync(u => 
                    u.Email.Trim().ToLower() == dto.Email.Trim().ToLower() && 
                    u.Admin != null);

            if (adminUser == null)
                return Unauthorized(new { success = false, message = "Invalid email or password" });

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, adminUser.PasswordHash))
                return Unauthorized(new { success = false, message = "Invalid email or password" });

            if (!adminUser.EmailConfirmed)
                return Unauthorized(new { success = false, message = "Please verify your email first" });

            // Update last login
            if (adminUser.Admin != null)
            {
                adminUser.Admin.LastLoginAt = DateTime.UtcNow;
                adminUser.Admin.LastLoginIP = HttpContext.Connection.RemoteIpAddress?.ToString();
            }

            await _db.SaveChangesAsync();

            var token = _jwt.GenerateToken(adminUser);

            return Ok(new
            {
                success = true,
                message = "Login successful",
                token,
                name = adminUser.FullName,
                email = adminUser.Email,
                adminLevel = adminUser.Admin?.AdminLevel ?? "SuperAdmin"
            });
        }

        // POST: /api/auth/create-super-admin (Run once only!)
        [HttpPost("create-super-admin")]
        public async Task<IActionResult> CreateSuperAdmin([FromBody] CreateAdminDto dto)
        {
            if (dto == null)
                return BadRequest("Request body is required");

            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required");

            if (await _db.Users.AnyAsync(u => u.Email.Trim().ToLower() == dto.Email.Trim().ToLower()))
                return Conflict("Email already exists");

            if (await _db.Admins.AnyAsync())
                return Conflict("Super Admin already exists!");

            var user = new User
            {
                FullName = string.IsNullOrWhiteSpace(dto.FullName) ? "Super Admin" : dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLower(),
                Phone = dto.Phone?.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Admin",
                Status = "Active",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var admin = new Admin
            {
                User = user,
                AdminLevel = "SuperAdmin",
                CanManageUsers = true,
                CanManageServices = true,
                CanViewReports = true,
                LastLoginAt = DateTime.UtcNow,
                LastLoginIP = "127.0.0.1"
            };

            _db.Users.Add(user);
            _db.Admins.Add(admin);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Super Admin created successfully!",
                email = user.Email,
                name = user.FullName,
                role = user.Role
            });
        }
    }

  
}