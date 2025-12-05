// Helpers/JwtTokenHelper.cs → FINAL BOMB VERSION — CASE PERFECT!
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ConstructionApp.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace ConstructionApp.Api.Helpers
{
    public class JwtTokenHelper
    {
        private readonly IConfiguration _config;

        public JwtTokenHelper(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config["Jwt:Key"] ?? "your-super-secret-key-must-be-32-chars-long!!!"
            ));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // இதுதான் உன் LIFE SAVER — எல்லாம் EXACT SAME NAME ஆ இருக்கு!
            var claims = new List<Claim>
            {
                new Claim("UserID", user.UserID.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, user.UserID.ToString()),
                new Claim(JwtRegisteredClaimNames.Name, user.FullName ?? "User"),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),

                // ANGULAR-L EXACTLY இதே NAME-ல எடுக்கும்!
                new Claim("fullName", user.FullName ?? "User"),        // ← இது முக்கியம்!
                new Claim("email", user.Email ?? ""),                  // ← இதுவும்!
                new Claim("phone", user.Phone ?? ""),
                new Claim("profileImage", user.ProfileImage ?? ""),
                new Claim("role", user.Role ?? "Customer"),

                // Extra backup claims
                new Claim(ClaimTypes.Role, user.Role ?? "Customer")
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}